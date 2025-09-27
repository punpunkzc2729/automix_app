import Store from "electron-store";
import { Track, TrackFeatures } from "@shared/types";

export type StoredTrackEntry = {
  track: Track;
  features?: TrackFeatures;
  updatedAt: number;
};

type TrackStoreSchema = {
  tracks: Record<string, StoredTrackEntry>;
};

export class TrackStore {
  private readonly store: Store<TrackStoreSchema>;

  constructor() {
    this.store = new Store<TrackStoreSchema>({
      name: "automix-tracks",
      defaults: { tracks: {} }
    });
  }

  upsertTrack(track: Track, features?: TrackFeatures) {
    const entry: StoredTrackEntry = {
      track,
      features: features ?? this.getFeatures(track.videoId),
      updatedAt: Date.now()
    };
    this.store.set(`tracks.${track.videoId}`, entry);
  }

  getTrack(videoId: string): StoredTrackEntry | undefined {
    return this.store.get(`tracks.${videoId}`);
  }

  getFeatures(videoId: string): TrackFeatures | undefined {
    return this.getTrack(videoId)?.features;
  }

  saveFeatures(videoId: string, features: TrackFeatures) {
    const existing = this.getTrack(videoId);
    if (!existing) return;
    this.store.set(`tracks.${videoId}`, {
      ...existing,
      features,
      updatedAt: Date.now()
    });
  }

  listTracks(): StoredTrackEntry[] {
    const tracks = this.store.get("tracks");
    return Object.values(tracks ?? {}).sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
