/**
 * Proxy layer.
 *
 * For each configured route we mount an http-proxy-middleware instance that
 * forwards the request to the real upstream. For routes flagged `encrypt`, we
 * intercept the upstream response and, when it is JSON and the request carries
 * a valid session id, replace the body with an AES-GCM envelope.
 *
 * Everything else (binary payloads, non-JSON, WebSocket upgrades, requests
 * without a session key) passes through untouched so the app keeps working.
 */

import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import { ROUTES } from "./config.js";
import { encryptJson } from "./crypto.js";
import { getSessionKey } from "./sessions.js";
import { applyCorsHeaders } from "./cors.js";

const SID_HEADER = "x-sgw-sid";

function isJsonResponse(proxyRes) {
  const ct = String(proxyRes.headers["content-type"] || "").toLowerCase();
  return ct.includes("application/json") || ct.includes("+json");
}

/**
 * Fail-closed guard for encrypted routes.
 *
 * Mounted BEFORE the proxy so a request without a valid session is rejected
 * with 428 *before* it reaches the upstream — this prevents a header-stripped
 * request (e.g. "copy as cURL" minus x-sgw-sid) from getting plaintext, and
 * avoids double-executing mutations on retry.
 *
 * Not applied to passthrough routes (e.g. /voice binary) or WebSocket upgrades
 * (socket.io handshakes over the `upgrade` event, never through here).
 *
 * The client (secureBaseQuery / secureAxios) re-handshakes and replays once on
 * 428, so legitimate traffic recovers transparently after key expiry.
 */
function requireSession(req, res, next) {
  const sid = req.headers[SID_HEADER];
  const key = sid ? getSessionKey(String(sid)) : null;
  if (!key) {
    applyCorsHeaders(req, res);
    res.setHeader("x-sgw-enc", "0");
    return res.status(428).json({
      error: "secure session required",
      code: "SGW_SESSION_REQUIRED",
    });
  }
  next();
}

function buildEncryptingProxy(route) {
  return createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    ws: !!route.ws,
    xfwd: true,
    // Strip the route prefix so /main/api/x -> <target>/api/x
    pathRewrite: { [`^${route.prefix}`]: "" },
    // Required so responseInterceptor can rewrite the body.
    selfHandleResponse: true,
    on: {
      // Encrypted envelopes are keyed to the CURRENT ECDH session. If the
      // browser is allowed to cache/revalidate them, a later page load with a
      // fresh session key will be served a stale envelope it can no longer
      // decrypt (surfaces as a broken page + generic error toast). Strip the
      // conditional-request headers so the upstream always returns a full 200
      // body we can encrypt for this session, never a bodiless 304.
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader("if-none-match");
        proxyReq.removeHeader("if-modified-since");
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        // Ensure CORS headers are present on the (rewritten) cross-origin response.
        applyCorsHeaders(req, res);

        // Only touch JSON. Binary/file/streaming responses pass straight through.
        if (!isJsonResponse(proxyRes)) {
          return responseBuffer;
        }

        const sid = req.headers[SID_HEADER];
        const key = sid ? getSessionKey(String(sid)) : null;

        // The requireSession guard already rejected sessionless requests with
        // 428, so a missing key here is only a rare TTL race (key expired
        // between the guard check and this response). Fail open on that narrow
        // window rather than corrupting an already-executed response.
        if (!key) {
          return responseBuffer;
        }

        try {
          const plaintext = responseBuffer.toString("utf8");
          const envelope = encryptJson(plaintext, key);
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.setHeader("x-sgw-enc", "1");
          // Never let the browser cache or revalidate a session-scoped envelope:
          // a cached ciphertext cannot be decrypted by a later session's key.
          res.setHeader("cache-control", "no-store, no-cache, must-revalidate");
          res.removeHeader("etag");
          res.removeHeader("last-modified");
          res.removeHeader("expires");
          return JSON.stringify(envelope);
        } catch (err) {
          // If anything goes wrong, fail open with the original body rather
          // than breaking the response.
          return responseBuffer;
        }
      }),
      error: (err, req, res) => {
        if (res && !res.headersSent && typeof res.status === "function") {
          res.status(502).json({ error: "bad gateway", detail: String(err?.code || err?.message || err) });
        } else if (res && !res.writableEnded) {
          try { res.end(); } catch { /* ignore */ }
        }
      },
    },
  });
}

function buildPassthroughProxy(route) {
  return createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    ws: !!route.ws,
    xfwd: true,
    pathRewrite: { [`^${route.prefix}`]: "" },
    on: {
      // Attach CORS headers to the upstream response (set before the body is
      // piped, so they survive the upstream header copy).
      proxyRes: (proxyRes, req, res) => {
        applyCorsHeaders(req, res);
      },
    },
  });
}

/**
 * Mounts all configured routes onto the given Express app.
 * Returns the list of mounted middlewares so the server can wire WS upgrades.
 */
export function mountProxies(app) {
  const mounted = [];
  for (const route of ROUTES) {
    const mw = route.encrypt ? buildEncryptingProxy(route) : buildPassthroughProxy(route);
    if (route.encrypt) {
      // Fail-closed: reject sessionless HTTP requests before they reach upstream.
      app.use(route.prefix, requireSession, mw);
    } else {
      app.use(route.prefix, mw);
    }
    mounted.push({ route, mw });
  }
  return mounted;
}
