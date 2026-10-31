import { CommitPayload } from "@contextflow/shared";

export interface RawCommitData {
  hash: string;
  shortHash?: string;
  message: string;
  authorName?: string;
  authorEmail?: string;
  commitDate?: Date | string;
  changedFiles?: string[];
  repositoryKey: string;
}

/**
 * Extracts and sanitizes commit metadata into the standardized CommitPayload contract.
 */
export function extractCommitPayload(raw: RawCommitData): CommitPayload {
  const fullHash = raw.hash.trim();
  const shortHash = raw.shortHash ? raw.shortHash.trim() : fullHash.slice(0, 7);

  let commitTimestamp: string | undefined;
  if (raw.commitDate) {
    const d = typeof raw.commitDate === "string" ? new Date(raw.commitDate) : raw.commitDate;
    if (!isNaN(d.getTime())) {
      commitTimestamp = d.toISOString();
    }
  }

  const sanitizedPaths = (raw.changedFiles || [])
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    repositoryKey: raw.repositoryKey || "workspace/repo",
    commitHash: fullHash,
    shortHash,
    message: (raw.message || "No commit message").trim(),
    authorName: raw.authorName?.trim() || undefined,
    commitTimestamp,
    linkedAt: new Date().toISOString(),
    changedPaths: sanitizedPaths,
  };
}

/**
 * Parses raw git log output formatted with null-byte separators:
 * %H%x00%h%x00%an%x00%ae%x00%aI%x00%s
 * followed by changed file names on subsequent lines.
 */
export function parseGitLogOutput(stdout: string, repositoryKey: string): CommitPayload | null {
  if (!stdout || stdout.trim().length === 0) return null;

  const lines = stdout.trim().split("\n");
  const header = lines[0];
  const parts = header.split("\x00");

  if (parts.length < 5) return null;

  const [fullHash, shortHash, authorName, authorEmail, authorDate, ...messageParts] = parts;
  const message = messageParts.join("\x00") || "";

  // The remaining lines are changed files
  const changedFiles = lines
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return extractCommitPayload({
    hash: fullHash,
    shortHash,
    authorName,
    authorEmail,
    commitDate: authorDate,
    message,
    changedFiles,
    repositoryKey,
  });
}
