import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { ArchitectureGraph, ArchitectureSnapshotRecord } from "@contextflow/shared";
import { ActivityService } from "./activityService";

export class ArchitectureService {
  /**
   * Saves a new versioned architecture snapshot.
   */
  static async saveSnapshot(
    projectId: string,
    data: {
      graph: ArchitectureGraph;
      scannerVersion?: string;
      summary?: string;
    }
  ): Promise<ArchitectureSnapshotRecord> {
    // Determine the next incremental version number for this project
    const latest = await prisma.architectureSnapshot.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });

    const nextVersion = (latest?.version ?? 0) + 1;
    const scannerVersion = data.scannerVersion || data.graph.scannerVersion || "1.0.0";
    const generatedAt = data.graph.generatedAt ? new Date(data.graph.generatedAt) : new Date();

    const snapshot = await prisma.architectureSnapshot.create({
      data: {
        projectId,
        version: nextVersion,
        scannerVersion,
        graphJson: JSON.stringify(data.graph),
        summary: data.summary || null,
        generatedAt,
      },
    });

    // Record timeline event for ARCHITECTURE_UPDATED
    await ActivityService.createEvent(projectId, {
      type: "ARCHITECTURE_UPDATED",
      actorId: null,
      actorName: "Architecture Engine",
      payload: {
        snapshotId: snapshot.id,
        version: snapshot.version,
        nodeCount: data.graph.nodes.length,
        edgeCount: data.graph.edges.length,
        scannerVersion,
        summary: data.summary,
      },
    });

    return {
      id: snapshot.id,
      projectId: snapshot.projectId,
      version: snapshot.version,
      scannerVersion: snapshot.scannerVersion,
      graph: JSON.parse(snapshot.graphJson),
      generatedAt: snapshot.generatedAt.toISOString(),
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves the latest architecture snapshot for a project.
   */
  static async getLatestSnapshot(
    projectId: string
  ): Promise<ArchitectureSnapshotRecord | null> {
    const snapshot = await prisma.architectureSnapshot.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });

    if (!snapshot) return null;

    return {
      id: snapshot.id,
      projectId: snapshot.projectId,
      version: snapshot.version,
      scannerVersion: snapshot.scannerVersion,
      graph: JSON.parse(snapshot.graphJson),
      generatedAt: snapshot.generatedAt.toISOString(),
      createdAt: snapshot.createdAt.toISOString(),
    };
  }
}

