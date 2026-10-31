import * as vscode from "vscode";
import * as path from "path";
import { DiffViewer } from "../navigation/diffViewer";
import { GitDetector } from "../git/gitDetector";
import { GitCli } from "../git/gitCli";
import {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
  WebviewInitialState,
  ProjectEvent,
  UserPresence,
} from "@contextflow/shared";

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
  public async handleMessage(message: WebviewToExtensionMessage | any): Promise<void> {
    if (!message || !message.type) return;

    switch (message.type) {
      case "READY":
        await this.sendInitialState();
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
        await this.sendInitialState();
        break;
      }

      case "SEND_MESSAGE": {
        const payload = message.payload || {};
        if (payload.content) {
          this.postMessageToWebview({
            type: "EVENT_RECEIVED",
            payload: {
              id: `msg-${Date.now()}`,
              projectId: payload.projectId || "WASU",
              type: "CHAT_MESSAGE" as any,
              userId: payload.userId || "local-user",
              userName: payload.userName || "Developer",
              userAvatar: (payload.userName || "D")[0].toUpperCase(),
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              description: payload.content,
            },
          });
        }
        break;
      }

      default:
        console.log(`[RERO MessageRouter] Received unhandled message type: ${message.type}`);
        break;
    }
  }

  private async sendInitialState(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration("rero");
      const configuredProjectId = config.get<string>("projectId");
      const configuredUserName = config.get<string>("userName");

      const userInfo = await GitCli.getUserInfo(this.workspaceRoot);
      const activeUserName = configuredUserName || userInfo.name || "Developer";
      const userEmail = userInfo.email;

      const currentBranch = await GitCli.getCurrentBranch(this.workspaceRoot);
      const repoKey = await GitCli.getRepositoryKey(this.workspaceRoot);
      const roomCode = configuredProjectId || (await GitCli.getRoomCode(this.workspaceRoot));
      const repositoryName = repoKey.includes("/")
        ? repoKey.split("/").slice(-2).join("/")
        : path.basename(this.workspaceRoot);
      const workspacePath = this.workspaceRoot;

      // Fetch real recent commits from local git repository history
      const recentCommits = await GitCli.getRecentCommits(this.workspaceRoot, 12, repoKey);
      const realEvents: ProjectEvent[] = recentCommits.map((c) => {
        const commitTime = c.commitTimestamp ? new Date(c.commitTimestamp) : new Date();
        return {
          id: `evt-${c.shortHash}`,
          projectId: roomCode,
          type: "COMMIT_CREATED",
          userId: c.authorName?.toLowerCase().replace(/\s+/g, "-") || "git-user",
          userName: c.authorName || "Git",
          userAvatar: c.authorName ? c.authorName[0].toUpperCase() : "G",
          timestamp: commitTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          description: c.message,
          metadata: {
            commitHash: c.commitHash,
            commitMessage: c.message,
            file: c.changedPaths[0],
            stagedFiles: c.changedPaths,
          },
        };
      });

      const activePresence: UserPresence[] = [
        {
          id: `user-${activeUserName.toLowerCase().replace(/\s+/g, "-")}`,
          name: activeUserName,
          avatar: activeUserName[0].toUpperCase(),
          online: true,
          activeFile: vscode.window.activeTextEditor?.document.fileName
            ? path.relative(this.workspaceRoot, vscode.window.activeTextEditor.document.fileName)
            : undefined,
          lastActive: "Active now",
        },
      ];

      const initialState: WebviewInitialState = {
        projectId: roomCode,
        projectName: "RERO",
        currentBranch,
        workspacePath,
        repositoryName,
        roomCode,
        currentUser: {
          id: `user-${activeUserName.toLowerCase().replace(/\s+/g, "-")}`,
          name: activeUserName,
          email: userEmail,
          avatar: activeUserName[0].toUpperCase(),
        },
        connectionStatus: "connected",
        presence: activePresence,
        events: realEvents,
        discussions: [],
        graph: null,
      };

      this.postMessageToWebview({
        type: "INIT_STATE",
        payload: initialState,
      });

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
    } catch (err: any) {
      console.error("[RERO MessageRouter] Error building initial state:", err);
      // Safe fallback state so webview never hangs or goes black
      this.postMessageToWebview({
        type: "INIT_STATE",
        payload: {
          projectId: "WASU",
          projectName: "RERO",
          currentBranch: "main",
          workspacePath: this.workspaceRoot,
          repositoryName: path.basename(this.workspaceRoot) || "WASU",
          roomCode: "WASU",
          currentUser: {
            id: "user-dev",
            name: "Developer",
            avatar: "D",
          },
          connectionStatus: "connected",
          presence: [],
          events: [],
          discussions: [],
          graph: null,
        },
      });
    }
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
        editor.revealRange(range, 1);
        editor.selection = new vscode.Selection(pos, pos);
      }
    } catch (err: any) {
      console.warn(`[RERO MessageRouter] Could not open file ${filePath}:`, err.message);
      vscode.window.showWarningMessage(`RERO: Could not open file: ${filePath}`);
    }
  }
}
