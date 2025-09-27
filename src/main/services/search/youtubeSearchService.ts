import { Track } from "@shared/types";
import type { SearchResult } from "@shared/types";
import { TrackStore } from "@main/services/trackStore";

const demoLibrary: Track[] = [
  {
    videoId: "yt1",
    title: "Solar Echoes - Progressive House",
    durationSec: 420,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt1/hqdefault.jpg" }],
    features: { bpm: 124, key: "8A", energy: 6, mood: ["uplifting", "progressive"] }
  },
  {
    videoId: "yt2",
    title: "Midnight Run - Melodic Techno",
    durationSec: 480,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt2/hqdefault.jpg" }],
    features: { bpm: 126, key: "9A", energy: 7, mood: ["driving", "dark"] }
  },
  {
    videoId: "yt3",
    title: "Amber Lights - Chill Organic House",
    durationSec: 360,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt3/hqdefault.jpg" }],
    features: { bpm: 118, key: "5B", energy: 4, mood: ["warm", "sunset"] }
  },
  {
    videoId: "yt4",
    title: "Cascade Dreams - Liquid Drum & Bass",
    durationSec: 300,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt4/hqdefault.jpg" }],
    features: { bpm: 174, key: "2A", energy: 8, mood: ["fluid", "energetic"] }
  },
  {
    videoId: "yt5",
    title: "Analog Hearts - Indie Electronica",
    durationSec: 390,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt5/hqdefault.jpg" }],
    features: { bpm: 110, key: "6B", energy: 5, mood: ["nostalgic", "lush"] }
  },
  {
    videoId: "yt6",
    title: "Voltage Bloom - Future Bass",
    durationSec: 230,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt6/hqdefault.jpg" }],
    features: { bpm: 150, key: "11B", energy: 9, mood: ["bright", "explosive"] }
  },
  {
    videoId: "yt7",
    title: "Neon Pulse - Synthwave",
    durationSec: 340,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt7/hqdefault.jpg" }],
    features: { bpm: 108, key: "9B", energy: 6, mood: ["retro", "cruising"] }
  },
  {
    videoId: "yt8",
    title: "Crystal Tide - Organic Downtempo",
    durationSec: 400,
    thumbnails: [{ url: "https://img.youtube.com/vi/yt8/hqdefault.jpg" }],
    features: { bpm: 100, key: "4A", energy: 3, mood: ["chill", "tropical"] }
  }
];

export class YouTubeSearchService {
  constructor(private readonly trackStore: TrackStore) {}

  async search(query: string): Promise<SearchResult> {
    const normalized = query.trim().toLowerCase();
    const matches = demoLibrary.filter((track) =>
      normalized.length === 0
        ? true
        : track.title.toLowerCase().includes(normalized)
    );

    matches.forEach((track) => this.trackStore.upsertTrack(track, track.features));

    return {
      tracks: matches,
      nextPageToken: undefined
    };
  }
}
