/**
 * secure gateway configuration.
 *
 * Each route maps an incoming path prefix (the same prefixes the frontend
 * already uses: /main, /vedic, /chart, /voice) to an upstream target.
 *
 *  - `encrypt`: when true, JSON responses from this upstream are encrypted
 *    with the per-session AES-GCM key before being returned to the browser.
 *  - `ws`: when true, WebSocket upgrades are proxied transparently (socket.io).
 *    NOTE: WebSocket frames are NOT encrypted (see README / limitations).
 *
 * Targets fall back to the same hosts used by vite.config.js / nginx-proxy.conf
 * and can be overridden via environment variables for staging/production.
 */

const env = process.env;

export const PORT = Number(env.SGW_PORT || 8787);

// Bind address. Keep on localhost when nginx/vite sit in front of the secure gateway.
export const HOST = env.SGW_HOST || "127.0.0.1";

// Session key time-to-live (ms). After this the client must re-handshake.
export const SESSION_TTL_MS = Number(env.SGW_SESSION_TTL_MS || 1000 * 60 * 60); // 1h

// HKDF info string — must match the frontend crypto client exactly.
export const HKDF_INFO = "shubhtalk-sgw-aesgcm-v1";

// Allowed CORS origins (comma-separated). Empty => reflect any origin (dev).
// Example prod value: "https://shubhastro.ai,https://www.shubhastro.ai"
export const ALLOWED_ORIGINS = String(env.SGW_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

/*
 * Server-rendered meta for astrologer profile pages (see astrologerSeo.js).
 *
 * Off unless SGW_SPA_INDEX points at the built index.html — the gateway cannot
 * serve HTML it cannot read, and an unset path must not turn into a broken route.
 * In production that is the same dist root nginx serves from, e.g.
 *   SGW_SPA_INDEX=/var/www/shubhtalk-web-v2/dist/index.html
 */
export const SPA_INDEX_PATH = env.SGW_SPA_INDEX || "";

// Origin used to build og:url / canonical for those pages. The request's own Host
// is not trusted for this: behind nginx it can be an internal name, and a
// canonical pointing at an internal host is worse than one pointing at the
// default.
export const SEO_SITE_ORIGIN = String(env.SGW_SITE_ORIGIN || "https://www.shubhastro.ai").replace(/\/+$/, "");

// How long a fetched astrologer's meta is reused (ms). Admin edits appear after
// this; the upstream call is slow and uncached, so it must not run per request.
export const SEO_CACHE_TTL_MS = Number(env.SGW_SEO_TTL_MS || 5 * 60 * 1000);

export const ROUTES = [
  {
    prefix: "/main",
    target: env.SGW_MAIN_TARGET || "https://devapi-shubhtalk.epicon.in",
    encrypt: true,
    ws: true, // socket.io passes through here (not encrypted)
  },
  {
    prefix: "/vedic",
    target: env.SGW_VEDIC_TARGET || "https://json.astrologyapi.com",
    encrypt: true,
    ws: false,
  },
  {
    prefix: "/chart",
    target: env.SGW_CHART_TARGET || "https://pyapi-shubhtalk.epicon.in",
    encrypt: true,
    ws: false,
  },
  {
    prefix: "/voice",
    target: env.SGW_VOICE_TARGET || "https://api.sarvam.ai",
    // Sarvam returns binary audio (TTS/STT) — leave it untouched so streaming
    // and binary payloads are not corrupted. Only application/json is ever
    // encrypted anyway, but disabling here avoids any overhead.
    encrypt: false,
    ws: false,
  },
];
