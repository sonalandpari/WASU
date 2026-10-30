import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Architecture Snapshot APIs", () => {
  let projectId: string;

  beforeEach(async () => {
    const p = await request(app).post("/projects").send({
      name: "Arch Test",
      repositoryKey: "test/arch",
    });
    projectId = p.body.data.id;
  });

  it("saves versioned architecture snapshots and retrieves latest", async () => {
    const initialGraph = {
      nodes: [
        { id: "node-1", label: "index.ts", kind: "file", path: "src/index.ts" },
        { id: "node-2", label: "app.ts", kind: "file", path: "src/app.ts" },
      ],
      edges: [{ id: "e1", source: "node-1", target: "node-2", kind: "imports" }],
      generatedAt: "2026-10-31T03:00:00.000Z",
      scannerVersion: "1.0.0",
    };

    // Save v1
    const res1 = await request(app)
      .post(`/projects/${projectId}/architecture`)
      .send({
        graph: initialGraph,
        scannerVersion: "1.0.0",
        summary: "Initial graph scan",
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.version).toBe(1);
    expect(res1.body.data.graph.nodes.length).toBe(2);

    // Save v2
    const updatedGraph = {
      ...initialGraph,
      nodes: [
        ...initialGraph.nodes,
        { id: "node-3", label: "db.ts", kind: "file", path: "src/db.ts" },
      ],
    };

    const res2 = await request(app)
      .post(`/projects/${projectId}/architecture`)
      .send({
        graph: updatedGraph,
        scannerVersion: "1.0.0",
        summary: "Added database module",
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.version).toBe(2);
    expect(res2.body.data.graph.nodes.length).toBe(3);

    // Get latest
    const latestRes = await request(app).get(`/projects/${projectId}/architecture/latest`);
    expect(latestRes.status).toBe(200);
    expect(latestRes.body.data.version).toBe(2);
    expect(latestRes.body.data.graph.nodes.length).toBe(3);
  });
});

