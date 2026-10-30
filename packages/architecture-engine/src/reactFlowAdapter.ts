import { ArchitectureGraph, ArchitectureNode, ArchitectureEdge } from "../../shared/dist/index.js";

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    path?: string;
    kind: string;
    moduleGroup?: string;
    isModified?: boolean;
    modifiedAt?: string;
    metrics?: ArchitectureNode["metrics"];
    rawNode: ArchitectureNode;
  };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  data?: {
    kind: string;
    specifiers?: string[];
    isDynamic?: boolean;
    isTypeOnly?: boolean;
  };
}

export interface ReactFlowGraphData {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

/**
 * Transforms an ArchitectureGraph into React Flow compatible node and edge structures
 * with an initial grid layout algorithm.
 */
export function toReactFlowGraph(graph: ArchitectureGraph): ReactFlowGraphData {
  const rfNodes: ReactFlowNode[] = [];
  const rfEdges: ReactFlowEdge[] = [];

  // Simple deterministic grid layout for initial render
  const columns = Math.max(3, Math.ceil(Math.sqrt(graph.nodes.length)));
  const nodeWidth = 220;
  const nodeHeight = 80;
  const spacingX = 80;
  const spacingY = 80;

  graph.nodes.forEach((node: ArchitectureNode, index: number) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    rfNodes.push({
      id: node.id,
      type: node.kind === "file" ? "fileNode" : "moduleNode",
      position: {
        x: col * (nodeWidth + spacingX),
        y: row * (nodeHeight + spacingY)
      },
      data: {
        label: node.label,
        path: node.path,
        kind: node.kind,
        moduleGroup: node.moduleGroup,
        isModified: node.isModified,
        modifiedAt: node.modifiedAt,
        metrics: node.metrics,
        rawNode: node
      }
    });
  });

  for (const edge of graph.edges) {
    rfEdges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: edge.isDynamic,
      data: {
        kind: edge.kind,
        specifiers: edge.specifiers,
        isDynamic: edge.isDynamic,
        isTypeOnly: edge.isTypeOnly
      }
    });
  }

  return {
    nodes: rfNodes,
    edges: rfEdges
  };
}
