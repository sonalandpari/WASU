import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Project APIs", () => {
  it("creates a new project and retrieves it", async () => {
    const createRes = await request(app)
      .post("/projects")
      .send({
        name: "ContextFlow Test Project",
        repositoryKey: "org/repo-contextflow",
        description: "Integration test project",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.id).toBeDefined();
    expect(createRes.body.data.name).toBe("ContextFlow Test Project");
    expect(createRes.body.data.repositoryKey).toBe("org/repo-contextflow");

    const projectId = createRes.body.data.id;

    const getRes = await request(app).get(`/projects/${projectId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.id).toBe(projectId);
    expect(getRes.body.data.membersCount).toBe(0);
  });

  it("fails when required fields are missing (Zod validation)", async () => {
    const res = await request(app).post("/projects").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("allows members to join a project", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "Team Project",
      repositoryKey: "team/repo",
    });
    const projectId = projectRes.body.data.id;

    const joinRes = await request(app)
      .post(`/projects/${projectId}/join`)
      .send({
        userId: "user-alice-123",
        userName: "Alice Developer",
        role: "MEMBER",
      });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);
    expect(joinRes.body.data.userId).toBe("user-alice-123");
    expect(joinRes.body.data.userName).toBe("Alice Developer");
    expect(joinRes.body.data.role).toBe("MEMBER");

    // Joining again updates the existing membership rather than failing
    const rejoinRes = await request(app)
      .post(`/projects/${projectId}/join`)
      .send({
        userId: "user-alice-123",
        userName: "Alice Lead",
        role: "ADMIN",
      });

    expect(rejoinRes.status).toBe(200);
    expect(rejoinRes.body.data.userName).toBe("Alice Lead");
    expect(rejoinRes.body.data.role).toBe("ADMIN");

    // Project member count should now be 1
    const getRes = await request(app).get(`/projects/${projectId}`);
    expect(getRes.body.data.membersCount).toBe(1);

    // Verify MEMBER_JOINED timeline event was recorded
    const eventsRes = await request(app).get(`/projects/${projectId}/events`);
    expect(eventsRes.body.data.some((e: any) => e.type === "MEMBER_JOINED" && e.actorId === "user-alice-123")).toBe(true);
  });

  it("returns 404 for nonexistent project", async () => {
    const res = await request(app).get("/projects/non-existent-id");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });
});

