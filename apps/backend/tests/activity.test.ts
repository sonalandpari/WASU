import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Activity & Timeline APIs", () => {
  let projectId: string;

  beforeEach(async () => {
    const p = await request(app).post("/projects").send({
      name: "Activity Test",
      repositoryKey: "test/activity",
    });
    projectId = p.body.data.id;
  });

  it("creates a timeline event with authoritative backend occurredAt", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        type: "FILE_SAVED",
        actorId: "user-1",
        actorName: "Bob",
        payload: {
          filePath: "src/index.ts",
          languageId: "typescript",
          changeCount: 5,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.type).toBe("FILE_SAVED");
    expect(res.body.data.actorName).toBe("Bob");
    expect(res.body.data.occurredAt).toBeDefined();
    expect(res.body.data.payload.filePath).toBe("src/index.ts");

    // Check retrieval
    const listRes = await request(app).get(`/projects/${projectId}/events`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(res.body.data.id);
  });

  it("rejects invalid event payload with 400 validation error", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        type: "INVALID_UNKNOWN_EVENT_TYPE",
        payload: "not-an-object",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deduplicates events when same ID is submitted", async () => {
    const customId = "evt-unique-custom-123";
    const res1 = await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        id: customId,
        type: "BRANCH_CREATED",
        actorId: "user-1",
        actorName: "Bob",
        payload: { branchName: "feature/auth" },
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.id).toBe(customId);

    // Second call with same id
    const res2 = await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        id: customId,
        type: "BRANCH_CREATED",
        actorId: "user-1",
        actorName: "Bob",
        payload: { branchName: "feature/auth" },
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.id).toBe(customId);

    // Only one event should exist
    const listRes = await request(app).get(`/projects/${projectId}/events`);
    expect(listRes.body.data.length).toBe(1);
  });

  it("filters events by type, file, and branch", async () => {
    // Create 3 events
    await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        type: "FILE_SAVED",
        actorId: "u1",
        actorName: "Alice",
        payload: { filePath: "apps/backend/src/server.ts" },
      });

    await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        type: "FILE_SAVED",
        actorId: "u2",
        actorName: "Bob",
        payload: { filePath: "apps/webview/src/App.tsx" },
      });

    await request(app)
      .post(`/projects/${projectId}/events`)
      .send({
        type: "BRANCH_SWITCHED",
        actorId: "u1",
        actorName: "Alice",
        payload: { currentBranch: "main" },
      });

    // Filter by type=BRANCH_SWITCHED
    const typeRes = await request(app).get(`/projects/${projectId}/events?type=BRANCH_SWITCHED`);
    expect(typeRes.body.data.length).toBe(1);
    expect(typeRes.body.data[0].type).toBe("BRANCH_SWITCHED");

    // Filter by file=backend
    const fileRes = await request(app).get(`/projects/${projectId}/events?file=backend`);
    expect(fileRes.body.data.length).toBe(1);
    expect(fileRes.body.data[0].payload.filePath).toContain("backend");

    // Filter by branch=main
    const branchRes = await request(app).get(`/projects/${projectId}/events?branch=main`);
    expect(branchRes.body.data.length).toBe(1);
  });
});

