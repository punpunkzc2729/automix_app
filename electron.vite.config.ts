import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const alias = {
  "@shared": resolve(__dirname, "src/shared"),
  "@main": resolve(__dirname, "src/main"),
  "@renderer": resolve(__dirname, "src/renderer")
};

export default defineConfig({
  main: {
    resolve: {
      alias
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts")
        }
      }
    }
  },
  preload: {
    resolve: {
      alias
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts")
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias
    },
    plugins: [react()],
    build: {
      outDir: "dist/renderer"
    }
  }
});
