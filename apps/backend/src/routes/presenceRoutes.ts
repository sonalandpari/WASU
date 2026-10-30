import { Router, Request, Response, NextFunction } from "express";
import { SOCKET_SERVER_EVENTS, UpdatePresenceSchema } from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { PresenceService } from "../services/presenceService";
import { SocketServer } from "../realtime/socketServer";

export const presenceRouter = Router();

// GET /projects/:projectId/presence
presenceRouter.get(
  "/projects/:projectId/presence",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeMembers = await PresenceService.getActivePresence(req.params.projectId);
      return res.json({
        success: true,
        data: activeMembers,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /projects/:projectId/presence
presenceRouter.post(
  "/projects/:projectId/presence",
  validateBody(UpdatePresenceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const presence = await PresenceService.updatePresence(req.params.projectId, req.body);

      // Broadcast to project socket room if Socket.IO is initialized
      try {
        const io = SocketServer.getIO();
        io.to(`project:${req.params.projectId}`).emit(SOCKET_SERVER_EVENTS.PRESENCE_UPDATED, presence);
      } catch {
        // Socket.IO may not be active in test environments
      }

      return res.status(200).json({
        success: true,
        data: presence,
      });
    } catch (error) {
      next(error);
    }
  }
);

