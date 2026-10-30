import { Router, Request, Response, NextFunction } from "express";
import { CreateCommitSchema } from "@contextflow/shared";
import { validateBody } from "../middleware/validate";
import { CommitService } from "../services/commitService";

export const commitRouter = Router();

// POST /projects/:projectId/commits
commitRouter.post(
  "/projects/:projectId/commits",
  validateBody(CreateCommitSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commit = await CommitService.registerCommit(req.params.projectId, req.body);
      return res.status(201).json({
        success: true,
        data: commit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /projects/:projectId/commits/:commitHash
commitRouter.get(
  "/projects/:projectId/commits/:commitHash",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commit = await CommitService.getCommit(
        req.params.projectId,
        req.params.commitHash
      );
      return res.json({
        success: true,
        data: commit,
      });
    } catch (error) {
      next(error);
    }
  }
);

