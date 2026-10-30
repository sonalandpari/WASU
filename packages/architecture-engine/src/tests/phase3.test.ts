import test from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import * as fs from "fs";
import { IncrementalGraphEngine } from "../incrementalEngine.js";

test("IncrementalGraphEngine handles updates, creations, deletions and modified node highlighting", () => {
  const tempDir = path.join(__dirname, "temp_inc_test");
  fs.mkdirSync(tempDir, { recursive: true });

  const fileA = path.join(tempDir, "a.ts");
  const fileB = path.join(tempDir, "b.ts");
  fs.writeFileSync(fileA, "export const a = 1;");
  fs.writeFileSync(fileB, "import { a } from './a'; export const b = 2;");

  try {
    const engine = new IncrementalGraphEngine({
      workspaceRoot: tempDir
    });

    // 1. Initial scan
    const initialGraph = engine.initialize();
    assert.equal(initialGraph.nodes.length, 2);
    assert.equal(initialGraph.edges.length, 1);

    // 2. Modify fileA to import from fileB (create a cycle)
    fs.writeFileSync(fileA, "import { b } from './b'; export const a = 1;");
    const changeResult = engine.applyFileEvents([
      { type: "change", filePath: fileA }
    ]);

    assert.equal(changeResult.changedNodeIds.length, 1);
    assert.equal(changeResult.changedNodeIds[0], "file:a.ts");

    // File A should now be highlighted with isModified = true
    const nodeA = changeResult.graph.nodes.find((n: any) => n.id === "file:a.ts");
    assert.equal(nodeA?.isModified, true);

    // Edges should now be 2 (A->B and B->A)
    assert.equal(changeResult.graph.edges.length, 2);

    // 3. Create fileC
    const fileC = path.join(tempDir, "c.ts");
    fs.writeFileSync(fileC, "import { a } from './a'; export const c = 3;");
    const createResult = engine.applyFileEvents([
      { type: "create", filePath: fileC }
    ]);

    assert.ok(createResult.addedNodeIds.includes("file:c.ts"));
    assert.equal(createResult.graph.nodes.length, 3);
    assert.equal(createResult.graph.edges.length, 3);

    // 4. Delete fileC
    fs.rmSync(fileC);
    const deleteResult = engine.applyFileEvents([
      { type: "delete", filePath: fileC }
    ]);

    assert.ok(deleteResult.removedNodeIds.includes("file:c.ts"));
    assert.equal(deleteResult.graph.nodes.length, 2);
    assert.equal(deleteResult.graph.edges.length, 2);

    // 5. Test Full scan fallback
    const fallbackResult = engine.fullScanFallback();
    assert.equal(fallbackResult.graph.nodes.length, 2);
    assert.equal(fallbackResult.graph.edges.length, 2);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

