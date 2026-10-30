import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import { PresenceService } from "../src/services/presenceService";

const app = createApp();

describe("Presence APIs & Expiration", () => {
  let projectId: string;

  beforeEach(async () => {
    const p = await request(app).post("/projects").send({
      name: "Presence Test",
      repositoryKey: "test/presence",
    });
    projectId = p.body.data.id;
  });

  it("updates presence with active file and retrieves active members", async () => {
    const updateRes = await request(app)
      .post(`/projects/${projectId}/presence`)
      .send({
        userId: "user-presence-1",
        userName: "Charlie",
        activeFilePath: "src/components/Header.tsx",
        connectionStatus: "ONLINE",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.userId).toBe("user-presence-1");
    expect(updateRes.body.data.activeFilePath).toBe("src/components/Header.tsx");
    expect(updateRes.body.data.connectionStatus).toBe("ONLINE");

    const getRes = await request(app).get(`/projects/${projectId}/presence`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].userId).toBe("user-presence-1");
    expect(getRes.body.data[0].activeFilePath).toBe("src/components/Header.tsx");
  });

  it("expires stale presence after timeout", async () => {
    // Register active user
    await request(app)
      .post(`/projects/${projectId}/presence`)
      .send({
        userId: "stale-user-99",
        userName: "Dave",
        activeFilePath: "src/stale.ts",
        connectionStatus: "ONLINE",
      });

    // Artificially age Dave's lastActiveAt in the database to 2 minutes ago
    const pastTime = new Date(Date.now() - 120000);
    await prisma.projectMember.updateMany({
      where: { userId: "stale-user-99" },
      data: { lastActiveAt: pastTime },
    });

    // GET /presence should not return stale members
    const getRes = await request(app).get(`/projects/${projectId}/presence`);
    expect(getRes.body.data.find((m: any) => m.userId === "stale-user-99")).toBeUndefined();

    // Expire sweep should mark stale member as OFFLINE
    const expiredList = await PresenceService.expireStalePresence(projectId);
    expect(expiredList.some((m) => m.userId === "stale-user-99")).toBe(true);

    const dbMember = await prisma.projectMember.findFirst({
      where: { userId: "stale-user-99" },
    });
    expect(dbMember?.connectionStatus).toBe("OFFLINE");
    expect(dbMember?.activeFilePath).toBeNull();
  });
});

