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
        manualChunks(id) {
          // Keep React core together
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
          // Redux + RTK in own chunk
          if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/redux') || id.includes('node_modules/react-redux')) {
            return 'redux-vendor';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
        },
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
    // Dev mirrors production's same-origin path setup: the frontend calls
    // "/sgw/..." (VITE_SGW_URL="/sgw") and vite proxies that to the local
    // secure gateway, stripping the /sgw prefix — exactly like nginx does in
    // prod. Start the gateway first: `cd secure-gateway && npm start`
    // (defaults to 127.0.0.1:8787). Override with SGW_URL if needed.
    proxy: {
      "/sgw": {
        target: process.env.SGW_URL || "http://127.0.0.1:8787",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/sgw/, ""),
      },
    },
  },
  esbuild: {
    // Remove console.log and console.warn in production, keep console.error
    pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.warn', 'console.info', 'console.debug'] : [],
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
  },
});