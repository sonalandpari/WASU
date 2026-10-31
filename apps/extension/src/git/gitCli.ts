import { execFile } from "child_process";
import { promisify } from "util";
import { CommitPayload } from "@contextflow/shared";
import { parseGitLogOutput } from "./commitExtractor";

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
        // Strip credentials and .git suffix if present
        return url
          .replace(/^(https?:\/\/)[^@]+@/, "$1")
          .replace(/\.git$/, "")
          .replace(/^git@github\.com:/, "github.com/");
      }
    } catch {
      // Fallback
    }
    return "local-workspace";
  }

  /**
   * Fetches the latest HEAD commit metadata and changed files using non-destructive git log.
   */
  static async getLatestCommit(cwd: string, repositoryKey?: string): Promise<CommitPayload | null> {
    try {
      const repoKey = repositoryKey || (await this.getRepositoryKey(cwd));
      // %H = commit hash, %h = short hash, %an = author name, %ae = author email, %aI = author ISO date, %s = subject
      const format = "%H%x00%h%x00%an%x00%ae%x00%aI%x00%s";
      const { stdout } = await execFileAsync("git", ["log", "-1", `--pretty=format:${format}`, "--name-only"], { cwd });

      return parseGitLogOutput(stdout, repoKey);
    } catch {
      return null;
    }
  }

  /**
   * Fetches specific commit metadata and changed files.
   */
  static async getCommit(cwd: string, commitHash: string, repositoryKey?: string): Promise<CommitPayload | null> {
    try {
      const repoKey = repositoryKey || (await this.getRepositoryKey(cwd));
      const format = "%H%x00%h%x00%an%x00%ae%x00%aI%x00%s";
      const { stdout } = await execFileAsync("git", ["log", "-1", `--pretty=format:${format}`, "--name-only", commitHash], { cwd });

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
