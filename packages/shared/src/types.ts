export type NodeKind = "file" | "module" | "package";

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: NodeKind;
  path?: string;
  moduleGroup?: string;
  modifiedAt?: string;
  isModified?: boolean;
  metrics?: {
    inDegree?: number;
    outDegree?: number;
    linesOfCode?: number;
  };
  data?: Record<string, unknown>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  kind: "imports";
  specifiers?: string[];
  isDynamic?: boolean;
  isTypeOnly?: boolean;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  generatedAt: string;
  scannerVersion: string;
  unresolvedImports?: Array<{
    sourceFile: string;
    rawSpecifier: string;
  }>;
}

export interface IncrementalUpdateResult {
  graph: ArchitectureGraph;
  changedNodeIds: string[];
  removedNodeIds: string[];
  addedNodeIds: string[];
}

