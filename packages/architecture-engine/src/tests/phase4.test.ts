import test from "node:test";
import assert from "node:assert/strict";
import type { ArchitectureGraph } from "../../../shared/dist/index.js";
import { generateExecutiveView, determineModuleGroup } from "../executiveView.js";

test("determineModuleGroup classifies paths accurately according to rules", () => {
  assert.equal(determineModuleGroup("apps/webview/src/components/Feed.tsx"), "Frontend");
  assert.equal(determineModuleGroup("apps/backend/src/routes/events.ts"), "Backend");
  assert.equal(determineModuleGroup("packages/shared/src/types.ts"), "Shared Utilities");
  assert.equal(determineModuleGroup("packages/architecture-engine/src/scanner.ts"), "Architecture Engine");
  assert.equal(determineModuleGroup("apps/extension/src/commands/nav.ts"), "VS Code Extension");
});

test("generateExecutiveView collapses technical file graph into clean module graph", () => {
  const sampleTechnicalGraph: ArchitectureGraph = {
    nodes: [
      { id: "file:apps/webview/src/Feed.tsx", label: "Feed.tsx", kind: "file", path: "apps/webview/src/Feed.tsx", metrics: { linesOfCode: 120 } },
      { id: "file:apps/webview/src/Card.tsx", label: "Card.tsx", kind: "file", path: "apps/webview/src/Card.tsx", metrics: { linesOfCode: 80 } },
      { id: "file:packages/shared/src/types.ts", label: "types.ts", kind: "file", path: "packages/shared/src/types.ts", metrics: { linesOfCode: 50 } },
      { id: "file:apps/backend/src/server.ts", label: "server.ts", kind: "file", path: "apps/backend/src/server.ts", metrics: { linesOfCode: 200 } }
    ],
    edges: [
      { id: "edge:feed->card", source: "file:apps/webview/src/Feed.tsx", target: "file:apps/webview/src/Card.tsx", kind: "imports" }, // internal to Frontend
      { id: "edge:feed->shared", source: "file:apps/webview/src/Feed.tsx", target: "file:packages/shared/src/types.ts", kind: "imports" }, // Frontend -> Shared
      { id: "edge:backend->shared", source: "file:apps/backend/src/server.ts", target: "file:packages/shared/src/types.ts", kind: "imports" } // Backend -> Shared
    ],
    generatedAt: new Date().toISOString(),
    scannerVersion: "1.0.0"
  };

  const { executiveGraph } = generateExecutiveView(sampleTechnicalGraph);

  // 1. Module Nodes should be 3: Frontend, Backend, Shared Utilities
  const moduleIds = executiveGraph.nodes.map(n => n.id);
  assert.equal(executiveGraph.nodes.length, 3);
  assert.ok(moduleIds.includes("mod:Frontend"));
  assert.ok(moduleIds.includes("mod:Backend"));
  assert.ok(moduleIds.includes("mod:Shared Utilities"));

  // 2. Metrics aggregated
  const frontendMod = executiveGraph.nodes.find(n => n.id === "mod:Frontend");
  assert.equal(frontendMod?.metrics?.linesOfCode, 200); // 120 + 80
  const frontendData = frontendMod?.data as any;
  assert.equal(frontendData.memberCount, 2);

  // 3. Module Edges: Frontend -> Shared, Backend -> Shared (Internal Feed->Card edge suppressed)
  assert.equal(executiveGraph.edges.length, 2);
  const edgeIds = executiveGraph.edges.map(e => e.id);
  assert.ok(edgeIds.includes("edge:mod:Frontend->mod:Shared Utilities"));
  assert.ok(edgeIds.includes("edge:mod:Backend->mod:Shared Utilities"));
});
