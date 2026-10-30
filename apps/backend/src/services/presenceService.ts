import { prisma } from "../db/prisma";
import { ConnectionStatus, MemberPresence } from "@contextflow/shared";

const PRESENCE_TIMEOUT_MS = parseInt(process.env.PRESENCE_TIMEOUT_MS || "60000", 10);

export class PresenceService {
  /**
   * Updates presence for a member and ensures project membership.
   */
  static async updatePresence(
    projectId: string,
    data: {
      userId: string;
      userName: string;
      activeFilePath?: string | null;
      connectionStatus?: ConnectionStatus;
      lastActiveAt?: string;
    }
  ): Promise<MemberPresence> {
    const now = data.lastActiveAt ? new Date(data.lastActiveAt) : new Date();
    const status = data.connectionStatus || "ONLINE";

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: data.userId,
        },
      },
      update: {
        userName: data.userName,
        activeFilePath: data.activeFilePath !== undefined ? data.activeFilePath : undefined,
        connectionStatus: status,
        lastActiveAt: now,
      },
      create: {
        projectId,
        userId: data.userId,
        userName: data.userName,
        activeFilePath: data.activeFilePath || null,
        connectionStatus: status,
        lastActiveAt: now,
        joinedAt: now,
      },
    });

    return {
      userId: member.userId,
      projectId: member.projectId,
      userName: member.userName,
      activeFilePath: member.activeFilePath,
      lastActiveAt: member.lastActiveAt.toISOString(),
      connectionStatus: member.connectionStatus as ConnectionStatus,
    };
  }

  /**
   * Retrieves active online presence for a project, excluding stale/expired members.
   */
  static async getActivePresence(projectId: string): Promise<MemberPresence[]> {
    const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

    // Fetch members who are ONLINE and active within the cutoff window
    const activeMembers = await prisma.projectMember.findMany({
      where: {
        projectId,
        connectionStatus: "ONLINE",
        lastActiveAt: {
          gte: cutoff,
        },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    return activeMembers.map((m) => ({
      userId: m.userId,
      projectId: m.projectId,
      userName: m.userName,
      activeFilePath: m.activeFilePath,
      lastActiveAt: m.lastActiveAt.toISOString(),
      connectionStatus: "ONLINE",
    }));
  }

  /**
   * Marks a member as OFFLINE.
   */
  static async markOffline(projectId: string, userId: string): Promise<MemberPresence | null> {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) return null;

    try {
      const updated = await prisma.projectMember.update({
        where: { id: member.id },
        data: {
          connectionStatus: "OFFLINE",
          activeFilePath: null,
          lastActiveAt: new Date(),
        },
      });

      return {
        userId: updated.userId,
        projectId: updated.projectId,
        userName: updated.userName,
        activeFilePath: null,
        lastActiveAt: updated.lastActiveAt.toISOString(),
        connectionStatus: "OFFLINE",
      };
    } catch {
      return null;
    }
  }

  /**
   * Periodic stale presence expiration sweep.
   * Finds members who are marked ONLINE but whose lastActiveAt is older than PRESENCE_TIMEOUT_MS,
   * updates them to OFFLINE, and returns the list of expired members.
   */
  static async expireStalePresence(projectId?: string): Promise<MemberPresence[]> {
    const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

    const whereClause: { connectionStatus: string; lastActiveAt: { lt: Date }; projectId?: string } = {
      connectionStatus: "ONLINE",
      lastActiveAt: { lt: cutoff },
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const staleMembers = await prisma.projectMember.findMany({
      where: whereClause,
    });

    if (staleMembers.length === 0) return [];

    await prisma.projectMember.updateMany({
      where: {
        id: { in: staleMembers.map((m) => m.id) },
      },
      data: {
        connectionStatus: "OFFLINE",
        activeFilePath: null,
      },
    });

    return staleMembers.map((m) => ({
      userId: m.userId,
      projectId: m.projectId,
      userName: m.userName,
      activeFilePath: null,
      lastActiveAt: m.lastActiveAt.toISOString(),
      connectionStatus: "OFFLINE",
    }));
  }
}
