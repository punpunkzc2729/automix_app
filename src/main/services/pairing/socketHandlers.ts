import type { Server, Socket } from "socket.io";
import { PairingManager } from "@main/services/pairing/pairingManager";
import { PlaybackController } from "@main/services/playback/playbackController";
import { AutomixIntent } from "@shared/types";

const registerSocket = (
  socket: Socket,
  pairingManager: PairingManager,
  playbackController: PlaybackController
) => {
  socket.on("pairing:confirm", ({ token }: { token: string }) => {
    const client = pairingManager.validateToken(token, socket.id);
    if (!client) {
      socket.emit("remote:error", { reason: "invalid_token" });
      return;
    }
    socket.emit("remote:paired", { clientId: client.id, state: playbackController.getState() });
  });

  socket.on("remote:command", (intent: AutomixIntent) => {
    pairingManager.touchClient(socket.id);
    playbackController.handleIntent(intent);
  });

  socket.on("disconnect", () => {
    pairingManager.removeClient(socket.id);
  });
};

export const registerSocketHandlers = (
  io: Server,
  pairingManager: PairingManager,
  playbackController: PlaybackController
) => {
  io.on("connection", (socket) => registerSocket(socket, pairingManager, playbackController));

  pairingManager.on("paired", (client) => {
    io.emit("remote:paired", { client });
  });

  pairingManager.on("unpaired", (clientId) => {
    io.emit("remote:disconnected", { clientId });
  });

  playbackController.on("state", (state) => {
    io.emit("transport:update", state);
  });

  playbackController.on("plan", (plan) => {
    io.emit("planner:update", plan);
  });
};
