import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { CommitPayload } from "@contextflow/shared";
import { parseGitLogOutput, extractCommitPayload } from "./commitExtractor";

const execFileAsync = promisify(execFile);

export class GitCli {
  /**
   * Safely retrieves the remote origin URL or falls back to folder name.
   */
  static async getRepositoryKey(cwd: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["config", "--get", "remote.origin.url"], { cwd });
      const url = stdout.trim();
      if (url) {
        return url
          .replace(/^(https?:\/\/)[^@]+@/, "$1")
          .replace(/\.git$/, "")
          .replace(/^git@github\.com:/, "github.com/");
      }
    } catch {
      // Fallback
    }
    return path.basename(cwd) || "local-workspace";
  }

  /**
   * Derives a clean Room Code from repository URL or directory name.
   */
  static async getRoomCode(cwd: string): Promise<string> {
    try {
      const repoKey = await this.getRepositoryKey(cwd);
      const parts = repoKey.split("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== "local-workspace") {
        return lastPart.toUpperCase();
      }
    } catch {
      // Fallback
    }
    return (path.basename(cwd) || "ROOM").toUpperCase();
  }

  /**
   * Gets current user information from local git config.
   */
  static async getUserInfo(cwd: string): Promise<{ name: string; email: string }> {
    let name = "Developer";
    let email = "";
    try {
      const { stdout: nameOut } = await execFileAsync("git", ["config", "user.name"], { cwd });
      if (nameOut.trim()) name = nameOut.trim();
    } catch {
      if (process.env.USER) name = process.env.USER;
    }

    try {
      const { stdout: emailOut } = await execFileAsync("git", ["config", "user.email"], { cwd });
      if (emailOut.trim()) email = emailOut.trim();
    } catch {
      // Ignore
    }

    return { name, email };
  }

  /**
   * Gets current checked out git branch.
   */
  static async getCurrentBranch(cwd: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
      const branch = stdout.trim();
      if (branch) return branch;
    } catch {
      // Fallback
    }
    return "main";
  }

  /**
   * Fetches the latest HEAD commit metadata and changed files using non-destructive git log.
   */
  static async getLatestCommit(cwd: string, repositoryKey?: string): Promise<CommitPayload | null> {
    try {
      const repoKey = repositoryKey || (await this.getRepositoryKey(cwd));
      const format = "%H%x00%h%x00%an%x00%ae%x00%aI%x00%s";
      const { stdout } = await execFileAsync("git", ["log", "-1", `--pretty=format:${format}`, "--name-only"], { cwd });

      return parseGitLogOutput(stdout, repoKey);
    } catch {
      return null;
    }
  }

  /**
   * Fetches the recent N commits with author and changed files.
   */
  static async getRecentCommits(cwd: string, limit = 10, repositoryKey?: string): Promise<CommitPayload[]> {
    try {
      const repoKey = repositoryKey || (await this.getRepositoryKey(cwd));
      // Log with delimiter
      const delimiter = "---COMMIT_DELIMITER---";
      const format = `${delimiter}%n%H%x00%h%x00%an%x00%ae%x00%aI%x00%s`;
      const { stdout } = await execFileAsync("git", ["log", `-${limit}`, `--pretty=format:${format}`, "--name-only"], { cwd });

      const rawBlocks = stdout.split(delimiter).filter((b) => b.trim().length > 0);
      const commits: CommitPayload[] = [];

      for (const block of rawBlocks) {
        const parsed = parseGitLogOutput(block.trim(), repoKey);
        if (parsed) {
          commits.push(parsed);
        }
      }

      return commits;
    } catch {
      return [];
    }
  }

  /**
   * Validates whether a commit reference is safe from flag injection (alphanumeric git revision or SHA, no leading dash).
   */
  static isValidCommitHash(hash?: string): boolean {
    if (!hash) return false;
    const clean = hash.trim();
    if (clean.startsWith("-") || clean.includes(" ")) {
      return false;
    }
    // Must be hexadecimal SHA (4 to 64 chars) or valid revision keyword (e.g. HEAD, HEAD~1)
    return /^(HEAD([~^]\d+)*|[a-fA-F0-9]{4,64})$/.test(clean);
  }

  /**
   * Fetches specific commit metadata and changed files.
   */
  static async getCommit(cwd: string, commitHash: string, repositoryKey?: string): Promise<CommitPayload | null> {
    const cleanHash = commitHash ? commitHash.trim() : "";
    if (!this.isValidCommitHash(cleanHash)) {
      console.warn(`[RERO GitCli] Invalid commit hash rejected: "${commitHash}"`);
      return null;
    }

    try {
      const repoKey = repositoryKey || (await this.getRepositoryKey(cwd));
      const format = "%H%x00%h%x00%an%x00%ae%x00%aI%x00%s";
      const { stdout } = await execFileAsync(
        "git",
        ["log", "-1", `--pretty=format:${format}`, "--name-only", "--", cleanHash],
        { cwd }
      );

      return parseGitLogOutput(stdout, repoKey);
    } catch {
      return null;
    }
  }

  /**
   * Checks if the directory is a valid git repository.
   */
  static async isGitRepository(cwd: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd });
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  }
}
