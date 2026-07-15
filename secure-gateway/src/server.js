/**
 * secure gateway entry point.
 *
 * Order matters:
 *   1. /__sgw/health  — liveness probe.
 *   2. /__sgw/handshake — JSON-parsed ECDH key exchange.
 *   3. proxy routes — mounted WITHOUT a global body parser so request bodies
 *      stream straight to the upstream (a global parser would break POSTs).
 *
 * WebSocket upgrades (socket.io on /main) are handled by attaching the proxy's
 * `upgrade` handler to the HTTP server.
 */

import http from "node:http";
import path from "node:path";
import express from "express";
import { PORT, HOST, ROUTES, DIST_PATH } from "./config.js";
import { handshakeRouter } from "./handshake.js";
import { mountProxies } from "./proxy.js";
import { corsMiddleware } from "./cors.js";
import { metaInjectorMiddleware } from "./metaInjector.js";

const app = express();
app.disable("x-powered-by");

// CORS first — the frontend calls the secure gateway cross-origin, so preflight (OPTIONS)
// must be answered before reaching the handshake router or the proxies.
app.use(corsMiddleware);

app.get("/__sgw/health", (req, res) => {
  res.json({ ok: true, routes: ROUTES.map((r) => ({ prefix: r.prefix, encrypt: r.encrypt, ws: !!r.ws })) });
});

// Handshake first (parses its own JSON body).
app.use(handshakeRouter);

// Meta tag injection for bot crawlers (before proxies and static serving).
app.use(metaInjectorMiddleware);

// Then the streaming proxies.
const mounted = mountProxies(app);

// Static file serving + SPA fallback (after API proxies).
// Serves the built frontend from dist/ and falls back to index.html for SPA routes.
const distAbsolute = path.resolve(DIST_PATH);
app.use(express.static(distAbsolute));
app.get("*", (req, res) => {
  res.sendFile(path.join(distAbsolute, "index.html"));
});

const server = http.createServer(app);

// Wire WebSocket upgrades to the proxy that owns each ws-enabled prefix.
server.on("upgrade", (req, socket, head) => {
  const entry = mounted.find(
    (m) => m.route.ws && req.url && req.url.startsWith(m.route.prefix)
  );
  if (entry && typeof entry.mw.upgrade === "function") {
    entry.mw.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[sgw] listening on http://${HOST}:${PORT}`);
  for (const r of ROUTES) {
    // eslint-disable-next-line no-console
    console.log(`[sgw]   ${r.prefix}  ->  ${r.target}  (encrypt=${r.encrypt}, ws=${!!r.ws})`);
  }
});
