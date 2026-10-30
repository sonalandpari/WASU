import { Router, Request, Response, NextFunction } from "express";
import { ReportService } from "../services/reportService";

export const reportRouter = Router();

// GET /projects/:projectId/reports/data
reportRouter.get(
  "/projects/:projectId/reports/data",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportData = await ReportService.getReportData(req.params.projectId);
      return res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      next(error);
    }
  }
);

