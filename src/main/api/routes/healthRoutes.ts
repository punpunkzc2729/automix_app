import type { Express } from "express";

export const registerHealthRoutes = (app: Express) => {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
};
