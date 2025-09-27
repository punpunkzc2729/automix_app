import express from "express";
import { createServer as createHttpServer, type Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { FeatureAnalyzer } from "@main/services/analyzers/featureAnalyzer";
import { YouTubeSearchService } from "@main/services/search/youtubeSearchService";
import { TrackStore } from "@main/services/trackStore";
import { PlannerAdapter } from "@main/services/llm/plannerAdapter";
import { IntentAdapter } from "@main/services/llm/intentAdapter";
import { PlaybackController } from "@main/services/playback/playbackController";
import { PairingManager } from "@main/services/pairing/pairingManager";
import { registerSearchRoutes } from "@main/api/routes/searchRoutes";
import { registerAnalysisRoutes } from "@main/api/routes/analysisRoutes";
import { registerLlmRoutes } from "@main/api/routes/llmRoutes";
import { registerPlaybackRoutes } from "@main/api/routes/playbackRoutes";
import { registerPairingRoutes } from "@main/api/routes/pairingRoutes";
import { registerHealthRoutes } from "@main/api/routes/healthRoutes";
import { registerSocketHandlers } from "@main/services/pairing/socketHandlers";
import { logger } from "@main/utils/logger";

export type AutomixServer = {
  port: number;
  httpServer: HttpServer;
  io: SocketIOServer;
  services: {
    trackStore: TrackStore;
    analyzer: FeatureAnalyzer;
    planner: PlannerAdapter;
    intents: IntentAdapter;
    playback: PlaybackController;
    pairing: PairingManager;
    search: YouTubeSearchService;
  };
};

export const bootstrapServer = async (): Promise<AutomixServer> => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*"
    }
  });

  const trackStore = new TrackStore();
  const analyzer = new FeatureAnalyzer(trackStore);
  const planner = new PlannerAdapter(analyzer);
  const intents = new IntentAdapter();
  const playback = new PlaybackController();
  const pairing = new PairingManager();
  const search = new YouTubeSearchService(trackStore);

  registerHealthRoutes(app);
  registerSearchRoutes(app, search);
  registerAnalysisRoutes(app, analyzer);
  registerLlmRoutes(app, planner, intents, playback);
  registerPairingRoutes(app, pairing);
  registerPlaybackRoutes(app, playback);

  registerSocketHandlers(io, pairing, playback);

  const configuredPort = Number(process.env.AUTOMIX_PORT ?? 0);
  const listenPort = Number.isFinite(configuredPort) && configuredPort >= 0 ? configuredPort : 0;

  await new Promise<void>((resolve) => {
    httpServer.listen(listenPort, "127.0.0.1", () => {
      const address = httpServer.address();
      const actualPort = typeof address === "object" && address ? address.port : listenPort;
      logger.info(`Automix server listening on port ${actualPort}`);
      resolve();
    });
  });

  pairing.cleanupExpiredTokens();
  const cleanupInterval = setInterval(() => pairing.cleanupExpiredTokens(), 30_000);
  cleanupInterval.unref();

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : listenPort;

  return {
    port,
    httpServer,
    io,
    services: {
      trackStore,
      analyzer,
      planner,
      intents,
      playback,
      pairing,
      search
    }
  };
};
