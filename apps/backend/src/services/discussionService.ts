import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { ChatMessage, DiscussionLink } from "@contextflow/shared";

export class DiscussionService {
  /**
   * Creates a new chat message, optionally linking it to files/lines/commits immediately.
   */
  static async createMessage(
    projectId: string,
    data: {
      userId: string;
      userName: string;
      content: string;
      links?: Array<{
        repositoryKey: string;
        filePath: string;
        startLine?: number | null;
        endLine?: number | null;
        commitHash?: string | null;
      }>;
    }
  ): Promise<ChatMessage> {
    const message = await prisma.chatMessage.create({
      data: {
        projectId,
        userId: data.userId,
        userName: data.userName,
        content: data.content,
      },
    });

    const links: DiscussionLink[] = [];

    if (data.links && data.links.length > 0) {
      for (const linkData of data.links) {
        const link = await prisma.discussionLink.create({
          data: {
            projectId,
            messageId: message.id,
            repositoryKey: linkData.repositoryKey,
            filePath: linkData.filePath,
            startLine: linkData.startLine || null,
            endLine: linkData.endLine || null,
            commitHash: linkData.commitHash || null,
          },
        });
        links.push({
          id: link.id,
          projectId: link.projectId,
          messageId: link.messageId,
          repositoryKey: link.repositoryKey,
          filePath: link.filePath,
          startLine: link.startLine,
          endLine: link.endLine,
          commitHash: link.commitHash,
          createdAt: link.createdAt.toISOString(),
        });
      }
    }

    return {
      id: message.id,
      projectId: message.projectId,
      userId: message.userId,
      userName: message.userName,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      links,
    };
  }

  /**
   * Retrieves messages for a project, including linked discussions.
   */
  static async getMessages(
    projectId: string,
    options: { limit?: number; since?: string } = {}
  ): Promise<ChatMessage[]> {
    const limit = Math.min(options.limit || 50, 100);
    const where: any = { projectId };

    if (options.since) {
      where.createdAt = { gt: new Date(options.since) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: {
        links: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
      userName: m.userName,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      links: m.links.map((link) => ({
        id: link.id,
        projectId: link.projectId,
        messageId: link.messageId,
        repositoryKey: link.repositoryKey,
        filePath: link.filePath,
        startLine: link.startLine,
        endLine: link.endLine,
        commitHash: link.commitHash,
        createdAt: link.createdAt.toISOString(),
      })),
    }));
  }

  /**
   * Links a discussion message to code location or commit.
   */
  static async createDiscussionLink(
    projectId: string,
    data: {
      messageId: string;
      repositoryKey: string;
      filePath: string;
      startLine?: number | null;
      endLine?: number | null;
      commitHash?: string | null;
    }
  ): Promise<DiscussionLink> {
    const message = await prisma.chatMessage.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new AppError(404, "MESSAGE_NOT_FOUND", `Message with ID ${data.messageId} was not found`);
    }

    const link = await prisma.discussionLink.create({
      data: {
        projectId,
        messageId: data.messageId,
        repositoryKey: data.repositoryKey,
        filePath: data.filePath,
        startLine: data.startLine || null,
        endLine: data.endLine || null,
        commitHash: data.commitHash || null,
      },
    });

    return {
      id: link.id,
      projectId: link.projectId,
      messageId: link.messageId,
      repositoryKey: link.repositoryKey,
      filePath: link.filePath,
      startLine: link.startLine,
      endLine: link.endLine,
      commitHash: link.commitHash,
      createdAt: link.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves a discussion link by ID with associated message.
   */
  static async getDiscussionLink(
    linkId: string
  ): Promise<DiscussionLink & { message: ChatMessage }> {
    const link = await prisma.discussionLink.findUnique({
      where: { id: linkId },
      include: {
        message: {
          include: {
            links: true,
          },
        },
      },
    });

    if (!link) {
      throw new AppError(404, "DISCUSSION_LINK_NOT_FOUND", `Discussion link ${linkId} not found`);
    }

    return {
      id: link.id,
      projectId: link.projectId,
      messageId: link.messageId,
      repositoryKey: link.repositoryKey,
      filePath: link.filePath,
      startLine: link.startLine,
      endLine: link.endLine,
      commitHash: link.commitHash,
      createdAt: link.createdAt.toISOString(),
      message: {
        id: link.message.id,
        projectId: link.message.projectId,
        userId: link.message.userId,
        userName: link.message.userName,
        content: link.message.content,
        createdAt: link.message.createdAt.toISOString(),
        links: link.message.links.map((l) => ({
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
      },
    };
  }
}

