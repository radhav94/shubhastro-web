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

const SID_HEADER = "x-bff-sid";

function isJsonResponse(proxyRes) {
  const ct = String(proxyRes.headers["content-type"] || "").toLowerCase();
  return ct.includes("application/json") || ct.includes("+json");
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
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        // Only touch JSON. Binary/file/streaming responses pass straight through.
        if (!isJsonResponse(proxyRes)) {
          return responseBuffer;
        }

        const sid = req.headers[SID_HEADER];
        const key = sid ? getSessionKey(String(sid)) : null;

        // No valid session key -> return plaintext so nothing breaks. The app
        // always handshakes first, so legitimate traffic is encrypted; this is
        // only a safety net during bootstrap / expiry.
        if (!key) {
          return responseBuffer;
        }

        try {
          const plaintext = responseBuffer.toString("utf8");
          const envelope = encryptJson(plaintext, key);
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.setHeader("x-bff-enc", "1");
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
    app.use(route.prefix, mw);
    mounted.push({ route, mw });
  }
  return mounted;
}
