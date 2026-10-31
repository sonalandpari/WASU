/**
 * Deduplicator for Git commits.
 * Maintains an in-memory set with a maximum capacity to prevent duplicate processing.
 */
export class CommitDeduplicator {
  private seenHashes = new Set<string>();
  private queue: string[] = [];
  private readonly maxCapacity: number;

  constructor(maxCapacity = 1000) {
    this.maxCapacity = maxCapacity;
  }

  /**
   * Returns true if the commit hash has already been processed.
   */
  has(commitHash: string): boolean {
    if (!commitHash) return true;
    return this.seenHashes.has(commitHash.toLowerCase().trim());
  }

  /**
   * Marks the commit hash as processed.
   * Evicts the oldest hash if capacity is exceeded.
   */
  add(commitHash: string): void {
    if (!commitHash) return;
    const normalized = commitHash.toLowerCase().trim();
    if (this.seenHashes.has(normalized)) return;

    this.seenHashes.add(normalized);
    this.queue.push(normalized);

    if (this.queue.length > this.maxCapacity) {
      const oldest = this.queue.shift();
      if (oldest) {
        this.seenHashes.delete(oldest);
      }
    }
  }

  /**
   * Resets the deduplicator cache.
   */
  clear(): void {
    this.seenHashes.clear();
    this.queue = [];
  }

  /**
   * Current number of tracked hashes.
   */
  get size(): number {
    return this.seenHashes.size;
  }
}
