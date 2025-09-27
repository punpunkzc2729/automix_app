import type { Express } from "express";
import { PlannerAdapter } from "@main/services/llm/plannerAdapter";
import { IntentAdapter } from "@main/services/llm/intentAdapter";
import { PlanRequest } from "@shared/types";
import { PlaybackController } from "@main/services/playback/playbackController";

export const registerLlmRoutes = (
  app: Express,
  planner: PlannerAdapter,
  intents: IntentAdapter,
  playback: PlaybackController
) => {
  app.post("/api/llm/plan", async (req, res) => {
    const body = req.body as { request: PlanRequest };
    const plan = await planner.plan(body.request);
    playback.setPlan(plan);
    res.json(plan);
  });

  app.post("/api/llm/intent", (req, res) => {
    const body = req.body as { utterance: string };
    const parsed = intents.parse(body.utterance ?? "");
    res.json({ intent: parsed, prompt: intents.buildPrompt(body.utterance ?? "") });
  });
};
