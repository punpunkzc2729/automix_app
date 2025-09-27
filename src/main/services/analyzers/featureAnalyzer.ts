import { Track, TrackFeatures } from "@shared/types";
import { TrackStore } from "@main/services/trackStore";

const bpmKeywords: Record<string, number> = {
  house: 124,
  techno: 128,
  trance: 138,
  drum: 174,
  bass: 174,
  synthwave: 108,
  downtempo: 96,
  chill: 100,
  progressive: 124,
  indie: 110
};

const keyCycle = [
  "1A",
  "2A",
  "3A",
  "4A",
  "5A",
  "6A",
  "7A",
  "8A",
  "9A",
  "10A",
  "11A",
  "12A"
];

export class FeatureAnalyzer {
  constructor(private readonly trackStore: TrackStore) {}

  async enrich(tracks: Track[]): Promise<Track[]> {
    return tracks.map((track, index) => this.enrichTrack(track, index));
  }

  private enrichTrack(track: Track, index: number): Track {
    const cached = this.trackStore.getTrack(track.videoId);
    const existing = cached?.features ?? track.features ?? {};

    const features: TrackFeatures = {
      bpm: existing.bpm ?? this.estimateBpm(track),
      key: existing.key ?? this.estimateKey(track, index),
      energy: existing.energy ?? this.estimateEnergy(track),
      mood: existing.mood ?? this.estimateMood(track)
    };

    const enriched: Track = { ...track, features };
    this.trackStore.upsertTrack(enriched, features);
    return enriched;
  }

  private estimateBpm(track: Track): number {
    const title = track.title.toLowerCase();
    for (const keyword of Object.keys(bpmKeywords)) {
      if (title.includes(keyword)) {
        return bpmKeywords[keyword];
      }
    }
    const duration = track.durationSec;
    return Math.max(90, Math.min(150, Math.round((2400 / Math.max(duration, 1)) * 4)));
  }

  private estimateKey(track: Track, index: number): string {
    const base = index % keyCycle.length;
    return keyCycle[base];
  }

  private estimateEnergy(track: Track): number {
    const title = track.title.toLowerCase();
    if (title.includes("chill") || title.includes("ambient") || title.includes("downtempo")) {
      return 3;
    }
    if (title.includes("drum") || title.includes("bass") || title.includes("techno")) {
      return 8;
    }
    if (title.includes("future") || title.includes("bloom") || title.includes("voltage")) {
      return 9;
    }
    return 6;
  }

  private estimateMood(track: Track): string[] {
    const title = track.title.toLowerCase();
    const moods: string[] = [];
    if (title.includes("chill") || title.includes("downtempo")) moods.push("chill");
    if (title.includes("house")) moods.push("house");
    if (title.includes("techno")) moods.push("techno");
    if (title.includes("bass")) moods.push("bass");
    if (!moods.length) moods.push("electronic");
    return moods;
  }
}
