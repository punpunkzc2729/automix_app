import type { Express } from "express";
import { PlaybackController } from "@main/services/playback/playbackController";
import { AutomixIntent } from "@shared/types";

export const registerPlaybackRoutes = (app: Express, playback: PlaybackController) => {
  app.get("/api/playback/state", (_req, res) => {
    res.json(playback.getState());
  });

  app.post("/api/playback/crossfader", (req, res) => {
    const value = Number((req.body as { value: number }).value ?? 0.5);
    playback.updateCrossfader(value);
    res.json(playback.getState());
  });

  app.post("/api/playback/intent", (req, res) => {
    const intent = (req.body as { intent: AutomixIntent }).intent;
    if (intent) {
      playback.handleIntent(intent);
    }
    res.json({ state: playback.getState() });
  });
};
