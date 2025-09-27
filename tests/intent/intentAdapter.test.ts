import { describe, it, expect } from "vitest";
import { IntentAdapter } from "@main/services/llm/intentAdapter";

describe("IntentAdapter", () => {
  const adapter = new IntentAdapter();

  it("parses energy commands", () => {
    const intent = adapter.parse("raise energy to 8");
    expect(intent.intent).toBe("set_energy");
    expect(intent).toHaveProperty(["params", "value"], 8);
  });

  it("falls back to play when unknown", () => {
    const intent = adapter.parse("something random");
    expect(intent.intent).toBe("play");
  });

  it("parses genre switches", () => {
    const intent = adapter.parse("switch to house");
    expect(intent.intent).toBe("set_genre");
    expect(intent).toHaveProperty(["params", "genre"], "house");
  });
});
