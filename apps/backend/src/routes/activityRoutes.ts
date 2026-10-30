import { Router, Request, Response, NextFunction } from "express";
import { CreateTimelineEventSchema, ProjectEventType, SOCKET_SERVER_EVENTS } from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { ActivityService } from "../services/activityService";
import { SocketServer } from "../realtime/socketServer";

export const activityRouter = Router();

// GET /projects/:projectId/events
activityRouter.get(
  "/projects/:projectId/events",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, actorId, file, branch, since, before, limit } = req.query;

      const events = await ActivityService.getEvents(req.params.projectId, {
        type: type as ProjectEventType | undefined,
        actorId: actorId as string | undefined,
        file: file as string | undefined,
        branch: branch as string | undefined,
        since: since as string | undefined,
        before: before as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /projects/:projectId/events
activityRouter.post(
  "/projects/:projectId/events",
  validateBody(CreateTimelineEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await ActivityService.createEvent(req.params.projectId, req.body);

      // Broadcast to project socket room if Socket.IO is initialized
      try {
        const io = SocketServer.getIO();
        io.to(`project:${req.params.projectId}`).emit(SOCKET_SERVER_EVENTS.ACTIVITY_CREATED, event);
      } catch {
        // Socket.IO may not be active in test environments
      }

      return res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
);

