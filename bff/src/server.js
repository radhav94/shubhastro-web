/**
 * BFF entry point.
 *
 * Order matters:
 *   1. /__bff/health  — liveness probe.
 *   2. /__bff/handshake — JSON-parsed ECDH key exchange.
 *   3. proxy routes — mounted WITHOUT a global body parser so request bodies
 *      stream straight to the upstream (a global parser would break POSTs).
 *
 * WebSocket upgrades (socket.io on /main) are handled by attaching the proxy's
 * `upgrade` handler to the HTTP server.
 */

import http from "node:http";
import express from "express";
import { PORT, HOST, ROUTES } from "./config.js";
import { handshakeRouter } from "./handshake.js";
import { mountProxies } from "./proxy.js";

const app = express();
app.disable("x-powered-by");

app.get("/__bff/health", (req, res) => {
  res.json({ ok: true, routes: ROUTES.map((r) => ({ prefix: r.prefix, encrypt: r.encrypt, ws: !!r.ws })) });
});

// Handshake first (parses its own JSON body).
app.use(handshakeRouter);

// Then the streaming proxies.
const mounted = mountProxies(app);

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
  console.log(`[bff] listening on http://${HOST}:${PORT}`);
  for (const r of ROUTES) {
    // eslint-disable-next-line no-console
    console.log(`[bff]   ${r.prefix}  ->  ${r.target}  (encrypt=${r.encrypt}, ws=${!!r.ws})`);
  }
});
