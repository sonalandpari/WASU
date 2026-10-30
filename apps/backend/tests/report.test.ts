import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Report Data API", () => {
  let projectId: string;

  beforeEach(async () => {
    const p = await request(app).post("/projects").send({
      name: "Report Test Project",
      repositoryKey: "org/report-repo",
    });
    projectId = p.body.data.id;

    // Join a member
    await request(app)
      .post(`/projects/${projectId}/join`)
      .send({ userId: "u-report", userName: "Reporter" });

    // Save a commit
    await request(app)
      .post(`/projects/${projectId}/commits`)
      .send({
        repositoryKey: "org/report-repo",
        commitHash: "cc112233445566778899aabbccddeeff00112233",
        shortHash: "cc11223",
        message: "feat: core architecture setup",
        changedPaths: ["src/core/engine.ts", "src/core/parser.ts"],
      });

    // Save architecture snapshot
    await request(app)
      .post(`/projects/${projectId}/architecture`)
      .send({
        graph: {
          nodes: [
            { id: "n1", label: "engine.ts", kind: "file", path: "src/core/engine.ts" },
            { id: "n2", label: "parser.ts", kind: "file", path: "src/core/parser.ts" },
          ],
          edges: [{ id: "e1", source: "n1", target: "n2", kind: "imports" }],
          generatedAt: "2026-10-31T03:00:00.000Z",
          scannerVersion: "1.0.0",
        },
      });
  });

  it("returns factual, structured report data for stakeholders", async () => {
    const res = await request(app).get(`/projects/${projectId}/reports/data`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const report = res.body.data;
    expect(report.projectId).toBe(projectId);
    expect(report.projectName).toBe("Report Test Project");
    expect(report.repositoryKey).toBe("org/report-repo");
    expect(report.generatedAt).toBeDefined();

    // Summary stats
    expect(report.summary.totalMembers).toBe(1);
    expect(report.summary.totalCommits).toBe(1);
    expect(report.summary.totalFiles).toBe(2);

    // Recent activity & commits
    expect(report.commits.length).toBe(1);
    expect(report.commits[0].commitHash).toBe("cc112233445566778899aabbccddeeff00112233");
    expect(report.recentActivity.length).toBeGreaterThan(0);

    // Architecture
    expect(report.architecture).not.toBeNull();
    expect(report.architecture.nodes.length).toBe(2);

    // Modified modules
    expect(report.modifiedModules.length).toBeGreaterThan(0);
    expect(report.modifiedModules[0].name).toBe("src/core");
  });
});

