import * as fs from "fs";
import * as path from "path";
import {
  ArchitectureGraph,
  ArchitectureNode,
  ArchitectureEdge
} from "../../shared/dist/index.js";
import { discoverWorkspaceFiles } from "./scanner.js";
import { extractDependenciesFromSource } from "./astExtractor.js";
import { resolveDependencyPath } from "./resolver.js";

export const SCANNER_VERSION = "1.0.0";

export interface GraphGeneratorOptions {
  workspaceRoot: string;
  supportedExtensions?: string[];
  excludePatterns?: string[];
  includeExternalPackages?: boolean;
}

export interface FileAnalysis {
  relativePath: string;
  dependencies: Array<{
    targetRelativePath: string | null;
    rawSpecifier: string;
    isExternal: boolean;
    isDynamic: boolean;
    isTypeOnly: boolean;
    specifiers: string[];
  }>;
  exports: string[];
  lineCount: number;
}

/**
 * Builds a deterministic node ID for a file or package.
 */
export function buildNodeId(kind: "file" | "package" | "module", normalizedPath: string): string {
  if (kind === "file") {
    return `file:${normalizedPath}`;
  }
  if (kind === "package") {
    return `pkg:${normalizedPath}`;
  }
  return `mod:${normalizedPath}`;
}

/**
 * Builds a deterministic edge ID between two nodes.
 */
export function buildEdgeId(sourceId: string, targetId: string): string {
  return `edge:${sourceId}->${targetId}`;
}

/**
 * Scans a workspace and generates a complete deterministic ArchitectureGraph.
 */
export function generateArchitectureGraph(options: GraphGeneratorOptions): ArchitectureGraph {
  const {
    workspaceRoot,
    supportedExtensions,
    excludePatterns,
    includeExternalPackages = false
  } = options;

  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const files = discoverWorkspaceFiles({
    workspaceRoot: normalizedWorkspaceRoot,
    supportedExtensions,
    excludePatterns
  });

  const nodeMap = new Map<string, ArchitectureNode>();
  const edgeMap = new Map<string, ArchitectureEdge>();
  const unresolvedImports: Array<{ sourceFile: string; rawSpecifier: string }> = [];

  // 1. Initialize file nodes
  for (const relFile of files) {
    const absPath = path.join(normalizedWorkspaceRoot, relFile);
    let lineCount = 0;
    try {
      const content = fs.readFileSync(absPath, "utf-8");
      lineCount = content.split("\n").length;
    } catch {
      // ignore read error
    }

    const nodeId = buildNodeId("file", relFile);
    nodeMap.set(nodeId, {
      id: nodeId,
      label: path.basename(relFile),
      kind: "file",
      path: relFile,
      metrics: {
        linesOfCode: lineCount,
        inDegree: 0,
        outDegree: 0
      },
      data: {
        extension: path.extname(relFile),
        directory: path.dirname(relFile).replace(/\\/g, "/")
      }
    });
  }

  // 2. Parse dependencies & build edges
  for (const relFile of files) {
    const sourceNodeId = buildNodeId("file", relFile);
    const absPath = path.join(normalizedWorkspaceRoot, relFile);

    let sourceContent = "";
    try {
      sourceContent = fs.readFileSync(absPath, "utf-8");
    } catch {
      continue;
    }

    const analysis = extractDependenciesFromSource(relFile, sourceContent);
    const allImports = [...analysis.imports, ...analysis.reExports];

    for (const imp of allImports) {
      const resolved = resolveDependencyPath(normalizedWorkspaceRoot, relFile, imp.rawSpecifier);

      if (resolved.isExternalPackage) {
        if (includeExternalPackages) {
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
        // Ensure target exists in nodeMap (could be an un-scanned file or normal file)
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
        // Unresolved local import
        unresolvedImports.push({
          sourceFile: relFile,
          rawSpecifier: imp.rawSpecifier
        });
      }
    }
  }

  // 3. Compute inDegree and outDegree metrics
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

  // Deterministic sorting of nodes and edges
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
