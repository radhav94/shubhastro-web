/**
 * API Configuration - Centralized secure gateway endpoints.
 *
 * All API traffic goes to the encrypting secure gateway (see /secure-gateway).
 * The gateway routes by path prefix (/main, /vedic, /chart, /voice), strips the
 * prefix, and forwards to the real upstream — encrypting JSON responses on the
 * way back.
 *
 * VITE_SGW_URL tells the frontend where the gateway lives. It supports three
 * deployment styles, and everything below adapts automatically:
 *
 *   1. Same-origin path (recommended prod):  "/sgw"
 *      -> served at https://<your-site>/sgw via nginx. No CORS, one cert.
 *   2. Absolute origin (dev / subdomain):    "http://127.0.0.1:8787"
 *                                            "https://gateway.shubhastro.ai"
 *   3. Empty:                                 falls back to relative "/" (no
 *      gateway base) — same-origin against whatever serves the SPA.
 *
 * NOTE: socket.io treats a URL's path as a namespace, so it must be configured
 * with the origin + a `path` that includes the gateway base path. We split
 * VITE_SGW_URL into origin and base path below to get this right.
 */

// Raw gateway base, trailing slash trimmed. May be an absolute URL, a path, or "".
const SGW_BASE = String(import.meta.env.VITE_SGW_URL || "").replace(/\/+$/, "");

// Split the base into { origin, basePath } so HTTP calls and socket.io can each
// be configured correctly regardless of deployment style.
const { origin: SGW_SOCKET_ORIGIN, basePath: SGW_BASE_PATH } = (() => {
  if (!SGW_BASE) return { origin: "", basePath: "" };
  try {
    // Absolute URL, e.g. https://gateway.host/sgw or http://127.0.0.1:8787
    const u = new URL(SGW_BASE);
    return { origin: u.origin, basePath: u.pathname.replace(/\/+$/, "") };
  } catch {
    // Relative path, e.g. "/sgw" -> same-origin with a base path.
    return { origin: "", basePath: SGW_BASE.startsWith("/") ? SGW_BASE : `/${SGW_BASE}` };
  }
})();

// HTTP base for REST/axios/RTK calls (origin + base path, or relative path, or "").
export const SGW_ORIGIN = SGW_BASE;

// Main backend API (Node.js)
export const BACKEND_PROXY = `${SGW_BASE}/main`;
// Python backend API
export const PYTHON_PROXY = `${SGW_BASE}/chart`;
// Third-party Astrology API (json.astrologyapi.com)
export const ASTROLOGY_PROXY = `${SGW_BASE}/vedic`;
// Sarvam TTS API
export const SARVAM_PROXY = `${SGW_BASE}/voice`;

// ECDH key-exchange endpoint on the secure gateway.
export const SGW_HANDSHAKE_URL = `${SGW_BASE}/__sgw/handshake`;

// socket.io: connect to the gateway origin (empty -> same origin "/") and route
// via `path`, which must include the gateway base path so it survives nginx's
// /sgw location. Subdomain/dev: basePath is "" -> "/main/socket.io".
export const SOCKET_URL = SGW_SOCKET_ORIGIN || "/";
export const SOCKET_PATH = `${SGW_BASE_PATH}/main/socket.io`;

// Helper to get backend API base URL (replaces import.meta.env.VITE_APP_API_BASE_URL)
export const getBackendUrl = () => BACKEND_PROXY;
