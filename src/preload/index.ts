import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

type AutomixConfig = {
  apiBaseUrl: string;
};

type EventMap = {
  "playback:state": unknown;
  "planner:update": unknown;
};

const api = {
  async getConfig(): Promise<AutomixConfig> {
    return ipcRenderer.invoke("automix:get-config");
  },
  on<Event extends keyof EventMap>(event: Event, listener: (event: IpcRendererEvent, payload: EventMap[Event]) => void) {
    ipcRenderer.on(event, listener as any);
    return () => ipcRenderer.removeListener(event, listener as any);
  }
};

contextBridge.exposeInMainWorld("automix", api);
