import * as vscode from "vscode";
import { CommitPayload } from "@contextflow/shared";
import { GitCli } from "./gitCli";
import { extractCommitPayload } from "./commitExtractor";
import { CommitDeduplicator } from "./deduplicator";

export type CommitCallback = (commit: CommitPayload) => void | Promise<void>;

export class GitDetector implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private deduplicator = new CommitDeduplicator();
  private onCommitCallbacks: CommitCallback[] = [];
  private lastKnownCommit: string | null = null;
  private workspaceRoot: string;
  private repositoryKey: string = "workspace/repo";

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Registers a listener callback invoked when a new commit is detected.
   */
  public onCommit(callback: CommitCallback): void {
    this.onCommitCallbacks.push(callback);
  }

  /**
   * Initializes git detection using VS Code Git Extension API with CLI fallback.
   */
  public async initialize(): Promise<void> {
    this.repositoryKey = await GitCli.getRepositoryKey(this.workspaceRoot);

    const isGit = await GitCli.isGitRepository(this.workspaceRoot);
    if (!isGit) {
      console.log("[DevSync Git] Workspace is not inside a git repository:", this.workspaceRoot);
      return;
    }

    // Try VS Code Git extension first
    const gitExtension = vscode.extensions.getExtension("vscode.git");
    if (gitExtension) {
      try {
        const gitApi = gitExtension.exports.getAPI(1);
        if (gitApi && gitApi.repositories && gitApi.repositories.length > 0) {
          const repo = gitApi.repositories[0];
          this.attachToVsCodeGitRepo(repo);
          console.log("[DevSync Git] Attached to VS Code Git extension API.");
          return;
        } else if (gitApi) {
          // Listen for when repository is opened
          this.disposables.push(
            gitApi.onDidOpenRepository((repo: any) => {
              this.attachToVsCodeGitRepo(repo);
            })
          );
        }
      } catch (err) {
        console.warn("[DevSync Git] Failed to attach to VS Code Git API, using CLI fallback:", err);
      }
    }

    // Fallback: Check HEAD commit on initialization and scan on file saves
    await this.scanLatestCommit();
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(() => {
        this.scanLatestCommit();
      })
    );
  }

  /**
   * Subscribes to changes on a VS Code Git repository object.
   */
  private attachToVsCodeGitRepo(repo: any): void {
    if (repo.state && repo.state.HEAD && repo.state.HEAD.commit) {
      this.lastKnownCommit = repo.state.HEAD.commit;
      this.deduplicator.add(repo.state.HEAD.commit);
    }

    this.disposables.push(
      repo.state.onDidChange(async () => {
        const currentCommit = repo.state.HEAD?.commit;
        if (!currentCommit || currentCommit === this.lastKnownCommit) {
          return;
        }

        if (this.deduplicator.has(currentCommit)) {
          this.lastKnownCommit = currentCommit;
          return;
        }

        this.lastKnownCommit = currentCommit;
        this.deduplicator.add(currentCommit);

        // Fetch commit details via repo or Git CLI
        const commitPayload = await this.resolveCommitDetails(repo, currentCommit);
        if (commitPayload) {
          await this.dispatchCommit(commitPayload);
        }
      })
    );
  }

  /**
   * Resolves complete commit details from the Git repo or CLI.
   */
  private async resolveCommitDetails(repo: any, commitHash: string): Promise<CommitPayload | null> {
    try {
      if (typeof repo.getCommit === "function") {
        const c = await repo.getCommit(commitHash);
        if (c) {
          return extractCommitPayload({
            hash: c.hash,
            message: c.message,
            authorName: c.authorName,
            authorEmail: c.authorEmail,
            commitDate: c.commitDate,
            repositoryKey: this.repositoryKey,
            changedFiles: [],
          });
        }
      }
    } catch {
      // Fall through to CLI
    }

    // CLI fallback provides changed files list
    return GitCli.getCommit(this.workspaceRoot, commitHash, this.repositoryKey);
  }

  /**
   * Scans the latest commit manually using Git CLI.
   */
  public async scanLatestCommit(): Promise<CommitPayload | null> {
    const commit = await GitCli.getLatestCommit(this.workspaceRoot, this.repositoryKey);
    if (!commit) return null;

    if (!this.deduplicator.has(commit.commitHash)) {
      this.deduplicator.add(commit.commitHash);
      this.lastKnownCommit = commit.commitHash;
      await this.dispatchCommit(commit);
    }

    return commit;
  }

  private async dispatchCommit(commit: CommitPayload): Promise<void> {
    for (const callback of this.onCommitCallbacks) {
      try {
        await callback(commit);
      } catch (err) {
        console.error("[DevSync Git] Error in commit listener callback:", err);
      }
    }
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
