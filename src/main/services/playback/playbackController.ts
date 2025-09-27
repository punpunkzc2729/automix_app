import { EventEmitter } from "node:events";
import { AutomixIntent, MixerState, PlanResponse, Track } from "@shared/types";

export type PlaybackEvents = {
  state: (state: MixerState) => void;
  plan: (plan: PlanResponse) => void;
  transport: (payload: { positionSec: number }) => void;
};

export class PlaybackController extends EventEmitter {
  private state: MixerState = {
    activeDeck: "A",
    crossfader: 0.5,
    energy: 6,
    automixEnabled: true,
    transportPositionSec: 0
  };

  private plan: PlanResponse | null = null;
  private queue: Track[] = [];

  constructor() {
    super();
  }

  getState(): MixerState {
    return this.state;
  }

  getPlan(): PlanResponse | null {
    return this.plan;
  }

  setPlan(plan: PlanResponse) {
    this.plan = plan;
    this.queue = plan.orderedTracks;
    this.emit("plan", plan);
  }

  setQueue(queue: Track[]) {
    this.queue = queue;
  }

  handleIntent(intent: AutomixIntent) {
    switch (intent.intent) {
      case "play":
        this.state = { ...this.state, transportPositionSec: this.state.transportPositionSec };
        break;
      case "pause":
        break;
      case "next":
        this.advanceDeck();
        break;
      case "prev":
        this.reverseDeck();
        break;
      case "set_energy":
        this.state = { ...this.state, energy: intent.params.value };
        break;
      case "set_genre":
        this.state = { ...this.state, genre: intent.params.genre };
        break;
      case "set_bpm_range":
        this.state = { ...this.state };
        break;
      case "seek":
        this.state = { ...this.state, transportPositionSec: intent.params.positionSec };
        this.emit("transport", { positionSec: intent.params.positionSec });
        break;
      case "toggle_automix":
        this.state = { ...this.state, automixEnabled: !this.state.automixEnabled };
        break;
      case "jump_to_section":
        this.state = { ...this.state, transportPositionSec: this.state.transportPositionSec + 32 };
        break;
      case "request_track":
        break;
      default:
        break;
    }
    this.emit("state", this.state);
  }

  updateCrossfader(value: number) {
    this.state = { ...this.state, crossfader: Math.max(0, Math.min(1, value)) };
    this.emit("state", this.state);
  }

  incrementTransport(delta: number) {
    this.state = {
      ...this.state,
      transportPositionSec: Math.max(0, this.state.transportPositionSec + delta)
    };
    this.emit("transport", { positionSec: this.state.transportPositionSec });
    this.emit("state", this.state);
  }

  private advanceDeck() {
    this.state = {
      ...this.state,
      activeDeck: this.state.activeDeck === "A" ? "B" : "A",
      transportPositionSec: 0
    };
  }

  private reverseDeck() {
    this.state = {
      ...this.state,
      activeDeck: this.state.activeDeck === "A" ? "B" : "A",
      transportPositionSec: 0
    };
  }
}
