import { contextBridge, ipcRenderer } from "electron";
const api = {
  async getConfig() {
    return ipcRenderer.invoke("automix:get-config");
  },
  on(event, listener) {
    ipcRenderer.on(event, listener);
    return () => ipcRenderer.removeListener(event, listener);
  }
};
contextBridge.exposeInMainWorld("automix", api);
