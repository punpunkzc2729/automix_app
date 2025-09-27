# Automix App

Electron-based desktop automix controller with a React + Vite renderer, YouTube search, heuristic audio feature analysis, and Socket.IO-powered remote pairing.

## Features

- Express API for YouTube search (placeholder library), track analysis cache, planner, intents, and pairing.
- Planner and intent adapters matching Gemma prompt contracts.
- Playback controller with crossfader, energy control, and transport intents.
- React UI with Tailwind + shadcn primitives covering decks, mixer, planner queue, and transport bar.
- Socket.IO bridge and pairing token manager for mobile remote connections.
- Vitest unit tests for planner heuristics, intent parsing, and pairing flows.

## Getting Started

1. Install dependencies (Node 18+ recommended):

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit as needed (e.g., AUTOMIX_PORT)
   ```

3. Run the app in development mode:

   ```bash
   npm run dev
   ```

   This launches the Electron shell, starts the internal Express/Socket.IO server, and serves the React UI via Vite.

4. Build for production:

   ```bash
   npm run build
   npm run preview
   ```

## Testing

Run the Vitest test suite:

```bash
npm test
```

Tests use lightweight mocks for Electron Store to avoid filesystem writes.

## YouTube Compliance

- The app only stores metadata (`videoId`, `title`, durations, thumbnails, and derived features).
- Playback uses the YouTube IFrame Player API (stubbed for now) and adheres to API quota/ToS rules.
- Refer to `.env.example` for configuring your YouTube Data API key once the remote player is implemented.

## LLM Adapters

- **Gemma 3 Planner**: `PlannerAdapter` enriches tracks via `FeatureAnalyzer`, produces key-compatible transitions, and returns `PlanResponse` JSON.
- **Gemma 4B Intent Parser**: `IntentAdapter` provides a deterministic fallback parser and `buildPrompt` helper for remote inference.

## Architecture Overview

- `src/main`: Electron main process, Express routes, Socket.IO handlers, and service layer.
- `src/preload`: Secure bridge exposing config utilities to the renderer.
- `src/renderer`: React UI (components, hooks, styles) built with Vite + Tailwind.
- `src/shared`: Shared TypeScript types for the entire stack.
- `tests`: Vitest suites covering planner, intent parsing, and pairing state.

## Roadmap

- Integrate real YouTube Data API search + IFrame playback engine.
- Wire Gemma endpoints and Socket.IO signaling for live LLM orchestration.
- Flesh out mobile remote UI and QR pairing flow.
- Add performance instrumentation (latency indicators, jitter metrics) and accessibility polish.
