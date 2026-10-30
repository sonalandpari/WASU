import { Router, Request, Response, NextFunction } from "express";
import {
  CreateChatMessageSchema,
  CreateDiscussionLinkSchema,
  SOCKET_SERVER_EVENTS,
} from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { DiscussionService } from "../services/discussionService";
import { SocketServer } from "../realtime/socketServer";

export const discussionRouter = Router();

// GET /projects/:projectId/messages
discussionRouter.get(
  "/projects/:projectId/messages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, since } = req.query;
      const messages = await DiscussionService.getMessages(req.params.projectId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        since: since as string | undefined,
      });

      return res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /projects/:projectId/messages
discussionRouter.post(
  "/projects/:projectId/messages",
  validateBody(CreateChatMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await DiscussionService.createMessage(req.params.projectId, req.body);

      // Broadcast to project socket room
      try {
        const io = SocketServer.getIO();
        io.to(`project:${req.params.projectId}`).emit(SOCKET_SERVER_EVENTS.MESSAGE_CREATED, message);
      } catch {
        // Socket.IO may not be active in test environments
      }

      return res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /projects/:projectId/discussion-links
discussionRouter.post(
  "/projects/:projectId/discussion-links",
  validateBody(CreateDiscussionLinkSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const link = await DiscussionService.createDiscussionLink(req.params.projectId, req.body);
      return res.status(201).json({
        success: true,
        data: link,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /discussion-links/:id
discussionRouter.get(
  "/discussion-links/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const linkWithDetails = await DiscussionService.getDiscussionLink(req.params.id);
      return res.json({
        success: true,
        data: linkWithDetails,
      });
    } catch (error) {
      next(error);
    }
  }
);

