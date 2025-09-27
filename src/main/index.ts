import { app, BrowserWindow, ipcMain, shell } from "electron";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapServer, type AutomixServer } from "@main/api/server";
import { logger } from "@main/utils/logger";

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

let mainWindow: BrowserWindow | null = null;
let automixServer: AutomixServer | null = null;
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
