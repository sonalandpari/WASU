import * as vscode from "vscode";
import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";

const execFileAsync = promisify(execFile);

export const RERO_GIT_SCHEME = "rero-git";

/**
 * TextDocumentContentProvider that fetches file contents at a specific Git revision
 * using `git show <revision>:<relativePath>`.
 */
export class GitRevisionContentProvider implements vscode.TextDocumentContentProvider {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  setWorkspaceRoot(root: string): void {
    this.workspaceRoot = root;
  }

  /**
   * Generates a rero-git URI for a given file path and git reference.
   */
  public static createUri(filePath: string, ref: string): vscode.Uri {
    return vscode.Uri.from({
      scheme: RERO_GIT_SCHEME,
      path: filePath,
      query: JSON.stringify({ ref }),
    });
  }

  /**
   * Parses the git reference and file path from a rero-git URI.
   */
  public static parseUri(uri: vscode.Uri): { filePath: string; ref: string } {
    let ref = "HEAD";
    try {
      if (uri.query) {
        const parsed = JSON.parse(uri.query);
        ref = parsed.ref || "HEAD";
      }
    } catch {
      // Fallback
      ref = uri.query || "HEAD";
    }

    return {
      filePath: uri.path,
      ref,
    };
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const { filePath, ref } = GitRevisionContentProvider.parseUri(uri);

    // Empty tree or initial commit parent
    if (!ref || ref === "EMPTY_TREE" || ref === "null") {
      return "";
    }

    try {
      // Compute relative path from workspace root
      let relativePath = filePath;
      if (path.isAbsolute(filePath) && filePath.startsWith(this.workspaceRoot)) {
        relativePath = path.relative(this.workspaceRoot, filePath);
      }
      // Normalize slashes for git
      relativePath = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");

      const { stdout } = await execFileAsync("git", ["show", `${ref}:${relativePath}`], {
        cwd: this.workspaceRoot,
        maxBuffer: 10 * 1024 * 1024, // 10MB limit
      });

      return stdout;
    } catch (err: any) {
      console.warn(`[RERO GitProvider] Unable to get ${ref}:${filePath}:`, err.message);
      return "";
    }
  }
}
