import { app, BrowserWindow, ipcMain, shell } from "electron";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import Store from "electron-store";
import { EventEmitter } from "node:events";
import { randomBytes } from "node:crypto";
const bpmKeywords = {
  house: 124,
  techno: 128,
  trance: 138,
  drum: 174,
  bass: 174,
  synthwave: 108,
  downtempo: 96,
  chill: 100,
  progressive: 124,
  indie: 110
};
const keyCycle = [
  "1A",
  "2A",
  "3A",
  "4A",
  "5A",
  "6A",
  "7A",
  "8A",
  "9A",
  "10A",
  "11A",
  "12A"
];
class FeatureAnalyzer {
  constructor(trackStore) {
    this.trackStore = trackStore;
  }
  async enrich(tracks) {
    return tracks.map((track, index) => this.enrichTrack(track, index));
  }
  enrichTrack(track, index) {
    const cached = this.trackStore.getTrack(track.videoId);
    const existing = cached?.features ?? track.features ?? {};
    const features = {
      bpm: existing.bpm ?? this.estimateBpm(track),
      key: existing.key ?? this.estimateKey(track, index),
      energy: existing.energy ?? this.estimateEnergy(track),
      mood: existing.mood ?? this.estimateMood(track)
    };
    const enriched = { ...track, features };
    this.trackStore.upsertTrack(enriched, features);
    return enriched;
  }
  estimateBpm(track) {
    const title = track.title.toLowerCase();
    for (const keyword of Object.keys(bpmKeywords)) {
      if (title.includes(keyword)) {
        return bpmKeywords[keyword];
      }
    }
    const duration = track.durationSec;
    return Math.max(90, Math.min(150, Math.round(2400 / Math.max(duration, 1) * 4)));
  }
  estimateKey(track, index) {
    const base = index % keyCycle.length;
    return keyCycle[base];
  }
  estimateEnergy(track) {
    const title = track.title.toLowerCase();
    if (title.includes("chill") || title.includes("ambient") || title.includes("downtempo")) {
      return 3;
    }
    if (title.includes("drum") || title.includes("bass") || title.includes("techno")) {
      return 8;
    }
    if (title.includes("future") || title.includes("bloom") || title.includes("voltage")) {
      return 9;
    }
    return 6;
  }
  estimateMood(track) {
    const title = track.title.toLowerCase();
    const moods = [];
    if (title.includes("chill") || title.includes("downtempo")) moods.push("chill");
    if (title.includes("house")) moods.push("house");
    if (title.includes("techno")) moods.push("techno");
    if (title.includes("bass")) moods.push("bass");
    if (!moods.length) moods.push("electronic");
    return moods;
  }
}
const demoLibrary = [
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
class YouTubeSearchService {
  constructor(trackStore) {
    this.trackStore = trackStore;
  }
  async search(query) {
    const normalized = query.trim().toLowerCase();
    const matches = demoLibrary.filter(
      (track) => normalized.length === 0 ? true : track.title.toLowerCase().includes(normalized)
    );
    matches.forEach((track) => this.trackStore.upsertTrack(track, track.features));
    return {
      tracks: matches,
      nextPageToken: void 0
    };
  }
}
class TrackStore {
  constructor() {
    this.store = new Store({
      name: "automix-tracks",
      defaults: { tracks: {} }
    });
  }
  upsertTrack(track, features) {
    const entry = {
      track,
      features: features ?? this.getFeatures(track.videoId),
      updatedAt: Date.now()
    };
    this.store.set(`tracks.${track.videoId}`, entry);
  }
  getTrack(videoId) {
    return this.store.get(`tracks.${videoId}`);
  }
  getFeatures(videoId) {
    return this.getTrack(videoId)?.features;
  }
  saveFeatures(videoId, features) {
    const existing = this.getTrack(videoId);
    if (!existing) return;
    this.store.set(`tracks.${videoId}`, {
      ...existing,
      features,
      updatedAt: Date.now()
    });
  }
  listTracks() {
    const tracks = this.store.get("tracks");
    return Object.values(tracks ?? {}).sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
const logger = {
  info(message, payload) {
    console.info(`[automix] ${(/* @__PURE__ */ new Date()).toISOString()} INFO: ${message}`, payload ?? "");
  },
  warn(message, payload) {
    console.warn(`[automix] ${(/* @__PURE__ */ new Date()).toISOString()} WARN: ${message}`, payload ?? "");
  },
  error(message, payload) {
    console.error(`[automix] ${(/* @__PURE__ */ new Date()).toISOString()} ERROR: ${message}`, payload ?? "");
  }
};
const camelotKeyToNumber = (key) => {
  if (!key) return void 0;
  const match = key.match(/(\d{1,2})[AB]/i);
  if (!match) return void 0;
  return Number(match[1]);
};
const numberToCamelot = (value) => {
  if (!value) return void 0;
  const normalized = (value - 1 + 12) % 12 + 1;
  return `${normalized}A`;
};
class PlannerAdapter {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }
  async plan(request) {
    const enriched = await this.analyzer.enrich(request.playlist);
    const sorted = this.sortTracks(enriched, request);
    const transitions = this.buildTransitions(sorted);
    const rationale = this.composeRationale(sorted, request);
    logger.info("Planner produced automix", { count: sorted.length });
    return {
      orderedTracks: sorted,
      transitions,
      rationale
    };
  }
  sortTracks(tracks, request) {
    const { target } = request;
    const targetEnergy = target.energy ?? 6;
    const targetBpm = target.bpmRange ? (target.bpmRange[0] + target.bpmRange[1]) / 2 : void 0;
    return tracks.slice().sort((a, b) => this.scoreTrack(a, targetEnergy, targetBpm) - this.scoreTrack(b, targetEnergy, targetBpm));
  }
  scoreTrack(track, targetEnergy, targetBpm) {
    const bpm = track.features?.bpm ?? 120;
    const energy = track.features?.energy ?? 5;
    const energyScore = Math.abs(energy - targetEnergy);
    const bpmScore = targetBpm ? Math.abs(bpm - targetBpm) / 10 : 0;
    return energyScore + bpmScore;
  }
  buildTransitions(tracks) {
    const transitions = [];
    for (let i = 0; i < tracks.length - 1; i += 1) {
      const current = tracks[i];
      const next = tracks[i + 1];
      const currentKeyNumber = camelotKeyToNumber(current.features?.key);
      const nextKeyNumber = camelotKeyToNumber(next.features?.key);
      let adjustedKey = nextKeyNumber;
      if (currentKeyNumber && nextKeyNumber) {
        const diff = Math.abs(currentKeyNumber - nextKeyNumber);
        if (diff > 1 && diff !== 11) {
          adjustedKey = currentKeyNumber + (diff > 6 ? -1 : 1);
        }
      }
      const targetBpm = this.computeTargetBpm(current, next);
      const barsOverlap = this.pickBarsOverlap(current, next);
      const transition = {
        fromId: current.videoId,
        toId: next.videoId,
        barsOverlap,
        targetBpm,
        keyMove: currentKeyNumber && adjustedKey ? `${numberToCamelot(currentKeyNumber)} → ${numberToCamelot(adjustedKey)}` : void 0,
        fx: this.pickFx(current, next),
        inPointSec: Math.max(0, current.durationSec - barsOverlap * 2),
        outPointSec: Math.min(next.durationSec, barsOverlap * 2)
      };
      transitions.push(transition);
    }
    return transitions;
  }
  pickBarsOverlap(current, next) {
    const energy = next.features?.energy ?? current.features?.energy ?? 6;
    if (energy >= 8) return 32;
    if (energy >= 6) return 16;
    return 8;
  }
  computeTargetBpm(current, next) {
    const currentBpm = current.features?.bpm;
    const nextBpm = next.features?.bpm;
    if (!currentBpm || !nextBpm) return void 0;
    const drift = (nextBpm - currentBpm) / currentBpm;
    if (Math.abs(drift) <= 0.06) {
      return Math.round((currentBpm + nextBpm) / 2);
    }
    return currentBpm;
  }
  pickFx(current, next) {
    const currentEnergy = current.features?.energy ?? 5;
    const nextEnergy = next.features?.energy ?? 5;
    if (nextEnergy > currentEnergy + 1) return ["filter-rise", "noise-swell"];
    if (currentEnergy > nextEnergy + 1) return ["echo-tail"];
    return ["clean-crossfade"];
  }
  composeRationale(tracks, request) {
    const genre = request.target.genre ?? "mixed";
    const energy = request.target.energy ?? 6;
    const inferred = tracks.filter((track) => !track.features?.bpm || !track.features?.key);
    const inferenceNote = inferred.length ? `${inferred.length} tracks missing metadata were inferred heuristically.` : "All tracks had cached metadata.";
    return `Built a ${genre} leaning set with target energy ${energy}. ${inferenceNote}`;
  }
}
const ENERGY_REGEX = /(energy|intensity)\s*(?:to|at)?\s*(\d)/i;
const GENRE_REGEX = /(house|techno|trance|bass|chill|downtempo|synthwave)/i;
const BPM_REGEX = /(\d{2,3})\s*(?:-(\d{2,3}))?\s*(?:bpm)?/i;
class IntentAdapter {
  buildPrompt(utterance) {
    return [
      "Classify utterance into {intent, params}.",
      "Intents: play, pause, next, prev, seek, set_energy, set_genre, set_bpm_range, toggle_automix, jump_to_section, request_track.",
      "Output minimal JSON only.",
      `User: ${utterance}`
    ].join("\n");
  }
  parse(utterance) {
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
class PlaybackController extends EventEmitter {
  constructor() {
    super();
    this.state = {
      activeDeck: "A",
      crossfader: 0.5,
      energy: 6,
      automixEnabled: true,
      transportPositionSec: 0
    };
    this.plan = null;
    this.queue = [];
  }
  getState() {
    return this.state;
  }
  getPlan() {
    return this.plan;
  }
  setPlan(plan) {
    this.plan = plan;
    this.queue = plan.orderedTracks;
    this.emit("plan", plan);
  }
  setQueue(queue) {
    this.queue = queue;
  }
  handleIntent(intent) {
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
    }
    this.emit("state", this.state);
  }
  updateCrossfader(value) {
    this.state = { ...this.state, crossfader: Math.max(0, Math.min(1, value)) };
    this.emit("state", this.state);
  }
  incrementTransport(delta) {
    this.state = {
      ...this.state,
      transportPositionSec: Math.max(0, this.state.transportPositionSec + delta)
    };
    this.emit("transport", { positionSec: this.state.transportPositionSec });
    this.emit("state", this.state);
  }
  advanceDeck() {
    this.state = {
      ...this.state,
      activeDeck: this.state.activeDeck === "A" ? "B" : "A",
      transportPositionSec: 0
    };
  }
  reverseDeck() {
    this.state = {
      ...this.state,
      activeDeck: this.state.activeDeck === "A" ? "B" : "A",
      transportPositionSec: 0
    };
  }
}
class PairingManager extends EventEmitter {
  constructor() {
    super();
    this.pendingTokens = /* @__PURE__ */ new Map();
    this.clients = /* @__PURE__ */ new Map();
  }
  issueToken(ttlMs = 6e4) {
    const token = randomBytes(4).toString("hex");
    const expiresAt = Date.now() + ttlMs;
    const pairingToken = { token, expiresAt };
    this.pendingTokens.set(token, pairingToken);
    return pairingToken;
  }
  validateToken(token, clientId) {
    const entry = this.pendingTokens.get(token);
    if (!entry) return void 0;
    if (Date.now() > entry.expiresAt) {
      this.pendingTokens.delete(token);
      return void 0;
    }
    this.pendingTokens.delete(token);
    const client = {
      id: clientId,
      lastSeen: Date.now(),
      paired: true
    };
    this.clients.set(clientId, client);
    this.emit("paired", client);
    return client;
  }
  touchClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastSeen = Date.now();
      this.clients.set(clientId, client);
    }
  }
  removeClient(clientId) {
    if (this.clients.delete(clientId)) {
      this.emit("unpaired", clientId);
    }
  }
  dispatchCommand(clientId, payload) {
    this.emit("command", clientId, payload);
  }
  listClients() {
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
const registerSearchRoutes = (app2, searchService) => {
  app2.get("/api/yt/search", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const results = await searchService.search(q ?? "");
    res.json(results);
  });
};
const registerAnalysisRoutes = (app2, analyzer) => {
  app2.post("/api/analysis/enrich", async (req, res) => {
    const body = req.body;
    const enriched = await analyzer.enrich(body?.tracks ?? []);
    res.json({ tracks: enriched });
  });
};
const registerLlmRoutes = (app2, planner, intents, playback) => {
  app2.post("/api/llm/plan", async (req, res) => {
    const body = req.body;
    const plan = await planner.plan(body.request);
    playback.setPlan(plan);
    res.json(plan);
  });
  app2.post("/api/llm/intent", (req, res) => {
    const body = req.body;
    const parsed = intents.parse(body.utterance ?? "");
    res.json({ intent: parsed, prompt: intents.buildPrompt(body.utterance ?? "") });
  });
};
const registerPlaybackRoutes = (app2, playback) => {
  app2.get("/api/playback/state", (_req, res) => {
    res.json(playback.getState());
  });
  app2.post("/api/playback/crossfader", (req, res) => {
    const value = Number(req.body.value ?? 0.5);
    playback.updateCrossfader(value);
    res.json(playback.getState());
  });
  app2.post("/api/playback/intent", (req, res) => {
    const intent = req.body.intent;
    if (intent) {
      playback.handleIntent(intent);
    }
    res.json({ state: playback.getState() });
  });
};
const registerPairingRoutes = (app2, pairing) => {
  app2.post("/api/pair/request", (_req, res) => {
    const token = pairing.issueToken();
    res.json(token);
  });
  app2.get("/api/pair/clients", (_req, res) => {
    res.json({ clients: pairing.listClients() });
  });
  app2.post("/api/pair/clear", (_req, res) => {
    pairing.listClients().forEach((client) => pairing.removeClient(client.id));
    res.json({ ok: true });
  });
};
const registerHealthRoutes = (app2) => {
  app2.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
};
const registerSocket = (socket, pairingManager, playbackController) => {
  socket.on("pairing:confirm", ({ token }) => {
    const client = pairingManager.validateToken(token, socket.id);
    if (!client) {
      socket.emit("remote:error", { reason: "invalid_token" });
      return;
    }
    socket.emit("remote:paired", { clientId: client.id, state: playbackController.getState() });
  });
  socket.on("remote:command", (intent) => {
    pairingManager.touchClient(socket.id);
    playbackController.handleIntent(intent);
  });
  socket.on("disconnect", () => {
    pairingManager.removeClient(socket.id);
  });
};
const registerSocketHandlers = (io, pairingManager, playbackController) => {
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
const bootstrapServer = async () => {
  const app2 = express();
  app2.use(cors());
  app2.use(express.json({ limit: "1mb" }));
  const httpServer = createServer(app2);
  const io = new Server(httpServer, {
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
  registerHealthRoutes(app2);
  registerSearchRoutes(app2, search);
  registerAnalysisRoutes(app2, analyzer);
  registerLlmRoutes(app2, planner, intents, playback);
  registerPairingRoutes(app2, pairing);
  registerPlaybackRoutes(app2, playback);
  registerSocketHandlers(io, pairing, playback);
  const configuredPort = Number(process.env.AUTOMIX_PORT ?? 0);
  const listenPort = Number.isFinite(configuredPort) && configuredPort >= 0 ? configuredPort : 0;
  await new Promise((resolve) => {
    httpServer.listen(listenPort, "127.0.0.1", () => {
      const address2 = httpServer.address();
      const actualPort = typeof address2 === "object" && address2 ? address2.port : listenPort;
      logger.info(`Automix server listening on port ${actualPort}`);
      resolve();
    });
  });
  pairing.cleanupExpiredTokens();
  const cleanupInterval = setInterval(() => pairing.cleanupExpiredTokens(), 3e4);
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
const mainDir = dirname(fileURLToPath(import.meta.url));
const rendererIndex = join(mainDir, "../renderer/index.html");
const getPreloadPath = () => {
  const candidates = ["../preload/index.js", "../preload/index.cjs", "../preload/index.mjs"];
  for (const candidate of candidates) {
    const absolute = join(mainDir, candidate);
    if (existsSync(absolute)) {
      return absolute;
    }
  }
  return join(mainDir, "../preload/index.js");
};
let mainWindow = null;
let automixServer = null;
let apiBaseUrl = "http://127.0.0.1:0";
const createWindow = async () => {
  const preloadPath = getPreloadPath();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: "#0c0c10",
    title: "Automix",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  });
  if (process.env.MAIN_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.MAIN_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" }).catch(() => null);
  } else {
    await mainWindow.loadFile(rendererIndex);
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};
const start = async () => {
  automixServer = await bootstrapServer();
  apiBaseUrl = `http://127.0.0.1:${automixServer.port}`;
  logger.info("Automix API ready", { apiBaseUrl });
  ipcMain.handle("automix:get-config", () => ({ apiBaseUrl }));
  await createWindow();
};
app.whenReady().then(start).catch((error) => {
  logger.error("Failed to bootstrap application", error);
  app.exit(1);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
app.on("before-quit", () => {
  if (automixServer) {
    automixServer.httpServer.close();
    automixServer.io.close();
  }
});
process.once("SIGINT", () => {
  if (automixServer) {
    automixServer.httpServer.close();
    automixServer.io.close();
  }
  app.quit();
});
process.once("SIGTERM", () => {
  if (automixServer) {
    automixServer.httpServer.close();
    automixServer.io.close();
  }
  app.quit();
});
