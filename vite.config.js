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

/**
 * Vite plugin to inject env vars into index.html
 * Replaces %VITE_*% placeholders in index.html with actual env values
 * Uses proper Vite hooks: transformIndexHtml + closeBundle
 */
function indexHtmlEnvPlugin() {
  const envKeys = [
    "VITE_BRANCH_KEY",
  ];

  function replacePlaceholders(src) {
    let result = src;
    for (const key of envKeys) {
      result = result.replaceAll(`%${key}%`, process.env[key] || "");
    }
    return result;
  }

  return {
    name: "index-html-env",
    // Dev: Use Vite's proper index.html transformation hook
    transformIndexHtml(html) {
      return replacePlaceholders(html);
    },
    // Build: transform index.html in output
    closeBundle() {
      const outPath = path.resolve("dist/index.html");
      if (fs.existsSync(outPath)) {
        const content = fs.readFileSync(outPath, "utf-8");
        fs.writeFileSync(outPath, replacePlaceholders(content));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), webhookLoggerPlugin(), firebaseSwPlugin(), indexHtmlEnvPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    /*
      Source maps off for production builds.
      ======================================

      This was `'hidden'`, which generates the maps but omits the
      //# sourceMappingURL comment. Two independent reasons to turn it off
      entirely, one security and one operational:

      1. SECURITY. 'hidden' stops DevTools auto-loading maps; it does not make
         them unreachable. Map filenames derive mechanically from chunk
         filenames, and those are listed in index.html, so anyone can fetch them
         by name. The build was emitting 299 maps totalling 47 MB, including a
         ~7.2 MB map for the entry chunk — together they reconstruct the original
         source, including every internal comment. nginx now returns 404 for
         *.map, but defence in depth means not generating them at all is better
         than relying on one server rule that a future config change could drop.

      2. BUILD MEMORY. Vite holds map data through the "rendering chunks" phase.
         A production build OOM'd there with "Ineffective mark-compacts near heap
         limit" at a ~2 GB heap cap (vite 7.3.3, 4147 modules, died at chunk 220).

         Measured peak RSS for a full build on this machine:

             sourcemap: 'hidden'   3,058,515,968 B  (2.85 GB)  15.73 s
             sourcemap: false      2,383,626,240 B  (2.22 GB)  12.22 s
             delta                  -674,889,728 B  (-28%)     -3.5 s

         So maps are a real and large cost. But to be accurate about what this
         change does and does not achieve: turning them off is NOT sufficient on
         its own. Capping the heap at 1024 MB still OOMs with maps disabled, so
         this reduces pressure rather than removing the ceiling. The reliable fix
         for the OOM is the raised --max-old-space-size in the package.json build
         scripts; this change buys ~675 MB of headroom on top of it.

      Verified nothing consumes these maps: no Sentry, Bugsnag, Rollbar or
      Datadog in package.json or src. The inline error reporter in index.html
      pushes js_error to dataLayer and does not symbolicate.

      If error monitoring is added later, do NOT simply set this back to 'hidden'.
      Generate maps in a separate CI step, upload them privately to that tool, and
      keep them out of the deploy artifact.

      Note also that `vite` is pinned as `^7.1.7`, so different machines resolve
      different patch versions (7.3.0 locally vs 7.3.3 on the failing build).
      That is worth tightening separately — a caret range on the bundler means
      build memory behaviour is not reproducible across machines.
    */
    sourcemap: false,
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
    /*
      Strip debug logging from production bundles.

      Measured before this change: 762 `console.log` in src, and 672 surviving
      into `dist/assets/*.js`. That is not just noise — several flows here log
      richly for diagnosis (the Truecaller poll logs HTTP statuses and server
      messages, the STT hook logs mic errors), and some of that describes
      internal endpoint behaviour to anyone with the console open.

      Why `pure` and not `drop`
      -------------------------
      This `esbuild` block is Vite's *transform* config and applies to dev as
      well as build, because vite.config.js uses the object form of
      `defineConfig` rather than the function form.

      `pure` marks these calls side-effect-free so the minifier can eliminate
      them. Minification only runs for production builds (`build.minify:
      'esbuild'` above), so this is inert in dev and developers keep their
      console output. That is the whole reason for choosing `pure` here.

      `drop: ['debugger']` is deliberately NOT set. `drop` acts at transform
      time, so it would strip `debugger` during development too and quietly break
      breakpoint debugging. Both src and dist currently contain zero `debugger`
      statements, so there is nothing to remove today. If a policy guard is
      wanted, convert this file to `defineConfig(({ command }) => ({ … }))` and
      set `drop` only when `command === 'build'` — a real change, not one to make
      as a side effect of this one.

      `console.warn` and `console.error` are intentionally kept. They are
      load-bearing: `[SarvamSTT] Mic access error`, the Truecaller diagnostics,
      and the inline error reporter in index.html all rely on them, and silently
      dropping error paths makes production failures unreportable.
    */
    pure: ["console.log", "console.debug", "console.info"],
    drop: [],
  },
});
