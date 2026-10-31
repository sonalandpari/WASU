import * as vscode from "vscode";
import { GitDetector } from "./git/gitDetector";
import { ApiClient } from "./services/apiClient";
import { getReroConfig } from "./config";
import { CommitPayload } from "@contextflow/shared";
import { GitRevisionContentProvider, RERO_GIT_SCHEME } from "./navigation/gitContentProvider";
import { DiffViewer } from "./navigation/diffViewer";
import { ReroWebviewProvider } from "./webview/reroWebviewProvider";

let gitDetector: GitDetector | undefined;
let apiClient: ApiClient | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let diffViewer: DiffViewer | undefined;
let contentProvider: GitRevisionContentProvider | undefined;
let webviewProvider: ReroWebviewProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
  console.log("[RERO] Extension activated.");

  const config = getReroConfig();
  apiClient = new ApiClient(config.apiUrl);

  // Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = "rero.refreshCommits";
  statusBarItem.text = "$(git-commit) RERO: Active";
  statusBarItem.tooltip = "RERO Collaboration Active - Click to scan commits";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Initialize Git Content Provider and Diff Viewer
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const rootPath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : process.cwd();

  contentProvider = new GitRevisionContentProvider(rootPath);
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(RERO_GIT_SCHEME, contentProvider)
  );

  diffViewer = new DiffViewer(rootPath);

  // Initialize Webview Provider for RERO Sidebar
  webviewProvider = new ReroWebviewProvider(context.extensionUri, diffViewer, rootPath);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReroWebviewProvider.viewType, webviewProvider)
  );

  // Initialize Git Detector if workspace is open
  if (workspaceFolders && workspaceFolders.length > 0) {
    gitDetector = new GitDetector(rootPath);
    webviewProvider.setGitDetector(gitDetector);

    gitDetector.onCommit(async (commit: CommitPayload) => {
      console.log(`[RERO] Detected new commit: ${commit.shortHash} - ${commit.message}`);
      vscode.window.showInformationMessage(
        `RERO: New commit detected: ${commit.shortHash} by ${commit.authorName || "Git"}`
      );

      // Broadcast immediately to Sidebar Webview timeline
      if (webviewProvider) {
        webviewProvider.broadcastEvent({
          id: `evt-${commit.commitHash.slice(0, 8)}`,
          projectId: config.projectId || "rero-demo",
          type: "COMMIT_CREATED",
          userId: "git-user",
          userName: commit.authorName || "Git",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          description: commit.message,
          metadata: {
            commitHash: commit.commitHash,
            commitMessage: commit.message,
            file: commit.changedPaths[0],
            stagedFiles: commit.changedPaths,
          },
        });
      }

      const currentConfig = getReroConfig();
      if (currentConfig.projectId && apiClient) {
        try {
          const res = await apiClient.registerCommit(currentConfig.projectId, commit);
          if (res.success) {
            console.log(`[RERO] Successfully registered commit ${commit.shortHash} with backend.`);
          } else {
            console.warn(`[RERO] Failed to register commit: ${res.error?.message}`);
          }
        } catch (err) {
          console.error("[RERO] Network error registering commit:", err);
        }
      }
    });

    await gitDetector.initialize();
    context.subscriptions.push(gitDetector);
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("rero.start", async () => {
      vscode.window.showInformationMessage("RERO collaboration is connected and running.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rero.refreshCommits", async () => {
      if (gitDetector) {
        const commit = await gitDetector.scanLatestCommit();
        if (commit) {
          vscode.window.showInformationMessage(`RERO: Scanned commit ${commit.shortHash}: "${commit.message}"`);
        } else {
          vscode.window.showInformationMessage("RERO: No new commits found.");
        }
      } else {
        vscode.window.showWarningMessage("RERO: No active workspace found.");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rero.openCommitDiff", async (commitHash?: string, filePath?: string) => {
      if (!diffViewer) {
        vscode.window.showErrorMessage("RERO: No workspace open to view diff.");
        return;
      }

      if (!commitHash) {
        const input = await vscode.window.showInputBox({
          prompt: "Enter commit hash to view diff",
          placeHolder: "e.g. 72854eb or full commit SHA",
        });
        if (!input) return;
        commitHash = input.trim();
      }

      await diffViewer.openCommitDiff(commitHash, filePath);
    })
  );
}

export function deactivate() {
  if (gitDetector) {
    gitDetector.dispose();
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
