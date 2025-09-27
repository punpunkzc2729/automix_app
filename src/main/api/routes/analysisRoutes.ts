import type { Express } from "express";
import { FeatureAnalyzer } from "@main/services/analyzers/featureAnalyzer";
import { Track } from "@shared/types";

export const registerAnalysisRoutes = (app: Express, analyzer: FeatureAnalyzer) => {
  app.post("/api/analysis/enrich", async (req, res) => {
    const body = req.body as { tracks?: Track[] };
    const enriched = await analyzer.enrich(body?.tracks ?? []);
    res.json({ tracks: enriched });
  });
};
