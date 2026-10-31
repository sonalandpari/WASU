import { MessageRouter } from "../src/webview/messageRouter";
import { DiffViewer } from "../src/navigation/diffViewer";
import * as vscode from "vscode";

describe("Webview Message Router", () => {
  let mockDiffViewer: jest.Mocked<DiffViewer>;
  let postedMessages: any[];
  let router: MessageRouter;

  beforeEach(() => {
    postedMessages = [];
    mockDiffViewer = {
      openCommitDiff: jest.fn().mockResolvedValue(true),
      getParentCommitHash: jest.fn().mockResolvedValue("parent-sha"),
      setWorkspaceRoot: jest.fn(),
    } as any;

    router = new MessageRouter(
      mockDiffViewer,
      "/mock/workspace",
      (msg) => postedMessages.push(msg)
    );
  });

  it("handles READY message by sending initial connection and git status", async () => {
    await router.handleMessage({ type: "READY" });

    expect(postedMessages.length).toBe(2);
    expect(postedMessages[0].type).toBe("GIT_INFO_CHANGED");
    expect(postedMessages[0].payload.branch).toBe("main");
    expect(postedMessages[1].type).toBe("CONNECTION_STATUS_CHANGED");
    expect(postedMessages[1].payload.status).toBe("connected");
  });

  it("handles OPEN_COMMIT_DIFF and forwards commitHash and path to diffViewer", async () => {
    await router.handleMessage({
      type: "OPEN_COMMIT_DIFF",
      payload: {
        commitHash: "72854eb",
        changedPath: "src/auth.ts",
      },
    } as any);

    expect(mockDiffViewer.openCommitDiff).toHaveBeenCalledWith("72854eb", "src/auth.ts");
  });

  it("handles VIEW_DIFF message variant", async () => {
    await router.handleMessage({
      type: "VIEW_DIFF",
      payload: {
        commitHash: "abc1234",
        file: "README.md",
      },
    } as any);

    expect(mockDiffViewer.openCommitDiff).toHaveBeenCalledWith("abc1234", "README.md");
  });

  it("warns if commitHash is missing in diff request", async () => {
    await router.handleMessage({
      type: "OPEN_COMMIT_DIFF",
      payload: {},
    } as any);

    expect(mockDiffViewer.openCommitDiff).not.toHaveBeenCalled();
    expect(vscode.window.showWarningMessage).toHaveBeenCalled();
  });
});
