/**
 * ECDH handshake endpoint.
 *
 * POST /__bff/handshake
 *   body: { clientPublicKey: base64(uncompressed P-256 point) }
 *   resp: { sid, serverPublicKey: base64(uncompressed P-256 point), ttlMs }
 *
 * The client and server each generate an ephemeral key pair, exchange public
 * keys, and independently derive the same AES-256-GCM session key via
 * ECDH + HKDF. The server stores the key under `sid`; the client keeps it in
 * memory only.
 */

import express from "express";
import { createEcdh, deriveSessionKey, newSessionId } from "./crypto.js";
import { putSession } from "./sessions.js";
import { SESSION_TTL_MS } from "./config.js";

export const handshakeRouter = express.Router();

handshakeRouter.post("/__bff/handshake", express.json({ limit: "8kb" }), (req, res) => {
  try {
    const clientPublicKeyB64 = req.body?.clientPublicKey;
    if (!clientPublicKeyB64 || typeof clientPublicKeyB64 !== "string") {
      return res.status(400).json({ error: "clientPublicKey required" });
    }

    const clientPublicKeyRaw = Buffer.from(clientPublicKeyB64, "base64");
    // Uncompressed P-256 public key is 65 bytes: 0x04 || X(32) || Y(32).
    if (clientPublicKeyRaw.length !== 65 || clientPublicKeyRaw[0] !== 0x04) {
      return res.status(400).json({ error: "invalid public key format" });
    }

    const sid = newSessionId();
    const { ecdh, publicKey } = createEcdh();
    const key = deriveSessionKey(ecdh, clientPublicKeyRaw, sid);
    putSession(sid, key);

    return res.json({
      sid,
      serverPublicKey: publicKey.toString("base64"),
      ttlMs: SESSION_TTL_MS,
    });
  } catch (err) {
    // Bad key material from the client lands here (computeSecret throws).
    return res.status(400).json({ error: "handshake failed" });
  }
});
