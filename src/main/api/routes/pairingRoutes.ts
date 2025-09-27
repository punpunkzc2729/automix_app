import type { Express } from "express";
import { PairingManager } from "@main/services/pairing/pairingManager";

export const registerPairingRoutes = (app: Express, pairing: PairingManager) => {
  app.post("/api/pair/request", (_req, res) => {
    const token = pairing.issueToken();
    res.json(token);
  });

  app.get("/api/pair/clients", (_req, res) => {
    res.json({ clients: pairing.listClients() });
  });

  app.post("/api/pair/clear", (_req, res) => {
    pairing.listClients().forEach((client) => pairing.removeClient(client.id));
    res.json({ ok: true });
  });
};
