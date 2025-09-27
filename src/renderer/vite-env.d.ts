/// <reference types="vite/client" />

interface AutomixBridge {
  getConfig(): Promise<{ apiBaseUrl: string }>;
  on<Event extends string>(event: Event, listener: (event: unknown, payload: unknown) => void): () => void;
}

declare global {
  interface Window {
    automix: AutomixBridge;
  }
}
