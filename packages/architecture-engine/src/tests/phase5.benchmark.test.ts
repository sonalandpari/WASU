import test from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import * as fs from "fs";
import { generateArchitectureGraph } from "../graphGenerator.js";
import { IncrementalGraphEngine } from "../incrementalEngine.js";
import { generateExecutiveView } from "../executiveView.js";
import { toReactFlowGraph } from "../reactFlowAdapter.js";

test("Stress benchmark: scan and incremental update across 100 simulated files", () => {
  const tempDir = path.join(__dirname, "temp_benchmark");
  fs.mkdirSync(tempDir, { recursive: true });

  const numFiles = 100;
  for (let i = 0; i < numFiles; i++) {
    const nextIdx = (i + 1) % numFiles;
    const content = `
      import { func_${nextIdx} } from './file_${nextIdx}';
      import React from 'react';
      export function func_${i}() { return ${i}; }
    `;
    fs.writeFileSync(path.join(tempDir, `file_${i}.ts`), content);
  }

  try {
    // 1. Initial Scan Benchmark
    const startTime = performance.now();
    const graph = generateArchitectureGraph({
      workspaceRoot: tempDir,
      includeExternalPackages: true
    });
    const scanDuration = performance.now() - startTime;

    assert.equal(graph.nodes.length, 101); // 100 files + 1 react pkg
    assert.equal(graph.edges.length, 200); // 100 relative + 100 react pkg
    assert.ok(scanDuration < 3000, `Initial full scan took ${scanDuration}ms (expected < 3000ms)`);

    // 2. Incremental Update Benchmark
    const engine = new IncrementalGraphEngine({ workspaceRoot: tempDir });
    engine.initialize();

    const incStartTime = performance.now();
    const modFile = path.join(tempDir, "file_0.ts");
    fs.writeFileSync(modFile, `export function func_0() { return 999; }`);
    const updateResult = engine.applyFileEvents([{ type: "change", filePath: modFile }]);
    const incDuration = performance.now() - incStartTime;

    assert.equal(updateResult.changedNodeIds.length, 1);
    assert.ok(incDuration < 500, `Incremental update took ${incDuration}ms (expected < 500ms)`);

    // 3. React Flow conversion benchmark
    const rfStartTime = performance.now();
    const rf = toReactFlowGraph(graph);
    const rfDuration = performance.now() - rfStartTime;

    assert.equal(rf.nodes.length, 101);
    assert.ok(rfDuration < 100, `React Flow conversion took ${rfDuration}ms (expected < 100ms)`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

