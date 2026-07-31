/**
 * CORS handling for the secure gateway.
 *
 * The frontend now calls the secure gateway DIRECTLY (cross-origin) instead of going
 * through a same-origin vite/nginx proxy, so the secure gateway must answer CORS preflight
 * requests and attach the appropriate headers to every response (including the
 * proxied upstream responses).
 *
 * Origin policy:
 *   - If SGW_ALLOWED_ORIGINS is set (comma-separated list), only those origins
 *     are allowed and the matching origin is reflected back.
 *   - If it is empty, the incoming Origin is reflected (allow-any). This is
 *     convenient for dev; lock it down in production via the env var.
 *
 * No credentials (cookies) are used — auth travels as Bearer tokens / API keys
 * in headers — so Access-Control-Allow-Credentials is intentionally not set and
 * reflecting the origin (rather than "*") keeps things simple and correct.
 */

import { ALLOWED_ORIGINS } from "./config.js";

// Headers the frontend may send on API/handshake requests.
const ALLOW_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-sgw-sid",
  "api-subscription-key",
  "Accept-Language",
  "accept",
].join(", ");

const ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

/** Resolve the Access-Control-Allow-Origin value for this request, or null. */
function resolveOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  if (!ALLOWED_ORIGINS.length) return origin; // reflect any
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

/**
 * Attach CORS headers to a response. Safe to call multiple times and from
 * inside proxy `proxyRes` handlers so the headers survive upstream copying.
 */
export function applyCorsHeaders(req, res) {
  const origin = resolveOrigin(req);
  if (!origin) return;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Expose-Headers", "x-sgw-enc");
}

/**
 * Express middleware: sets CORS headers and short-circuits OPTIONS preflight
 * before the request can reach the handshake router or the proxies.
 */
export function corsMiddleware(req, res, next) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS);
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] || ALLOW_HEADERS
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    res.statusCode = 204;
    return res.end();
  }

  next();
}
