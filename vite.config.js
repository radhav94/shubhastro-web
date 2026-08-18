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
    sourcemap: 'hidden',
    minify: 'esbuild',
    /*
     * Explicit syntax floor.
     *
     * Vite 6+ defaults `build.target` to 'baseline-widely-available'
     * (chrome107 / edge107 / firefox104 / safari16), and this project declares
     * no browserslist — so ES2021+ syntax from dependencies was emitted
     * untouched. Two shipped examples: `||=` from the Agora RTC SDK and `??=`
     * from RTK Query's cache internals.
     *
     * Logical assignment is a *parse-time* feature. An engine that lacks it
     * doesn't fail gracefully on one function — it rejects the whole chunk with
     * "Unexpected token '='", so the app never boots and the visitor sees a
     * blank page. That is unrecoverable and invisible to feature detection.
     *
     * The floor was previously ['es2020', 'chrome87', 'edge88', 'firefox78',
     * 'safari14'], which lowered logical assignment but deliberately left
     * ES2020 syntax native. That shipped 100 bare `??` operators in the entry
     * chunk, and nullish coalescing is the same kind of parse-time cliff:
     * Chrome 80 / Edge 80 / Firefox 72 / Safari 13.4 introduced it, and anything
     * older rejects the entire chunk with "Unexpected token '?'". (V8 reports
     * `??` as "Unexpected token '?'" and `?.` as "Unexpected token '.'", so that
     * exact message pins it to nullish coalescing.) Observed in the wild on
     * Chrome Mobile from Google organic search: error at 00:01, zero clicks,
     * gone by 00:04 — a blank page.
     *
     * So the floor now sits one rung below `??`. safari13 and firefox71 predate
     * it, which makes esbuild lower `??` (and optional chaining) across every
     * chunk, dependencies included. Raising any of these back above
     * chrome80/edge80/firefox72/safari13.4 reintroduces the blank page.
     */
    target: ['es2019', 'chrome79', 'edge79', 'firefox71', 'safari13'],
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
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    host: true,
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
    pure: [],
    drop: [],
  },
});
