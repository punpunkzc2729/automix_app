import { describe, it, expect, beforeEach } from "vitest";
import { PlannerAdapter } from "@main/services/llm/plannerAdapter";
import { FeatureAnalyzer } from "@main/services/analyzers/featureAnalyzer";
import { TrackStore } from "@main/services/trackStore";
import { PlanRequest } from "@shared/types";

const buildRequest = (): PlanRequest => ({
  playlist: [
    {
      videoId: "a",
      title: "Deep House Journey",
      durationSec: 420,
      thumbnails: [{ url: "a" }]
    },
    {
      videoId: "b",
      title: "Progressive Sunrise",
      durationSec: 390,
      thumbnails: [{ url: "b" }]
    },
    {
      videoId: "c",
      title: "Peak Techno Energy",
      durationSec: 360,
      thumbnails: [{ url: "c" }]
    }
  ],
  target: {
    energy: 7
  },
  context: {
    sessionGoal: "sunset set"
  }
});

describe("PlannerAdapter", () => {
  let planner: PlannerAdapter;

  beforeEach(() => {
    const store = new TrackStore();
    const analyzer = new FeatureAnalyzer(store);
    planner = new PlannerAdapter(analyzer);
  });

  it("returns ordered tracks and transitions", async () => {
    const request = buildRequest();
    const response = await planner.plan(request);
    expect(response.orderedTracks).toHaveLength(request.playlist.length);
    expect(response.transitions).toHaveLength(request.playlist.length - 1);
    expect(response.transitions[0].barsOverlap).toBeGreaterThan(0);
  });

  it("includes rationale referencing target energy", async () => {
    const request = buildRequest();
    const response = await planner.plan(request);
    expect(response.rationale).toContain("target energy 7");
  });
});
