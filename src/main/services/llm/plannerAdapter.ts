import { PlanRequest, PlanResponse, Track, TransitionNote } from "@shared/types";
import { FeatureAnalyzer } from "@main/services/analyzers/featureAnalyzer";
import { logger } from "@main/utils/logger";

const camelotKeyToNumber = (key?: string): number | undefined => {
  if (!key) return undefined;
  const match = key.match(/(\d{1,2})[AB]/i);
  if (!match) return undefined;
  return Number(match[1]);
};

const numberToCamelot = (value?: number): string | undefined => {
  if (!value) return undefined;
  const normalized = ((value - 1 + 12) % 12) + 1;
  return `${normalized}A`;
};

const energyArc = (count: number): number[] => {
  if (count <= 0) return [];
  const arc: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const progress = i / Math.max(1, count - 1);
    const value = progress < 0.4
      ? 4 + Math.round(progress * 6)
      : progress < 0.7
        ? 6 + Math.round(progress * 8)
        : 8 - Math.round((progress - 0.7) * 5);
    arc.push(Math.min(10, Math.max(2, value)));
  }
  return arc;
};

export class PlannerAdapter {
  constructor(private readonly analyzer: FeatureAnalyzer) {}

  async plan(request: PlanRequest): Promise<PlanResponse> {
    const enriched = await this.analyzer.enrich(request.playlist);
    const sorted = this.sortTracks(enriched, request);
    const transitions = this.buildTransitions(sorted);
    const rationale = this.composeRationale(sorted, request);

    logger.info("Planner produced automix", { count: sorted.length });

    return {
      orderedTracks: sorted,
      transitions,
      rationale
    };
  }

  private sortTracks(tracks: Track[], request: PlanRequest): Track[] {
    const { target } = request;
    const targetEnergy = target.energy ?? 6;
    const targetBpm = target.bpmRange ? (target.bpmRange[0] + target.bpmRange[1]) / 2 : undefined;

    return tracks
      .slice()
      .sort((a, b) => this.scoreTrack(a, targetEnergy, targetBpm) - this.scoreTrack(b, targetEnergy, targetBpm));
  }

  private scoreTrack(track: Track, targetEnergy: number, targetBpm?: number): number {
    const bpm = track.features?.bpm ?? 120;
    const energy = track.features?.energy ?? 5;
    const energyScore = Math.abs(energy - targetEnergy);
    const bpmScore = targetBpm ? Math.abs(bpm - targetBpm) / 10 : 0;
    return energyScore + bpmScore;
  }

  private buildTransitions(tracks: Track[]): TransitionNote[] {
    const transitions: TransitionNote[] = [];
    for (let i = 0; i < tracks.length - 1; i += 1) {
      const current = tracks[i];
      const next = tracks[i + 1];
      const currentKeyNumber = camelotKeyToNumber(current.features?.key);
      const nextKeyNumber = camelotKeyToNumber(next.features?.key);
      let adjustedKey = nextKeyNumber;

      if (currentKeyNumber && nextKeyNumber) {
        const diff = Math.abs(currentKeyNumber - nextKeyNumber);
        if (diff > 1 && diff !== 11) {
          adjustedKey = currentKeyNumber + (diff > 6 ? -1 : 1);
        }
      }

      const targetBpm = this.computeTargetBpm(current, next);
      const barsOverlap = this.pickBarsOverlap(current, next);
      const transition: TransitionNote = {
        fromId: current.videoId,
        toId: next.videoId,
        barsOverlap,
        targetBpm,
        keyMove:
          currentKeyNumber && adjustedKey
            ? `${numberToCamelot(currentKeyNumber)} → ${numberToCamelot(adjustedKey)}`
            : undefined,
        fx: this.pickFx(current, next),
        inPointSec: Math.max(0, current.durationSec - barsOverlap * 2),
        outPointSec: Math.min(next.durationSec, barsOverlap * 2)
      };

      transitions.push(transition);
    }

    return transitions;
  }

  private pickBarsOverlap(current: Track, next: Track): number {
    const energy = next.features?.energy ?? current.features?.energy ?? 6;
    if (energy >= 8) return 32;
    if (energy >= 6) return 16;
    return 8;
  }

  private computeTargetBpm(current: Track, next: Track): number | undefined {
    const currentBpm = current.features?.bpm;
    const nextBpm = next.features?.bpm;
    if (!currentBpm || !nextBpm) return undefined;
    const drift = (nextBpm - currentBpm) / currentBpm;
    if (Math.abs(drift) <= 0.06) {
      return Math.round((currentBpm + nextBpm) / 2);
    }
    return currentBpm;
  }

  private pickFx(current: Track, next: Track): string[] | undefined {
    const currentEnergy = current.features?.energy ?? 5;
    const nextEnergy = next.features?.energy ?? 5;
    if (nextEnergy > currentEnergy + 1) return ["filter-rise", "noise-swell"];
    if (currentEnergy > nextEnergy + 1) return ["echo-tail"];
    return ["clean-crossfade"];
  }

  private composeRationale(tracks: Track[], request: PlanRequest): string {
    const genre = request.target.genre ?? "mixed";
    const energy = request.target.energy ?? 6;
    const inferred = tracks.filter((track) => !track.features?.bpm || !track.features?.key);
    const inferenceNote = inferred.length
      ? `${inferred.length} tracks missing metadata were inferred heuristically.`
      : "All tracks had cached metadata.";
    return `Built a ${genre} leaning set with target energy ${energy}. ${inferenceNote}`;
  }
}
