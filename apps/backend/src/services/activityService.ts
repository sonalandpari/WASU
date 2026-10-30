import { prisma } from "../db/prisma";
import { ProjectEventType, TimelineEvent } from "@contextflow/shared";

export interface ActivityFilterOptions {
  type?: ProjectEventType;
  actorId?: string;
  file?: string;
  branch?: string;
  since?: string; // ISO datetime
  before?: string; // ISO datetime
  limit?: number;
}

export class ActivityService {
  /**
   * Persists a new timeline event. The backend creates the authoritative occurredAt timestamp.
   */
  static async createEvent(
    projectId: string,
    data: {
      id?: string;
      type: ProjectEventType;
      actorId?: string | null;
      actorName?: string | null;
      payload: Record<string, unknown>;
    }
  ): Promise<TimelineEvent> {
    // If client supplied an id, check for duplicate
    if (data.id) {
      const existing = await prisma.timelineEvent.findUnique({
        where: { id: data.id },
      });
      if (existing) {
        return {
          id: existing.id,
          projectId: existing.projectId,
          type: existing.type as ProjectEventType,
          actorId: existing.actorId,
          actorName: existing.actorName,
          occurredAt: existing.occurredAt.toISOString(),
          payload: JSON.parse(existing.payloadJson),
        };
      }
    }

    // Backend generates the authoritative occurredAt
    const occurredAt = new Date();

    const created = await prisma.timelineEvent.create({
      data: {
        id: data.id || undefined,
        projectId,
        type: data.type,
        actorId: data.actorId || null,
        actorName: data.actorName || null,
        occurredAt,
        payloadJson: JSON.stringify(data.payload),
      },
    });

    return {
      id: created.id,
      projectId: created.projectId,
      type: created.type as ProjectEventType,
      actorId: created.actorId,
      actorName: created.actorName,
      occurredAt: created.occurredAt.toISOString(),
      payload: JSON.parse(created.payloadJson),
    };
  }

  /**
   * Retrieves timeline events for a project with rich filtering.
   */
  static async getEvents(
    projectId: string,
    options: ActivityFilterOptions = {}
  ): Promise<TimelineEvent[]> {
    const limit = Math.min(options.limit || 50, 200);

    const where: any = { projectId };

    if (options.type) {
      where.type = options.type;
    }

    if (options.actorId) {
      where.actorId = options.actorId;
    }

    if (options.since) {
      where.occurredAt = {
        ...(where.occurredAt || {}),
        gt: new Date(options.since),
      };
    }

    if (options.before) {
      where.occurredAt = {
        ...(where.occurredAt || {}),
        lt: new Date(options.before),
      };
    }

    const events = await prisma.timelineEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    let results: TimelineEvent[] = events.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      type: e.type as ProjectEventType,
      actorId: e.actorId,
      actorName: e.actorName,
      occurredAt: e.occurredAt.toISOString(),
      payload: JSON.parse(e.payloadJson),
    }));

    // In-memory file and branch filter if requested
    if (options.file) {
      const searchFile = options.file.toLowerCase();
      results = results.filter((event) => {
        const payload = event.payload as any;
        if (payload?.filePath && String(payload.filePath).toLowerCase().includes(searchFile)) {
          return true;
        }
        if (payload?.activeFilePath && String(payload.activeFilePath).toLowerCase().includes(searchFile)) {
          return true;
        }
        if (Array.isArray(payload?.stagedPaths)) {
          return payload.stagedPaths.some((p: string) => p.toLowerCase().includes(searchFile));
        }
        if (Array.isArray(payload?.changedPaths)) {
          return payload.changedPaths.some((p: string) => p.toLowerCase().includes(searchFile));
        }
        return false;
      });
    }

    if (options.branch) {
      const searchBranch = options.branch.toLowerCase();
      results = results.filter((event) => {
        const payload = event.payload as any;
        if (payload?.branchName && String(payload.branchName).toLowerCase().includes(searchBranch)) {
          return true;
        }
        if (payload?.currentBranch && String(payload.currentBranch).toLowerCase().includes(searchBranch)) {
          return true;
        }
        return false;
      });
    }

    return results;
  }
}

