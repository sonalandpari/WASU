# Architecture Engine Integration Guide (Person 3 Deliverables)

This document provides clear integration instructions for **Person 1 (Backend Lead)** and **Person 2 (Frontend / Webview Lead)** to consume the Architecture Engine (`@contextflow/architecture-engine`).

---

## 1. Package Overview

- **Package Location**: `packages/architecture-engine`
- **Shared Contracts**: `packages/shared/src/types.ts`
- **Core Exports**:
  - `generateArchitectureGraph(options)`: Full repository AST dependency scan.
  - `IncrementalGraphEngine`: In-memory incremental update engine with debouncing, cache, and modified node tracking.
  - `toReactFlowGraph(architectureGraph)`: Formatter converting `ArchitectureGraph` into React Flow nodes and edges.
  - `generateExecutiveView(technicalGraph, customRules?)`: Collapses file-level dependencies into executive module clusters.

---

## 2. Integration with Person 1 (Backend Lead)

### REST & Socket.IO Endpoints
Person 1 stores architecture snapshots in SQLite/Prisma and broadcasts realtime updates over Socket.IO:

#### Getting the Graph for a Workspace
```typescript
import { generateArchitectureGraph, IncrementalGraphEngine } from "@contextflow/architecture-engine";

// Full scan
const graph = generateArchitectureGraph({
  workspaceRoot: projectWorkspacePath,
  includeExternalPackages: false
});

// Broadcast or store snapshot:
// await prisma.architectureSnapshot.create({ data: { projectId, graphJson: JSON.stringify(graph) } });
// io.to(projectId).emit("ARCHITECTURE_UPDATED", graph);
```

#### Handling Incremental Updates from VS Code Extension Events
When VS Code reports a file save, creation, or deletion:
```typescript
const engine = new IncrementalGraphEngine({
  workspaceRoot: projectWorkspacePath,
  debounceDelayMs: 300
});

// Queue debounced events:
engine.queueFileEvent(
  { type: "change", filePath: changedFilePath },
  (updateResult) => {
    // updateResult contains:
    // - graph: ArchitectureGraph
    // - changedNodeIds: string[] (highlighted with isModified=true)
    // - addedNodeIds: string[]
    // - removedNodeIds: string[]
    
    // Broadcast targeted realtime event
    io.to(projectId).emit("ARCHITECTURE_NODE_MODIFIED", {
      changedNodeIds: updateResult.changedNodeIds,
      graph: updateResult.graph
    });
  }
);
```

---

## 3. Integration with Person 2 (Frontend & Webview Lead)

### React Flow Rendering (`@xyflow/react`)
Person 2 renders the dependency visualization using React Flow. We provide a ready-to-use adapter `toReactFlowGraph`:

```tsx
import React, { useMemo } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import { toReactFlowGraph, generateExecutiveView } from "@contextflow/architecture-engine";
import type { ArchitectureGraph } from "@contextflow/shared";

interface Props {
  rawGraph: ArchitectureGraph;
  viewMode: "technical" | "executive";
}

export const ArchitectureView: React.FC<Props> = ({ rawGraph, viewMode }) => {
  const displayGraph = useMemo(() => {
    if (viewMode === "executive") {
      const { executiveGraph } = generateExecutiveView(rawGraph);
      return executiveGraph;
    }
    return rawGraph;
  }, [rawGraph, viewMode]);

  const { nodes, edges } = useMemo(() => toReactFlowGraph(displayGraph), [displayGraph]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
```

### Highlighting Modified Nodes
When a node is modified, `node.data.isModified === true` and `node.data.modifiedAt` is set.
Person 2's custom node component can simply inspect `data.isModified` to apply a glowing pulse or border:

```tsx
export function CustomFileNode({ data }: { data: any }) {
  return (
    <div className={`node-container ${data.isModified ? "ring-2 ring-blue-500 animate-pulse" : ""}`}>
      <span className="font-semibold">{data.label}</span>
      <span className="text-xs text-gray-400">{data.metrics?.linesOfCode} LOC</span>
    </div>
  );
}
```

---

## 4. Contract Schema Definition

```typescript
export interface ArchitectureNode {
  id: string;               // e.g., "file:src/index.ts" or "mod:Frontend"
  label: string;            // e.g., "index.ts" or "Frontend"
  kind: "file" | "module" | "package";
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
  id: string;               // e.g., "edge:file:a.ts->file:b.ts"
  source: string;
  target: string;
  kind: "imports";
  specifiers?: string[];
  isDynamic?: boolean;
  isTypeOnly?: boolean;
}
```

---

## 5. Sample Graph Data
A pre-generated sample graph based on this repository is available at:
`packages/architecture-engine/sample-graph.json`

