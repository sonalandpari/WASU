import { Router, Request, Response, NextFunction } from "express";
import { SaveArchitectureSchema, SOCKET_SERVER_EVENTS } from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { ArchitectureService } from "../services/architectureService";
import { SocketServer } from "../realtime/socketServer";

export const architectureRouter = Router();

// POST /projects/:projectId/architecture
architectureRouter.post(
  "/projects/:projectId/architecture",
  validateBody(SaveArchitectureSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await ArchitectureService.saveSnapshot(req.params.projectId, req.body);

      // Broadcast to project socket room
      try {
        const io = SocketServer.getIO();
        io.to(`project:${req.params.projectId}`).emit(SOCKET_SERVER_EVENTS.ARCHITECTURE_UPDATED, {
          snapshotId: snapshot.id,
          version: snapshot.version,
          graph: snapshot.graph,
          summary: req.body.summary,
          generatedAt: snapshot.generatedAt,
        });
      } catch {
        // Socket.IO may not be active in test environments
      }

      return res.status(201).json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /projects/:projectId/architecture/latest
architectureRouter.get(
  "/projects/:projectId/architecture/latest",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await ArchitectureService.getLatestSnapshot(req.params.projectId);
      return res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      next(error);
    }
  }
);

