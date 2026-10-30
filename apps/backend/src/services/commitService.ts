import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { CommitPayload, DiscussionLink } from "@contextflow/shared";
import { ActivityService } from "./activityService";

export class CommitService {
  /**
   * Registers a commit in the project. Prevents duplicate commit registration.
   */
  static async registerCommit(
    projectId: string,
    data: {
      repositoryKey: string;
      commitHash: string;
      shortHash: string;
      message: string;
      authorName?: string;
      commitTimestamp?: string;
      linkedAt?: string;
      changedPaths: string[];
    }
  ): Promise<CommitPayload> {
    const existing = await prisma.commit.findUnique({
      where: {
        projectId_commitHash: {
          projectId,
          commitHash: data.commitHash,
        },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        projectId: existing.projectId,
        repositoryKey: existing.repositoryKey,
        commitHash: existing.commitHash,
        shortHash: existing.shortHash,
        message: existing.message,
        authorName: existing.authorName || undefined,
        commitTimestamp: existing.commitTimestamp ? existing.commitTimestamp.toISOString() : undefined,
        linkedAt: existing.linkedAt.toISOString(),
        changedPaths: JSON.parse(existing.changedPathsJson),
      };
    }

    const linkedAtDate = data.linkedAt ? new Date(data.linkedAt) : new Date();
    const commitDate = data.commitTimestamp ? new Date(data.commitTimestamp) : undefined;

    const commit = await prisma.commit.create({
      data: {
        projectId,
        repositoryKey: data.repositoryKey,
        commitHash: data.commitHash,
        shortHash: data.shortHash,
        message: data.message,
        authorName: data.authorName || null,
        commitTimestamp: commitDate,
        linkedAt: linkedAtDate,
        changedPathsJson: JSON.stringify(data.changedPaths),
      },
    });

    // Also record a timeline event for this commit
    await ActivityService.createEvent(projectId, {
      type: "COMMIT_LINKED",
      actorId: null,
      actorName: data.authorName || "Git",
      payload: {
        repositoryKey: data.repositoryKey,
        commitHash: data.commitHash,
        shortHash: data.shortHash,
        message: data.message,
        authorName: data.authorName,
        commitTimestamp: data.commitTimestamp,
        linkedAt: linkedAtDate.toISOString(),
        changedPaths: data.changedPaths,
      },
    });

    return {
      id: commit.id,
      projectId: commit.projectId,
      repositoryKey: commit.repositoryKey,
      commitHash: commit.commitHash,
      shortHash: commit.shortHash,
      message: commit.message,
      authorName: commit.authorName || undefined,
      commitTimestamp: commit.commitTimestamp ? commit.commitTimestamp.toISOString() : undefined,
      linkedAt: commit.linkedAt.toISOString(),
      changedPaths: JSON.parse(commit.changedPathsJson),
    };
  }

  /**
   * Retrieves a commit by its hash for a project, including any linked discussions.
   */
  static async getCommit(
    projectId: string,
    commitHash: string
  ): Promise<CommitPayload & { linkedDiscussions: DiscussionLink[] }> {
    const commit = await prisma.commit.findFirst({
      where: {
        projectId,
        OR: [{ commitHash }, { shortHash: commitHash }],
      },
    });

    if (!commit) {
      throw new AppError(404, "COMMIT_NOT_FOUND", `Commit ${commitHash} was not found in project`);
    }

    const discussionLinks = await prisma.discussionLink.findMany({
      where: {
        projectId,
        commitHash: commit.commitHash,
      },
    });

    return {
      id: commit.id,
      projectId: commit.projectId,
      repositoryKey: commit.repositoryKey,
      commitHash: commit.commitHash,
      shortHash: commit.shortHash,
      message: commit.message,
      authorName: commit.authorName || undefined,
      commitTimestamp: commit.commitTimestamp ? commit.commitTimestamp.toISOString() : undefined,
      linkedAt: commit.linkedAt.toISOString(),
      changedPaths: JSON.parse(commit.changedPathsJson),
      linkedDiscussions: discussionLinks.map((l) => ({
        id: l.id,
        projectId: l.projectId,
        messageId: l.messageId,
        repositoryKey: l.repositoryKey,
        filePath: l.filePath,
        startLine: l.startLine,
        endLine: l.endLine,
        commitHash: l.commitHash,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }
}

