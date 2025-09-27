import { EventEmitter } from "node:events";
import { randomBytes } from "node:crypto";
import { PairingToken, RemoteClient } from "@shared/types";

export type PairingEvents = {
  paired: (client: RemoteClient) => void;
  unpaired: (clientId: string) => void;
  command: (clientId: string, payload: unknown) => void;
};

export class PairingManager extends EventEmitter {
  private pendingTokens = new Map<string, PairingToken>();
  private clients = new Map<string, RemoteClient>();

  constructor() {
    super();
  }

  issueToken(ttlMs = 60_000): PairingToken {
    const token = randomBytes(4).toString("hex");
    const expiresAt = Date.now() + ttlMs;
    const pairingToken: PairingToken = { token, expiresAt };
    this.pendingTokens.set(token, pairingToken);
    return pairingToken;
  }

  validateToken(token: string, clientId: string): RemoteClient | undefined {
    const entry = this.pendingTokens.get(token);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.pendingTokens.delete(token);
      return undefined;
    }

    this.pendingTokens.delete(token);
    const client: RemoteClient = {
      id: clientId,
      lastSeen: Date.now(),
      paired: true
    };
    this.clients.set(clientId, client);
    this.emit("paired", client);
    return client;
  }

  touchClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastSeen = Date.now();
      this.clients.set(clientId, client);
    }
  }

  removeClient(clientId: string) {
    if (this.clients.delete(clientId)) {
      this.emit("unpaired", clientId);
    }
  }

  dispatchCommand(clientId: string, payload: unknown) {
    this.emit("command", clientId, payload);
  }

  listClients(): RemoteClient[] {
    return Array.from(this.clients.values());
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, entry] of this.pendingTokens.entries()) {
      if (now > entry.expiresAt) {
        this.pendingTokens.delete(token);
      }
    }
  }
}
