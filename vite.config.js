import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { webhookLoggerPlugin } from "./webhook-logger-plugin.js";
import fs from "fs";
import path from "path";

/**
 * Vite plugin: Meta tag injection for bot crawlers (link previews).
 * Intercepts requests from WhatsApp, Facebook, Twitter, etc. and returns
 * index.html with dynamic meta tags fetched from the CMS API.
 * Works in both dev server and preview server.
 */
function metaInjectorPlugin() {
  const CMS_API_BASE = process.env.VITE_APP_API_BASE_URL || "https://devapi-shubhtalk.epicon.in";

  const BOT_USER_AGENTS = [
    "facebookexternalhit", "Facebot", "Twitterbot", "WhatsApp",
    "LinkedInBot", "Slackbot", "TelegramBot", "Discordbot",
    "Googlebot", "bingbot", "Applebot", "PinterestBot", "redditbot",
    "Embedly", "Quora Link Preview", "vkShare", "Iframely",
  ];

  const SKIP_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|mp3|mp4|json|xml|txt|map)$/i;
  const SKIP_PREFIX = ["/main", "/vedic", "/chart", "/voice", "/sgw", "/assets", "/__"];

  function isBot(ua) {
    if (!ua) return false;
    const lower = ua.toLowerCase();
    return BOT_USER_AGENTS.some((b) => lower.includes(b.toLowerCase()));
  }

  async function fetchCmsMeta(slug) {
    try {
      const url = `${CMS_API_BASE}/api/static-pages?slug=${encodeURIComponent(slug)}`;
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch {
      return null;
    }
  }

  function escapeAttr(str) {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function replaceMeta(html, { title, description, keywords, image, url }) {
    const siteImage = "https://www.shubhastro.ai/images/shubhastro-logo-banner.jpeg";
    const ogImage = image || siteImage;

    if (title) {
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
      html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,`$1${escapeAttr(title)}$2`);
      html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/,`$1${escapeAttr(title)}$2`);
    }
    if (description) {
      html = html.replace(/(<meta name="description" content=")[^"]*(")/,`$1${escapeAttr(description)}$2`);
      html = html.replace(/(<meta property="og:description" content=")[^"]*(")/,`$1${escapeAttr(description)}$2`);
      html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,`$1${escapeAttr(description)}$2`);
    }
    if (keywords) {
      html = html.replace(/(<meta name="keywords" content=")[^"]*(")/,`$1${escapeAttr(keywords)}$2`);
    }
    if (ogImage) {
      html = html.replace(/(<meta property="og:image" content=")[^"]*(")/,`$1${escapeAttr(ogImage)}$2`);
      html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/,`$1${escapeAttr(ogImage)}$2`);
    }
    if (url) {
      html = html.replace(/(<meta property="og:url" content=")[^"]*(")/,`$1${escapeAttr(url)}$2`);
      html = html.replace(/(<link rel="canonical" href=")[^"]*(")/,`$1${escapeAttr(url)}$2`);
    }
    return html;
  }

  async function handleBot(req, res, htmlPath, reqUrl) {
    let html;
    try {
      html = fs.readFileSync(htmlPath, "utf-8");
    } catch {
      return false;
    }

    const pathname = reqUrl.split("?")[0];
    const slug = pathname.replace(/^\//, "").replace(/\/$/, "") || "";
    const fullUrl = `https://www.shubhastro.ai${pathname}`;

    const pageData = slug ? await fetchCmsMeta(slug) : null;

    if (pageData) {
      const title = pageData.meta_title || pageData.title || "";
      const description = pageData.meta_description || pageData.title || "";
      const keywords = pageData.meta_tags
        ? Array.isArray(pageData.meta_tags) ? pageData.meta_tags.join(", ") : pageData.meta_tags
        : "";
      html = replaceMeta(html, { title, description, keywords, url: fullUrl });
    } else {
      html = replaceMeta(html, { url: fullUrl });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.end(html);
    return true;
  }

  return {
    name: "meta-injector",

    // Dev server middleware
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = req.url || "";
        if (SKIP_PREFIX.some((p) => url.startsWith(p))) return next();
        if (SKIP_EXT.test(url)) return next();
        if (!isBot(req.headers["user-agent"])) return next();

        console.log(`[meta-injector] Bot: "${(req.headers["user-agent"] || "").slice(0, 60)}" → ${url}`);
        const htmlPath = path.resolve("index.html");
        const handled = await handleBot(req, res, htmlPath, url);
        if (!handled) next();
      });
    },

    // Preview server middleware
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = req.url || "";
        if (SKIP_PREFIX.some((p) => url.startsWith(p))) return next();
        if (SKIP_EXT.test(url)) return next();
        if (!isBot(req.headers["user-agent"])) return next();

        console.log(`[meta-injector] Bot: "${(req.headers["user-agent"] || "").slice(0, 60)}" → ${url}`);
        const htmlPath = path.resolve("dist/index.html");
        const handled = await handleBot(req, res, htmlPath, url);
        if (!handled) next();
      });
    },
  };
}

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
  plugins: [metaInjectorPlugin(), react(), webhookLoggerPlugin(), firebaseSwPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden',
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