export type TrackFeatures = {
  bpm?: number;
  key?: string;
  energy?: number;
  mood?: string[];
};

export type Track = {
  videoId: string;
  title: string;
  durationSec: number;
  thumbnails: { url: string }[];
  features?: TrackFeatures;
};

export type TransitionNote = {
  fromId: string;
  toId: string;
  barsOverlap: number;
  targetBpm?: number;
  keyMove?: string;
  fx?: string[];
  inPointSec?: number;
  outPointSec?: number;
};

export type PlanRequest = {
  playlist: Track[];
  target: {
    genre?: string;
    bpmRange?: [number, number];
    energy?: number;
    keyCenter?: string;
  };
  context: {
    crowdEnergy?: number;
    sessionGoal?: string;
    durationMin?: number;
  };
};

export type PlanResponse = {
  orderedTracks: Track[];
  transitions: TransitionNote[];
  rationale?: string;
};

export type AutomixIntent =
  | { intent: "play" }
  | { intent: "pause" }
  | { intent: "next" }
  | { intent: "prev" }
  | { intent: "seek"; params: { positionSec: number } }
  | { intent: "set_energy"; params: { value: number } }
  | { intent: "set_genre"; params: { genre: string } }
  | { intent: "set_bpm_range"; params: { min: number; max: number } }
  | { intent: "toggle_automix"; params?: { enabled?: boolean } }
  | { intent: "jump_to_section"; params: { section: string } }
  | { intent: "request_track"; params: { query: string } };

export type MixerState = {
  activeDeck: "A" | "B";
  crossfader: number;
  energy: number;
  genre?: string;
  automixEnabled: boolean;
  transportPositionSec: number;
};

export type PlannerTransition = TransitionNote & {
  label: string;
};

export type PairingToken = {
  token: string;
  expiresAt: number;
};

export type RemoteClient = {
  id: string;
  lastSeen: number;
  paired: boolean;
};

export type SearchResult = {
  tracks: Track[];
  nextPageToken?: string;
};
