import * as fs from "fs";
import * as path from "path";
import {
  ArchitectureGraph,
  ArchitectureNode,
  ArchitectureEdge,
  IncrementalUpdateResult
} from "../../shared/dist/index.js";
import {
  generateArchitectureGraph,
  buildNodeId,
  buildEdgeId,
  SCANNER_VERSION,
  GraphGeneratorOptions
} from "./graphGenerator.js";
import { extractDependenciesFromSource, ExtractedSourceMetadata } from "./astExtractor.js";
import { resolveDependencyPath } from "./resolver.js";
import { normalizeRelativePath, DEFAULT_SUPPORTED_EXTENSIONS, DEFAULT_EXCLUDE_PATTERNS } from "./scanner.js";

export type FileEventType = "create" | "change" | "delete";

export interface FileEvent {
  type: FileEventType;
  filePath: string; // Absolute or workspace-relative
  timestamp?: number;
}

export interface CachedFileInfo {
  relativePath: string;
  astAnalysis: ExtractedSourceMetadata;
  lineCount: number;
  lastModifiedAt: string;
}

/**
 * State store and incremental engine for Architecture Graph updates.
 */
export class IncrementalGraphEngine {
  private workspaceRoot: string;
  private options: GraphGeneratorOptions;
  private fileCache = new Map<string, CachedFileInfo>();
  private currentGraph: ArchitectureGraph | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingEvents: FileEvent[] = [];
  private debounceDelayMs: number;

  constructor(options: GraphGeneratorOptions & { debounceDelayMs?: number }) {
    this.workspaceRoot = path.resolve(options.workspaceRoot);
    this.options = options;
    this.debounceDelayMs = options.debounceDelayMs ?? 300;
  }

  /**
   * Performs an initial full scan and populates the cache.
   */
  public initialize(): ArchitectureGraph {
    this.currentGraph = generateArchitectureGraph(this.options);
    this.populateCacheFromCurrentFiles();
    return this.currentGraph;
  }

  /**
   * Returns current architecture graph.
   */
  public getGraph(): ArchitectureGraph {
    if (!this.currentGraph) {
      return this.initialize();
    }
    return this.currentGraph;
  }

  /**
   * Direct synchronization method to apply a batch of file events immediately.
   */
  public applyFileEvents(events: FileEvent[]): IncrementalUpdateResult {
    if (!this.currentGraph) {
      this.initialize();
    }

    const changedNodeIds = new Set<string>();
    const addedNodeIds = new Set<string>();
    const removedNodeIds = new Set<string>();

    for (const ev of events) {
      const relPath = this.toRelative(ev.filePath);
      if (!this.isSupportedFile(relPath)) {
        continue;
      }

      const nodeId = buildNodeId("file", relPath);

      if (ev.type === "delete") {
        this.fileCache.delete(relPath);
        removedNodeIds.add(nodeId);
      } else if (ev.type === "create") {
        const cached = this.parseAndCacheFile(relPath);
        if (cached) {
          addedNodeIds.add(nodeId);
          changedNodeIds.add(nodeId);
        }
      } else if (ev.type === "change") {
        const cached = this.parseAndCacheFile(relPath);
        if (cached) {
          changedNodeIds.add(nodeId);
        }
      }
    }

    // Reconstruct the graph from cache (extremely fast, no re-reading of un-modified ASTs)
    const updatedGraph = this.rebuildGraphFromCache(changedNodeIds);
    this.currentGraph = updatedGraph;

    return {
      graph: updatedGraph,
      changedNodeIds: Array.from(changedNodeIds),
      addedNodeIds: Array.from(addedNodeIds),
      removedNodeIds: Array.from(removedNodeIds)
    };
  }

  /**
   * Queues a file event with debouncing, calling the callback with the update result.
   */
  public queueFileEvent(
    event: FileEvent,
    onUpdated: (result: IncrementalUpdateResult) => void
  ): void {
    this.pendingEvents.push(event);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const batch = [...this.pendingEvents];
      this.pendingEvents = [];
      this.debounceTimer = null;
      const result = this.applyFileEvents(batch);
      onUpdated(result);
    }, this.debounceDelayMs);
  }

  /**
   * Full-scan fallback mechanism when incremental sync encounters inconsistencies.
   */
  public fullScanFallback(): IncrementalUpdateResult {
    const previousGraph = this.currentGraph;
    this.fileCache.clear();
    const newGraph = this.initialize();

    const oldIds = new Set(previousGraph?.nodes.map((n) => n.id) ?? []);
    const newIds = new Set(newGraph.nodes.map((n) => n.id));

    const added = [...newIds].filter((id) => !oldIds.has(id));
    const removed = [...oldIds].filter((id) => !newIds.has(id));
    const changed = [...newIds];

    return {
      graph: newGraph,
      changedNodeIds: changed,
      addedNodeIds: added,
      removedNodeIds: removed
    };
  }

  private toRelative(inputPath: string): string {
    if (path.isAbsolute(inputPath)) {
      return normalizeRelativePath(this.workspaceRoot, inputPath);
    }
    return inputPath.replace(/\\/g, "/");
  }

  private isSupportedFile(relPath: string): boolean {
    const ext = path.extname(relPath).toLowerCase();
    const supported = this.options.supportedExtensions ?? DEFAULT_SUPPORTED_EXTENSIONS;
    const excludes = this.options.excludePatterns ?? DEFAULT_EXCLUDE_PATTERNS;

    if (!supported.includes(ext) || relPath.endsWith(".d.ts")) {
      return false;
    }

    for (const ex of excludes) {
      if (relPath.startsWith(ex + "/") || relPath.includes("/" + ex + "/")) {
        return false;
      }
    }

    return true;
  }

  private parseAndCacheFile(relPath: string): CachedFileInfo | null {
    const absPath = path.join(this.workspaceRoot, relPath);
    if (!fs.existsSync(absPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(absPath, "utf-8");
      const lines = content.split("\n").length;
      const analysis = extractDependenciesFromSource(relPath, content);
      const cacheInfo: CachedFileInfo = {
        relativePath: relPath,
        astAnalysis: analysis,
        lineCount: lines,
        lastModifiedAt: new Date().toISOString()
      };
      this.fileCache.set(relPath, cacheInfo);
      return cacheInfo;
    } catch {
      return null;
    }
  }

  private populateCacheFromCurrentFiles(): void {
    if (!this.currentGraph) return;

    for (const node of this.currentGraph.nodes) {
      if (node.kind === "file" && node.path) {
        this.parseAndCacheFile(node.path);
      }
    }
  }

  private rebuildGraphFromCache(recentModifiedNodeIds: Set<string>): ArchitectureGraph {
    const nodeMap = new Map<string, ArchitectureNode>();
    const edgeMap = new Map<string, ArchitectureEdge>();
    const unresolvedImports: Array<{ sourceFile: string; rawSpecifier: string }> = [];

    // 1. Create nodes from cache
    for (const [relFile, info] of this.fileCache.entries()) {
      const nodeId = buildNodeId("file", relFile);
      const isModified = recentModifiedNodeIds.has(nodeId);

      nodeMap.set(nodeId, {
        id: nodeId,
        label: path.basename(relFile),
        kind: "file",
        path: relFile,
        isModified,
        modifiedAt: info.lastModifiedAt,
        metrics: {
          linesOfCode: info.lineCount,
          inDegree: 0,
          outDegree: 0
        },
        data: {
          extension: path.extname(relFile),
          directory: path.dirname(relFile).replace(/\\/g, "/")
        }
      });
    }

    // 2. Link dependencies
    for (const [relFile, info] of this.fileCache.entries()) {
      const sourceNodeId = buildNodeId("file", relFile);
      const allImports = [...info.astAnalysis.imports, ...info.astAnalysis.reExports];

      for (const imp of allImports) {
        const resolved = resolveDependencyPath(this.workspaceRoot, relFile, imp.rawSpecifier);

        if (resolved.isExternalPackage) {
          if (this.options.includeExternalPackages) {
            const pkgId = buildNodeId("package", resolved.rawSpecifier);
            if (!nodeMap.has(pkgId)) {
              nodeMap.set(pkgId, {
                id: pkgId,
                label: resolved.rawSpecifier,
                kind: "package",
                metrics: { inDegree: 0, outDegree: 0 }
              });
            }
            const edgeId = buildEdgeId(sourceNodeId, pkgId);
            if (!edgeMap.has(edgeId)) {
              edgeMap.set(edgeId, {
                id: edgeId,
                source: sourceNodeId,
                target: pkgId,
                kind: "imports",
                isDynamic: imp.isDynamic,
                isTypeOnly: imp.isTypeOnly,
                specifiers: imp.specifiers
              });
            }
          }
        } else if (resolved.resolvedRelativePath) {
          const targetNodeId = buildNodeId("file", resolved.resolvedRelativePath);
          if (!nodeMap.has(targetNodeId)) {
            nodeMap.set(targetNodeId, {
              id: targetNodeId,
              label: path.basename(resolved.resolvedRelativePath),
              kind: "file",
              path: resolved.resolvedRelativePath,
              metrics: { inDegree: 0, outDegree: 0 }
            });
          }

          const edgeId = buildEdgeId(sourceNodeId, targetNodeId);
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              source: sourceNodeId,
              target: targetNodeId,
              kind: "imports",
              isDynamic: imp.isDynamic,
              isTypeOnly: imp.isTypeOnly,
              specifiers: imp.specifiers
            });
          }
        } else {
          unresolvedImports.push({
            sourceFile: relFile,
            rawSpecifier: imp.rawSpecifier
          });
        }
      }
    }

    // 3. Compute in/out degrees
    for (const edge of edgeMap.values()) {
      const src = nodeMap.get(edge.source);
      if (src && src.metrics) {
        src.metrics.outDegree = (src.metrics.outDegree || 0) + 1;
      }
      const tgt = nodeMap.get(edge.target);
      if (tgt && tgt.metrics) {
        tgt.metrics.inDegree = (tgt.metrics.inDegree || 0) + 1;
      }
    }

    const sortedNodes = Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = Array.from(edgeMap.values()).sort((a, b) => a.id.localeCompare(b.id));

    return {
      nodes: sortedNodes,
      edges: sortedEdges,
      generatedAt: new Date().toISOString(),
      scannerVersion: SCANNER_VERSION,
      unresolvedImports
    };
  }
}

