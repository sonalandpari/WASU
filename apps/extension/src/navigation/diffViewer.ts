import * as vscode from "vscode";
import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { GitRevisionContentProvider } from "./gitContentProvider";
import { GitCli } from "../git/gitCli";

const execFileAsync = promisify(execFile);

export class DiffViewer {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  setWorkspaceRoot(root: string): void {
    this.workspaceRoot = root;
  }

  /**
   * Resolves the parent commit hash. Returns "EMPTY_TREE" if this is the root commit.
   */
  public async getParentCommitHash(commitHash: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["rev-parse", "--verify", `${commitHash}~1`], {
        cwd: this.workspaceRoot,
      });
      return stdout.trim();
    } catch {
      // Root commit has no parent
      return "EMPTY_TREE";
    }
  }

  /**
   * Opens a side-by-side Git diff for a commit in VS Code.
   */
  public async openCommitDiff(commitHash: string, targetFilePath?: string): Promise<boolean> {
    if (!commitHash || commitHash.trim().length === 0) {
      vscode.window.showErrorMessage("DevSync: No commit hash provided.");
      return false;
    }

    const cleanHash = commitHash.trim();
    let selectedFile = targetFilePath;

    // If no target file provided, find changed files in commit
    if (!selectedFile) {
      const commitDetails = await GitCli.getCommit(this.workspaceRoot, cleanHash);
      const changedFiles = commitDetails?.changedPaths || [];

      if (changedFiles.length === 0) {
        vscode.window.showWarningMessage(`DevSync: No changed files found in commit ${cleanHash.slice(0, 7)}.`);
        return false;
      }

      if (changedFiles.length === 1) {
        selectedFile = changedFiles[0];
      } else {
        // Prompt user to pick which changed file to inspect
        const picked = await vscode.window.showQuickPick(
          changedFiles.map((file) => ({
            label: `$(file) ${path.basename(file)}`,
            description: path.dirname(file) === "." ? "" : path.dirname(file),
            filePath: file,
          })),
          {
            placeHolder: `Select a changed file to diff from commit ${cleanHash.slice(0, 7)}`,
          }
        );

        if (!picked) {
          return false; // User cancelled
        }
        selectedFile = picked.filePath;
      }
    }

    const parentHash = await this.getParentCommitHash(cleanHash);
    const shortCommit = cleanHash.slice(0, 7);
    const shortParent = parentHash === "EMPTY_TREE" ? "Initial" : parentHash.slice(0, 7);

    // Normalize relative path
    const normalizedRelativePath = selectedFile.replace(/\\/g, "/").replace(/^\/+/, "");
    const absolutePath = path.resolve(this.workspaceRoot, normalizedRelativePath);

    const leftUri = GitRevisionContentProvider.createUri(absolutePath, parentHash);
    const rightUri = GitRevisionContentProvider.createUri(absolutePath, cleanHash);
    const title = `${path.basename(selectedFile)} (${shortParent} ↔ ${shortCommit})`;

    try {
      await vscode.commands.executeCommand("vscode.diff", leftUri, rightUri, title, {
        preview: true,
      });
      return true;
    } catch (err: any) {
      console.error("[DevSync DiffViewer] Error opening diff:", err);
      vscode.window.showErrorMessage(`DevSync: Could not open diff: ${err.message}`);
      return false;
    }
  }
}
