import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  ArchitectureGraph,
  CommitPayload,
  ReportData,
  ReportDiscussionReference,
  ReportModuleSummary,
  TimelineEvent,
} from "@contextflow/shared";
import { ActivityService } from "./activityService";
import { ArchitectureService } from "./architectureService";
import { PresenceService } from "./presenceService";

export class ReportService {
  /**
   * Builds structured, factual report data for stakeholders and exports.
   * Never fabricates summaries or dependencies.
   */
  static async getReportData(projectId: string): Promise<ReportData> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            members: true,
            commits: true,
            timelineEvents: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError(404, "PROJECT_NOT_FOUND", `Project ${projectId} not found`);
    }

    // Active members currently online
    const activeMembers = await PresenceService.getActivePresence(projectId);

    // Recent activity (latest 50 events)
    const recentActivity = await ActivityService.getEvents(projectId, { limit: 50 });

    // Recent commits (latest 30 commits)
    const dbCommits = await prisma.commit.findMany({
      where: { projectId },
      orderBy: { linkedAt: "desc" },
      take: 30,
    });

    const commits: CommitPayload[] = dbCommits.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      repositoryKey: c.repositoryKey,
      commitHash: c.commitHash,
      shortHash: c.shortHash,
      message: c.message,
      authorName: c.authorName || undefined,
      commitTimestamp: c.commitTimestamp ? c.commitTimestamp.toISOString() : undefined,
      linkedAt: c.linkedAt.toISOString(),
      changedPaths: JSON.parse(c.changedPathsJson),
    }));

    // Latest architecture snapshot
    const archSnapshot = await ArchitectureService.getLatestSnapshot(projectId);
    const architecture: ArchitectureGraph | null = archSnapshot ? archSnapshot.graph : null;

    // Build modified modules list deterministically from architecture nodes and commit changed paths
    const moduleMap = new Map<string, { files: Set<string>; recentChangesCount: number }>();

    if (architecture?.nodes) {
      for (const node of architecture.nodes) {
        let modName = node.moduleName;
        if (!modName && node.path) {
          // Determine module name from directory path (e.g. apps/backend or src/services)
          const parts = node.path.split(/[/\\]/);
          modName = parts.length > 1 ? parts.slice(0, 2).join("/") : "root";
        }
        modName = modName || "default";

        if (!moduleMap.has(modName)) {
          moduleMap.set(modName, { files: new Set(), recentChangesCount: 0 });
        }
        if (node.path) {
          moduleMap.get(modName)!.files.add(node.path);
        }
      }
    }

    // Accumulate recent changes per module
    for (const commit of commits) {
      for (const changedPath of commit.changedPaths) {
        const parts = changedPath.split(/[/\\]/);
        const modName = parts.length > 1 ? parts.slice(0, 2).join("/") : "root";

        if (!moduleMap.has(modName)) {
          moduleMap.set(modName, { files: new Set([changedPath]), recentChangesCount: 1 });
        } else {
          const mod = moduleMap.get(modName)!;
          mod.files.add(changedPath);
          mod.recentChangesCount += 1;
        }
      }
    }

    const modifiedModules: ReportModuleSummary[] = Array.from(moduleMap.entries()).map(
      ([name, data]) => ({
        name,
        fileCount: data.files.size,
        recentChangesCount: data.recentChangesCount,
        files: Array.from(data.files),
      })
    );

    // Fetch discussions with links
    const dbMessages = await prisma.chatMessage.findMany({
      where: { projectId },
      include: { links: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const discussions: ReportDiscussionReference[] = dbMessages.map((m) => ({
      message: {
        id: m.id,
        projectId: m.projectId,
        userId: m.userId,
        userName: m.userName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      },
      links: m.links.map((l) => ({
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
    }));

    // Stats
    const totalFiles = architecture?.nodes?.filter((n) => n.kind === "file").length || 0;
    const totalModules = modifiedModules.length;

    return {
      projectId: project.id,
      projectName: project.name,
      repositoryKey: project.repositoryKey,
      generatedAt: new Date().toISOString(),
      summary: {
        totalMembers: project._count.members,
        activeMembersOnline: activeMembers.length,
        totalCommits: project._count.commits,
        totalEvents: project._count.timelineEvents,
        totalFiles,
        totalModules,
      },
      recentActivity,
      commits,
      architecture,
      modifiedModules,
      discussions,
    };
  }
}

