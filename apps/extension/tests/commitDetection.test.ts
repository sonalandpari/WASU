import { extractCommitPayload, parseGitLogOutput } from "../src/git/commitExtractor";
import { CommitDeduplicator } from "../src/git/deduplicator";
import { GitCli } from "../src/git/gitCli";
import * as path from "path";

describe("Git Commit Detection & Metadata Extraction", () => {
  it("extracts and sanitizes commit payload correctly", () => {
    const raw = {
      hash: "72854eb9f8a3c2e1b4d7f5a6b0c2e3d4f5a6b7c8",
      shortHash: "72854eb",
      message: "feat: add user authentication",
      authorName: "Alex Developer",
      authorEmail: "alex@example.com",
      commitDate: "2026-10-31T03:00:00.000Z",
      changedFiles: ["src/auth.ts", "src/models/user.ts", "  "],
      repositoryKey: "github.com/org/repo",
    };

    const payload = extractCommitPayload(raw);

    expect(payload.commitHash).toBe("72854eb9f8a3c2e1b4d7f5a6b0c2e3d4f5a6b7c8");
    expect(payload.shortHash).toBe("72854eb");
    expect(payload.message).toBe("feat: add user authentication");
    expect(payload.authorName).toBe("Alex Developer");
    expect(payload.commitTimestamp).toBe("2026-10-31T03:00:00.000Z");
    expect(payload.changedPaths).toEqual(["src/auth.ts", "src/models/user.ts"]);
    expect(payload.repositoryKey).toBe("github.com/org/repo");
  });

  it("parses raw git log format with null bytes and file list", () => {
    const gitLogOutput = [
      "72854eb9f8a3c2e1b4d7f5a6b0c2e3d4f5a6b7c8\x0072854eb\x00Alex\x00alex@test.com\x002026-10-31T04:00:00+00:00\x00fix: handle empty state",
      "apps/backend/src/app.ts",
      "packages/shared/src/types.ts",
    ].join("\n");

    const payload = parseGitLogOutput(gitLogOutput, "github.com/test/repo");

    expect(payload).not.toBeNull();
    expect(payload!.shortHash).toBe("72854eb");
    expect(payload!.authorName).toBe("Alex");
    expect(payload!.message).toBe("fix: handle empty state");
    expect(payload!.changedPaths).toEqual([
      "apps/backend/src/app.ts",
      "packages/shared/src/types.ts",
    ]);
  });

  it("handles empty or malformed git log output gracefully", () => {
    expect(parseGitLogOutput("", "test")).toBeNull();
    expect(parseGitLogOutput("corrupted output without delimiters", "test")).toBeNull();
  });
});

describe("Commit Deduplicator", () => {
  it("prevents duplicate commits from being processed", () => {
    const dedup = new CommitDeduplicator(10);
    const hashA = "abc1234567890abcdef1234567890abcdef1234";

    expect(dedup.has(hashA)).toBe(false);
    dedup.add(hashA);
    expect(dedup.has(hashA)).toBe(true);

    // Case-insensitivity check
    expect(dedup.has(hashA.toUpperCase())).toBe(true);
  });

  it("evicts oldest entries when capacity is exceeded", () => {
    const dedup = new CommitDeduplicator(3);
    dedup.add("hash-1");
    dedup.add("hash-2");
    dedup.add("hash-3");
    expect(dedup.size).toBe(3);

    // Add 4th, should evict hash-1
    dedup.add("hash-4");
    expect(dedup.has("hash-1")).toBe(false);
    expect(dedup.has("hash-2")).toBe(true);
    expect(dedup.has("hash-4")).toBe(true);
  });
});

describe("Git CLI Fallback on Local Workspace", () => {
  const repoRoot = path.resolve(__dirname, "../../..");

  it("verifies the current workspace is a git repository", async () => {
    const isGit = await GitCli.isGitRepository(repoRoot);
    expect(isGit).toBe(true);
  });

  it("retrieves the repository origin key or fallback", async () => {
    const key = await GitCli.getRepositoryKey(repoRoot);
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });

  it("reads real latest commit from git log", async () => {
    const commit = await GitCli.getLatestCommit(repoRoot);
    expect(commit).not.toBeNull();
    expect(commit!.commitHash.length).toBe(40);
    expect(commit!.shortHash.length).toBe(7);
    expect(commit!.message.length).toBeGreaterThan(0);
    expect(commit!.commitTimestamp).toBeDefined();
  });
});
