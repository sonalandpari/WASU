import { GitRevisionContentProvider, RERO_GIT_SCHEME } from "../src/navigation/gitContentProvider";
import { DiffViewer } from "../src/navigation/diffViewer";
import * as path from "path";

describe("GitRevisionContentProvider", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const provider = new GitRevisionContentProvider(repoRoot);

  it("creates and parses rero-git URIs correctly", () => {
    const filePath = "/home/user/project/src/index.ts";
    const ref = "72854eb";

    const uri = GitRevisionContentProvider.createUri(filePath, ref);

    expect(uri.scheme).toBe(RERO_GIT_SCHEME);
    expect(uri.path).toBe(filePath);

    const parsed = GitRevisionContentProvider.parseUri(uri);
    expect(parsed.filePath).toBe(filePath);
    expect(parsed.ref).toBe(ref);
  });

  it("returns empty string for EMPTY_TREE reference", async () => {
    const uri = GitRevisionContentProvider.createUri("/any/file.ts", "EMPTY_TREE");
    const content = await provider.provideTextDocumentContent(uri);
    expect(content).toBe("");
  });

  it("retrieves actual file content at a git revision", async () => {
    // README.md exists in HEAD
    const readmePath = path.join(repoRoot, "README.md");
    const uri = GitRevisionContentProvider.createUri(readmePath, "HEAD");

    const content = await provider.provideTextDocumentContent(uri);
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("ContextFlow");
  });
});

describe("DiffViewer Navigation", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const viewer = new DiffViewer(repoRoot);

  it("resolves parent commit hash for a known commit", async () => {
    // Current HEAD has parents
    const parentHash = await viewer.getParentCommitHash("HEAD");
    expect(parentHash).toBeDefined();
    expect(parentHash.length).toBe(40);
  });

  it("returns EMPTY_TREE when commit has no parent", async () => {
    // The very first commit has no parent ~1
    // Initial commit hash in this repo: d8908b62fe1c472c941b072191523917e1bb7765
    const rootParent = await viewer.getParentCommitHash("d8908b62fe1c472c941b072191523917e1bb7765");
    expect(rootParent).toBe("EMPTY_TREE");
  });
});
