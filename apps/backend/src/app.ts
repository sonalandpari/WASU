import express, { Express } from "express";
import cors from "cors";
import { projectRouter } from "./routes/projectRoutes";
import { activityRouter } from "./routes/activityRoutes";
import { presenceRouter } from "./routes/presenceRoutes";
import { discussionRouter } from "./routes/discussionRoutes";
import { commitRouter } from "./routes/commitRoutes";
import { architectureRouter } from "./routes/architectureRoutes";
import { reportRouter } from "./routes/reportRoutes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Healthcheck endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // REST API Routes
  app.use(projectRouter);
  app.use(activityRouter);
  app.use(presenceRouter);
  app.use(discussionRouter);
  app.use(commitRouter);
  app.use(architectureRouter);
  app.use(reportRouter);

  // Global error handler
  app.use(errorHandler);

  return app;
}

