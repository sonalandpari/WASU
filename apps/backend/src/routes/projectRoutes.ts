import { Router, Request, Response, NextFunction } from "express";
import { CreateProjectSchema, JoinProjectSchema, SOCKET_SERVER_EVENTS } from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { ProjectService } from "../services/projectService";
import { ActivityService } from "../services/activityService";
import { SocketServer } from "../realtime/socketServer";

export const projectRouter = Router();

// POST /projects
projectRouter.post(
  "/projects",
  validateBody(CreateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await ProjectService.createProject(req.body);
      return res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /projects/:projectId
projectRouter.get(
  "/projects/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await ProjectService.getProject(req.params.projectId);
      return res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /projects/:projectId/join
projectRouter.post(
  "/projects/:projectId/join",
  validateBody(JoinProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = await ProjectService.joinProject(req.params.projectId, req.body);
      const joinEvent = await ActivityService.createEvent(req.params.projectId, {
        type: "MEMBER_JOINED",
        actorId: member.userId,
        actorName: member.userName,
        payload: {
          userId: member.userId,
          userName: member.userName,
          role: member.role,
          joinedAt: member.joinedAt,
        },
      });

      try {
        const io = SocketServer.getIO();
        io.to(`project:${req.params.projectId}`).emit(SOCKET_SERVER_EVENTS.ACTIVITY_CREATED, joinEvent);
      } catch {
        // Socket.IO may not be active in test environments
      }

      return res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }
);

