import { AutomixIntent } from "@shared/types";

const ENERGY_REGEX = /(energy|intensity)\s*(?:to|at)?\s*(\d)/i;
const GENRE_REGEX = /(house|techno|trance|bass|chill|downtempo|synthwave)/i;
const BPM_REGEX = /(\d{2,3})\s*(?:-(\d{2,3}))?\s*(?:bpm)?/i;

export class IntentAdapter {
  buildPrompt(utterance: string): string {
    return [
      "Classify utterance into {intent, params}.",
      "Intents: play, pause, next, prev, seek, set_energy, set_genre, set_bpm_range, toggle_automix, jump_to_section, request_track.",
      "Output minimal JSON only.",
      `User: ${utterance}`
    ].join("\n");
  }

  parse(utterance: string): AutomixIntent {
    const normalized = utterance.trim().toLowerCase();
    if (!normalized) {
      return { intent: "play" };
    }

    if (normalized.includes("pause")) return { intent: "pause" };
    if (normalized.includes("resume") || normalized.includes("play")) return { intent: "play" };
    if (normalized.includes("next")) return { intent: "next" };
    if (normalized.includes("previous") || normalized.includes("back")) return { intent: "prev" };
    if (normalized.includes("automix")) {
      return { intent: "toggle_automix" };
    }

    const energyMatch = normalized.match(ENERGY_REGEX);
    if (energyMatch) {
      const value = Number(energyMatch[2]);
      return { intent: "set_energy", params: { value } };
    }

    const genreMatch = normalized.match(GENRE_REGEX);
    if (genreMatch) {
      return { intent: "set_genre", params: { genre: genreMatch[1] } };
    }

    const bpmMatch = normalized.match(BPM_REGEX);
    if (bpmMatch) {
      const min = Number(bpmMatch[1]);
      const max = bpmMatch[2] ? Number(bpmMatch[2]) : min;
      return { intent: "set_bpm_range", params: { min, max } };
    }

    if (normalized.startsWith("seek") || normalized.includes("jump")) {
      const secondsMatch = normalized.match(/(\d{1,3})\s*(?:sec|seconds|s)/);
      if (secondsMatch) {
        return { intent: "seek", params: { positionSec: Number(secondsMatch[1]) } };
      }
      return { intent: "jump_to_section", params: { section: "drop" } };
    }

    if (normalized.includes("request") || normalized.includes("add")) {
      const query = normalized.replace(/(request|add|track)/g, "").trim();
      return { intent: "request_track", params: { query: query || utterance } };
    }

    return { intent: "play" };
  }
}
