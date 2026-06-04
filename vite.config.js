import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { webhookLoggerPlugin } from "./webhook-logger-plugin.js";
import fs from "fs";
import path from "path";

/**
 * Vite plugin to inject env vars into the Firebase service worker.
 * Service workers can't use import.meta.env, so we replace __VITE_*__
 * placeholders with actual values at build time and in dev middleware.
 */
function firebaseSwPlugin() {
  const envKeys = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  function replacePlaceholders(src) {
    let result = src;
    for (const key of envKeys) {
      result = result.replaceAll(`__${key}__`, process.env[key] || "");
    }
    return result;
  }

  return {
    name: "firebase-sw-env",
    // Dev: serve the processed SW via middleware
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/firebase-messaging-sw.js") {
          const filePath = path.resolve("public/firebase-messaging-sw.js");
          const content = fs.readFileSync(filePath, "utf-8");
          res.setHeader("Content-Type", "application/javascript");
          res.end(replacePlaceholders(content));
          return;
        }
        next();
      });
    },
    // Build: transform the copied SW in the output directory
    closeBundle() {
      const outPath = path.resolve("dist/firebase-messaging-sw.js");
      if (fs.existsSync(outPath)) {
        const content = fs.readFileSync(outPath, "utf-8");
        fs.writeFileSync(outPath, replacePlaceholders(content));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), webhookLoggerPlugin(), firebaseSwPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Strip console.log and console.warn in production builds
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Disable manual chunks to prevent React 19 internal splitting issues
        // This ensures React and its dependencies stay together
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 2000,
  },
  // Optimize dependencies - ensure React stays together
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    host: true,
    proxy: {
      // Main backend API + WebSocket
      "/main": {
        target: process.env.VITE_APP_API_BASE_URL || "https://devapi-shubhtalk.epicon.in",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/main/, ""),
        ws: true,
      },
      // Vedic astrology API
      "/vedic": {
        target: "https://json.astrologyapi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vedic/, ""),
      },
      // Chart generation service
      "/chart": {
        target: "https://pyapi-shubhtalk.epicon.in",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chart/, ""),
      },
      // Voice TTS/STT service
      "/voice": {
        target: "https://api.sarvam.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/voice/, ""),
      },
    },
  },
  esbuild: {
    // Remove console.log and console.warn in production, keep console.error
    pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.warn', 'console.info', 'console.debug'] : [],
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
  },
});