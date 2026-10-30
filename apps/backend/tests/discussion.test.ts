import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Discussion & Deep-Linking APIs", () => {
  let projectId: string;

  beforeEach(async () => {
    const p = await request(app).post("/projects").send({
      name: "Discussion Test",
      repositoryKey: "test/discussions",
    });
    projectId = p.body.data.id;
  });

  it("creates a message and links it to source code and commit (Tier 3 Deep-Linking)", async () => {
    // 1. Create message
    const msgRes = await request(app)
      .post(`/projects/${projectId}/messages`)
      .send({
        userId: "user-dev-1",
        userName: "Grace",
        content: "We need to fix the token expiration handling right here",
      });

    expect(msgRes.status).toBe(201);
    expect(msgRes.body.data.id).toBeDefined();
    const messageId = msgRes.body.data.id;

    // 2. Link discussion to file and lines
    const linkRes = await request(app)
      .post(`/projects/${projectId}/discussion-links`)
      .send({
        messageId,
        repositoryKey: "test/discussions",
        filePath: "src/auth/jwt.ts",
        startLine: 42,
        endLine: 48,
        commitHash: "abcdef1234567890",
      });

    expect(linkRes.status).toBe(201);
    expect(linkRes.body.data.id).toBeDefined();
    expect(linkRes.body.data.filePath).toBe("src/auth/jwt.ts");
    expect(linkRes.body.data.startLine).toBe(42);
    expect(linkRes.body.data.endLine).toBe(48);
    const linkId = linkRes.body.data.id;

    // 3. Retrieve discussion link by ID (e.g. from Code Lens click in editor)
    const getLinkRes = await request(app).get(`/discussion-links/${linkId}`);
    expect(getLinkRes.status).toBe(200);
    expect(getLinkRes.body.data.id).toBe(linkId);
    expect(getLinkRes.body.data.message.content).toBe(
      "We need to fix the token expiration handling right here"
    );
    expect(getLinkRes.body.data.message.userName).toBe("Grace");

    // 4. Verify message list returns the link as well
    const listRes = await request(app).get(`/projects/${projectId}/messages`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data[0].links.length).toBe(1);
    expect(listRes.body.data[0].links[0].filePath).toBe("src/auth/jwt.ts");
  });
});

