import type { Express, Request, Response } from "express";
import { YouTubeSearchService } from "@main/services/search/youtubeSearchService";

export const registerSearchRoutes = (app: Express, searchService: YouTubeSearchService) => {
  app.get("/api/yt/search", async (req: Request, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const results = await searchService.search(q ?? "");
    res.json(results);
  });
};
