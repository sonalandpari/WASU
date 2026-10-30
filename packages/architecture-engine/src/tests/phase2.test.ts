import test from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import * as fs from "fs";
import { generateArchitectureGraph, buildNodeId, buildEdgeId } from "../graphGenerator.js";
import { toReactFlowGraph } from "../reactFlowAdapter.js";

test("generateArchitectureGraph accurately detects dependencies, circular refs and external packages", () => {
  const tempDir = path.join(__dirname, "temp_graph_test");
  fs.mkdirSync(tempDir, { recursive: true });

  // A imports B, B imports A (circular), A imports external 'lodash', B imports C (re-export)
  fs.writeFileSync(path.join(tempDir, "a.ts"), "import { b } from './b'; import lodash from 'lodash'; export const a = 1;");
  fs.writeFileSync(path.join(tempDir, "b.ts"), "import { a } from './a'; export { c } from './c'; export const b = 2;");
  fs.writeFileSync(path.join(tempDir, "c.ts"), "export const c = 3;");

  try {
    const graph = generateArchitectureGraph({
      workspaceRoot: tempDir,
      includeExternalPackages: true
    });

    assert.equal(graph.scannerVersion, "1.0.0");
    // Nodes: a.ts, b.ts, c.ts + pkg:lodash
    const nodeIds = graph.nodes.map((n: any) => n.id);
    assert.ok(nodeIds.includes(buildNodeId("file", "a.ts")));
    assert.ok(nodeIds.includes(buildNodeId("file", "b.ts")));
    assert.ok(nodeIds.includes(buildNodeId("file", "c.ts")));
    assert.ok(nodeIds.includes(buildNodeId("package", "lodash")));

    // Edges
    const edgeIds = graph.edges.map((e: any) => e.id);
    assert.ok(edgeIds.includes(buildEdgeId("file:a.ts", "file:b.ts")));
    assert.ok(edgeIds.includes(buildEdgeId("file:b.ts", "file:a.ts"))); // Circular check
    assert.ok(edgeIds.includes(buildEdgeId("file:b.ts", "file:c.ts"))); // Re-export check
    assert.ok(edgeIds.includes(buildEdgeId("file:a.ts", "pkg:lodash")));

    // Degree metrics
    const nodeA = graph.nodes.find((n: any) => n.id === "file:a.ts");
    assert.equal(nodeA?.metrics?.outDegree, 2); // -> b.ts, -> lodash
    assert.equal(nodeA?.metrics?.inDegree, 1); // <- b.ts

    // React Flow Adapter Test
    const rf = toReactFlowGraph(graph);
    assert.equal(rf.nodes.length, graph.nodes.length);
    assert.equal(rf.edges.length, graph.edges.length);
    assert.ok(rf.nodes[0].position.x !== undefined);
    assert.ok(rf.nodes[0].position.y !== undefined);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
