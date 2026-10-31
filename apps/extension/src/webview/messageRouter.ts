import * as vscode from "vscode";
import * as path from "path";
import { DiffViewer } from "../navigation/diffViewer";
import { GitDetector } from "../git/gitDetector";
import { WebviewToExtensionMessage, ExtensionToWebviewMessage } from "@contextflow/shared";

export class MessageRouter {
  private diffViewer: DiffViewer;
  private gitDetector?: GitDetector;
  private workspaceRoot: string;
  private postMessageToWebview: (msg: ExtensionToWebviewMessage) => void;

  constructor(
    diffViewer: DiffViewer,
    workspaceRoot: string,
    postMessageToWebview: (msg: ExtensionToWebviewMessage) => void,
    gitDetector?: GitDetector
  ) {
    this.diffViewer = diffViewer;
    this.workspaceRoot = workspaceRoot;
    this.postMessageToWebview = postMessageToWebview;
    this.gitDetector = gitDetector;
  }

  public setGitDetector(detector: GitDetector): void {
    this.gitDetector = detector;
  }

  /**
   * Routes incoming messages from the React Webview.
   */
  public async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    if (!message || !message.type) return;

    switch (message.type) {
      case "READY":
        this.sendInitialState();
        break;

      case "OPEN_COMMIT_DIFF":
      case "VIEW_DIFF": {
        const payload = (message as any).payload || {};
        const commitHash = payload.commitHash;
        const filePath = payload.changedPath || payload.file || payload.filePath;
        if (commitHash) {
          await this.diffViewer.openCommitDiff(commitHash, filePath);
        } else {
          vscode.window.showWarningMessage("RERO: Missing commit hash to view diff.");
        }
        break;
      }

      case "OPEN_FILE": {
        const payload = (message as any).payload || {};
        const targetPath = payload.path || payload.filePath;
        if (targetPath) {
          await this.openWorkspaceFile(targetPath, payload.line);
        }
        break;
      }

      case "REFRESH_ACTIVITY": {
        if (this.gitDetector) {
          await this.gitDetector.scanLatestCommit();
        }
        break;
      }

      default:
        console.log(`[RERO MessageRouter] Received unhandled message type: ${message.type}`);
        break;
    }
  }

  private sendInitialState(): void {
    const config = vscode.workspace.getConfiguration("rero");
    const projectId = config.get<string>("projectId", "contextflow-demo");
    const currentBranch = "main";
    const repositoryName = path.basename(this.workspaceRoot) || "workspace";

    this.postMessageToWebview({
      type: "GIT_INFO_CHANGED",
      payload: {
        branch: currentBranch,
        repositoryName,
      },
    });

    this.postMessageToWebview({
      type: "CONNECTION_STATUS_CHANGED",
      payload: {
        status: "connected",
      },
    });
  }

  private async openWorkspaceFile(filePath: string, line?: number): Promise<void> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(this.workspaceRoot, filePath);

      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(fullPath));
      const editor = await vscode.window.showTextDocument(doc, { preview: true });

      if (line !== undefined && line > 0) {
        const lineIdx = line - 1;
        const pos = new vscode.Position(lineIdx, 0);
        const range = new vscode.Range(pos, pos);
        editor.revealRange(range, 1); // 1 = InCenter
        editor.selection = new vscode.Selection(pos, pos);
      }
    } catch (err: any) {
      console.warn(`[RERO MessageRouter] Could not open file ${filePath}:`, err.message);
      vscode.window.showWarningMessage(`RERO: Could not open file: ${filePath}`);
    }
  }
}
