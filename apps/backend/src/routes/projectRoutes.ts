import { Router, Request, Response, NextFunction } from "express";
import { CreateProjectSchema, JoinProjectSchema } from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { ProjectService } from "../services/projectService";
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
      return res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }
);

