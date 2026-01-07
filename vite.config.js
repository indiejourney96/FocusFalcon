import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["webextension-polyfill"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.js"),
      },
      output: {
        entryFileNames: "[name].js",
        // 🔑 CRITICAL: stop shared chunking
        manualChunks: undefined,
      },
    },
  },
  publicDir: "public",
});
