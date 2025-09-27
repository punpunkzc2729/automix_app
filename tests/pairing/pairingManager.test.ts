import { describe, it, expect } from "vitest";
import { PairingManager } from "@main/services/pairing/pairingManager";

describe("PairingManager", () => {
  it("issues and validates tokens", () => {
    const pairing = new PairingManager();
    const token = pairing.issueToken(1000);
    const client = pairing.validateToken(token.token, "client-1");
    expect(client?.paired).toBe(true);
    expect(pairing.listClients()).toHaveLength(1);
  });

  it("rejects expired tokens", () => {
    const pairing = new PairingManager();
    const token = pairing.issueToken(-1);
    const client = pairing.validateToken(token.token, "client-2");
    expect(client).toBeUndefined();
  });
});
