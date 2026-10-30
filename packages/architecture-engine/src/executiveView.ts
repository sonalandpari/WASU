import * as path from "path";
import {
  ArchitectureGraph,
  ArchitectureNode,
  ArchitectureEdge
} from "../../shared/dist/index.js";
import { buildNodeId, buildEdgeId, SCANNER_VERSION } from "./graphGenerator.js";

export interface GroupingRule {
  name: string;
  pattern: RegExp | ((relativePath: string) => boolean);
  description?: string;
}

export const DEFAULT_GROUPING_RULES: GroupingRule[] = [
  {
    name: "Frontend",
    pattern: /(apps\/webview|apps\/frontend|\/components\/|\/views\/|\/ui\/|^pages\/|^app\/)/i,
    description: "UI and Webview presentation components"
  },
  {
    name: "Backend",
    pattern: /(apps\/backend|apps\/server|apps\/api|\/server\/|\/controllers\/|\/routes\/)/i,
    description: "Backend services, APIs and server logic"
  },
  {
    name: "Database",
    pattern: /(src\/db|prisma|database|\/models\/|\/repositories\/)/i,
    description: "Database models, migrations and repositories"
  },
  {
    name: "Architecture Engine",
    pattern: /(packages\/architecture-engine|\/architecture\/|\/scanner\/)/i,
    description: "Repository scanner and dependency analysis engine"
  },
  {
    name: "Shared Utilities",
    pattern: /(packages\/shared|\/shared\/|\/utils\/|\/helpers\/|\/common\/)/i,
    description: "Shared contracts, utilities and common helpers"
  },
  {
    name: "VS Code Extension",
    pattern: /(apps\/extension|\/extension\/|\/commands\/)/i,
    description: "VS Code extension host and editor integration"
  }
];

export interface ExecutiveClusterResult {
  executiveGraph: ArchitectureGraph;
  fileToModuleMap: Map<string, string>;
}

/**
 * Determines the module group name for a given file path based on grouping rules
 * and fallback folder structure.
 */
export function determineModuleGroup(
  relativePath: string,
  customRules: GroupingRule[] = DEFAULT_GROUPING_RULES
): string {
  const normalizedPath = relativePath.replace(/\\/g, "/");

  for (const rule of customRules) {
    if (typeof rule.pattern === "function") {
      if (rule.pattern(normalizedPath)) {
        return rule.name;
      }
    } else if (rule.pattern.test(normalizedPath)) {
      return rule.name;
    }
  }

  // Fallback to top-level folder name or 'Core'
  const parts = normalizedPath.split("/");
  if (parts.length > 1) {
    const topFolder = parts[0];
    return topFolder.charAt(0).toUpperCase() + topFolder.slice(1);
  }

  return "Core";
}

/**
 * Transforms a detailed technical ArchitectureGraph into an Executive ArchitectureGraph
 * by aggregating file-level nodes into high-level module nodes and synthesizing module-to-module edges.
 */
export function generateExecutiveView(
  technicalGraph: ArchitectureGraph,
  customRules: GroupingRule[] = DEFAULT_GROUPING_RULES
): ExecutiveClusterResult {
  const fileToModuleMap = new Map<string, string>();
  const moduleNodeMap = new Map<string, ArchitectureNode>();
  const moduleEdgeMap = new Map<string, ArchitectureEdge>();

  // 1. Assign each file node to a module group
  for (const node of technicalGraph.nodes) {
    if (node.kind === "file" && node.path) {
      const groupName = determineModuleGroup(node.path, customRules);
      node.moduleGroup = groupName; // tag original node as well
      fileToModuleMap.set(node.id, groupName);

      const moduleId = buildNodeId("module", groupName);
      if (!moduleNodeMap.has(moduleId)) {
        moduleNodeMap.set(moduleId, {
          id: moduleId,
          label: groupName,
          kind: "module",
          metrics: {
            linesOfCode: 0,
            inDegree: 0,
            outDegree: 0
          },
          data: {
            memberCount: 0,
            memberFileIds: [] as string[]
          }
        });
      }

      const mod = moduleNodeMap.get(moduleId)!;
      if (mod.metrics && node.metrics) {
        mod.metrics.linesOfCode = (mod.metrics.linesOfCode || 0) + (node.metrics.linesOfCode || 0);
      }
      const data = mod.data as { memberCount: number; memberFileIds: string[] };
      data.memberCount += 1;
      data.memberFileIds.push(node.id);
    } else if (node.kind === "package") {
      // Keep package nodes or cluster them into "External Dependencies"
      const extGroupName = "External Packages";
      const extModuleId = buildNodeId("module", extGroupName);
      fileToModuleMap.set(node.id, extGroupName);

      if (!moduleNodeMap.has(extModuleId)) {
        moduleNodeMap.set(extModuleId, {
          id: extModuleId,
          label: extGroupName,
          kind: "module",
          metrics: { linesOfCode: 0, inDegree: 0, outDegree: 0 },
          data: { memberCount: 0, memberFileIds: [] as string[] }
        });
      }
      const extMod = moduleNodeMap.get(extModuleId)!;
      const data = extMod.data as { memberCount: number; memberFileIds: string[] };
      data.memberCount += 1;
      data.memberFileIds.push(node.id);
    }
  }

  // 2. Aggregate edges between module clusters
  for (const edge of technicalGraph.edges) {
    const sourceModule = fileToModuleMap.get(edge.source);
    const targetModule = fileToModuleMap.get(edge.target);

    if (sourceModule && targetModule && sourceModule !== targetModule) {
      const sourceModuleId = buildNodeId("module", sourceModule);
      const targetModuleId = buildNodeId("module", targetModule);
      const edgeId = buildEdgeId(sourceModuleId, targetModuleId);

      if (!moduleEdgeMap.has(edgeId)) {
        moduleEdgeMap.set(edgeId, {
          id: edgeId,
          source: sourceModuleId,
          target: targetModuleId,
          kind: "imports"
        });
      }
    }
  }

  // 3. Compute degree metrics for modules
  for (const edge of moduleEdgeMap.values()) {
    const src = moduleNodeMap.get(edge.source);
    if (src && src.metrics) {
      src.metrics.outDegree = (src.metrics.outDegree || 0) + 1;
    }
    const tgt = moduleNodeMap.get(edge.target);
    if (tgt && tgt.metrics) {
      tgt.metrics.inDegree = (tgt.metrics.inDegree || 0) + 1;
    }
  }

  const sortedNodes = Array.from(moduleNodeMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const sortedEdges = Array.from(moduleEdgeMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  return {
    executiveGraph: {
      nodes: sortedNodes,
      edges: sortedEdges,
      generatedAt: new Date().toISOString(),
      scannerVersion: SCANNER_VERSION
    },
    fileToModuleMap
  };
}
