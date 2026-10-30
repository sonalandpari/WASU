import * as fs from "fs";
import * as path from "path";

export interface ScannerOptions {
  workspaceRoot: string;
  supportedExtensions?: string[];
  excludePatterns?: string[];
}

export const DEFAULT_SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

export const DEFAULT_EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".vscode",
  ".turbo",
  "out"
];

/**
 * Normalizes a file path to use forward slashes and relative to workspace root.
 */
export function normalizeRelativePath(workspaceRoot: string, fullPath: string): string {
  const rel = path.relative(workspaceRoot, fullPath);
  return rel.replace(/\\/g, "/");
}

/**
 * Discovers all supported source files within the workspace root, ignoring excluded directories.
 * Strictly confines discovery to the workspace boundaries.
 */
export function discoverWorkspaceFiles(options: ScannerOptions): string[] {
  const {
    workspaceRoot,
    supportedExtensions = DEFAULT_SUPPORTED_EXTENSIONS,
    excludePatterns = DEFAULT_EXCLUDE_PATTERNS
  } = options;

  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const matchedFiles: string[] = [];

  function traverse(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Prevent traversing symlinks outside workspace root
      const realPath = path.resolve(fullPath);
      if (!realPath.startsWith(normalizedWorkspaceRoot)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (excludePatterns.includes(entry.name)) {
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (supportedExtensions.includes(ext) && !entry.name.endsWith(".d.ts")) {
          matchedFiles.push(normalizeRelativePath(normalizedWorkspaceRoot, fullPath));
        }
      }
    }
  }

  if (fs.existsSync(normalizedWorkspaceRoot)) {
    traverse(normalizedWorkspaceRoot);
  }

  return matchedFiles.sort();
}

