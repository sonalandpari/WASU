import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Commit APIs & Duplicate Prevention", () => {
  let projectId: string;

  beforeEach(async () => {
    const p = await request(app).post("/projects").send({
      name: "Commit Test",
      repositoryKey: "test/commits",
    });
    projectId = p.body.data.id;
  });

  it("registers a commit and prevents duplicate commit registration", async () => {
    const commitData = {
      repositoryKey: "test/commits",
      commitHash: "a1b2c3d4e5f67890123456789abcdef012345678",
      shortHash: "a1b2c3d",
      message: "feat: add user authentication",
      authorName: "Eve Developer",
      commitTimestamp: "2026-10-31T03:00:00.000Z",
      changedPaths: ["src/auth.ts", "src/user.ts"],
    };

    // First registration
    const res1 = await request(app)
      .post(`/projects/${projectId}/commits`)
      .send(commitData);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.commitHash).toBe(commitData.commitHash);
    expect(res1.body.data.changedPaths).toEqual(commitData.changedPaths);
    expect(res1.body.data.commitTimestamp).toBe(commitData.commitTimestamp);
    expect(res1.body.data.linkedAt).toBeDefined();

    // Second registration with same commit hash must not create duplicate or throw error
    const res2 = await request(app)
      .post(`/projects/${projectId}/commits`)
      .send(commitData);

    expect(res2.status).toBe(201);
    expect(res2.body.data.commitHash).toBe(commitData.commitHash);

    // Retrieve commit
    const getRes = await request(app).get(
      `/projects/${projectId}/commits/${commitData.commitHash}`
    );
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.commitHash).toBe(commitData.commitHash);
    expect(getRes.body.data.linkedDiscussions).toEqual([]);
  });

  it("retrieves commit by short hash", async () => {
    await request(app)
      .post(`/projects/${projectId}/commits`)
      .send({
        repositoryKey: "test/commits",
        commitHash: "1234567890abcdef1234567890abcdef12345678",
        shortHash: "1234567",
        message: "fix: resolve memory leak",
        changedPaths: ["src/leak.ts"],
      });

    const res = await request(app).get(`/projects/${projectId}/commits/1234567`);
    expect(res.status).toBe(200);
    expect(res.body.data.shortHash).toBe("1234567");
    expect(res.body.data.message).toBe("fix: resolve memory leak");
  });
});

