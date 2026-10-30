import * as path from "path";
import * as fs from "fs";

export interface ResolveResult {
  resolvedRelativePath: string | null;
  isExternalPackage: boolean;
  rawSpecifier: string;
}

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

/**
 * Resolves an import specifier relative to the importing file within the workspace.
 * Correctly checks relative extensions (.ts, .tsx, .js, .jsx) and directory index files.
 */
export function resolveDependencyPath(
  workspaceRoot: string,
  importingRelativeFile: string,
  rawSpecifier: string
): ResolveResult {
  // If it does not start with '.' or '/', it's treated as an external package or tsconfig path alias
  if (!rawSpecifier.startsWith(".") && !rawSpecifier.startsWith("/")) {
    return {
      resolvedRelativePath: null,
      isExternalPackage: true,
      rawSpecifier
    };
  }

  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const importingAbsDir = path.dirname(
    path.resolve(normalizedWorkspaceRoot, importingRelativeFile)
  );
  const targetAbsBase = path.resolve(importingAbsDir, rawSpecifier);

  // 1. Direct file match
  if (fs.existsSync(targetAbsBase) && fs.statSync(targetAbsBase).isFile()) {
    const rel = path.relative(normalizedWorkspaceRoot, targetAbsBase).replace(/\\/g, "/");
    return { resolvedRelativePath: rel, isExternalPackage: false, rawSpecifier };
  }

  // 2. Extension probing (target + .ts, .tsx, .js, .jsx)
  for (const ext of SUPPORTED_EXTENSIONS) {
    const candidate = `${targetAbsBase}${ext}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const rel = path.relative(normalizedWorkspaceRoot, candidate).replace(/\\/g, "/");
      return { resolvedRelativePath: rel, isExternalPackage: false, rawSpecifier };
    }
  }

  // 3. Index file probing in directory (target/index.ts, etc.)
  if (fs.existsSync(targetAbsBase) && fs.statSync(targetAbsBase).isDirectory()) {
    for (const ext of SUPPORTED_EXTENSIONS) {
      const indexCandidate = path.join(targetAbsBase, `index${ext}`);
      if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
        const rel = path.relative(normalizedWorkspaceRoot, indexCandidate).replace(/\\/g, "/");
        return { resolvedRelativePath: rel, isExternalPackage: false, rawSpecifier };
      }
    }
  }

  // Could not resolve to a local source file
  return {
    resolvedRelativePath: null,
    isExternalPackage: false,
    rawSpecifier
  };
}

