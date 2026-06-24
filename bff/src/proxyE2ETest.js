/**
 * End-to-end proxy test (no external network).
 *
 * 1. Starts a mock upstream that returns JSON on /api/thing and binary on /api/blob.
 * 2. Boots the BFF proxy pointed at the mock (via BFF_MAIN_TARGET).
 * 3. Handshakes, then requests through the BFF with the session header and
 *    verifies the JSON response is an encrypted envelope that decrypts back to
 *    the original. Also verifies: no-session => plaintext, binary => untouched.
 *
 * Run: node src/proxyE2ETest.js  (from bff/)
 */

import http from "node:http";
import assert from "node:assert";
import express from "express";

// Point the /main route at our mock BEFORE importing modules that read config.
const MOCK_PORT = 9911;
process.env.BFF_MAIN_TARGET = `http://127.0.0.1:${MOCK_PORT}`;
process.env.BFF_PORT = "8799";

const { handshakeRouter } = await import("./handshake.js");
const { mountProxies } = await import("./proxy.js");

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
const HKDF_INFO = "shubhtalk-bff-aesgcm-v1";

const JSON_PAYLOAD = { status: true, data: { secret: "do-not-leak", nums: [1, 2, 3] } };
const BLOB = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);

function startMock() {
  const app = express();
  app.get("/api/thing", (req, res) => res.json(JSON_PAYLOAD));
  app.get("/api/blob", (req, res) => {
    res.setHeader("content-type", "application/octet-stream");
    res.end(BLOB);
  });
  return new Promise((resolve) => {
    const s = app.listen(MOCK_PORT, "127.0.0.1", () => resolve(s));
  });
}

function startBff() {
  const app = express();
  app.use(handshakeRouter);
  mountProxies(app);
  return new Promise((resolve) => {
    const s = http.createServer(app).listen(8799, "127.0.0.1", () => resolve(s));
  });
}

async function clientHandshake() {
  const keyPair = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const rawPub = await subtle.exportKey("raw", keyPair.publicKey);
  const clientPublicKey = Buffer.from(rawPub).toString("base64");

  const r = await fetch("http://127.0.0.1:8799/__bff/handshake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientPublicKey }),
  });
  const { sid, serverPublicKey } = await r.json();

  const serverKey = await subtle.importKey(
    "raw", Buffer.from(serverPublicKey, "base64"),
    { name: "ECDH", namedCurve: "P-256" }, false, []
  );
  const sharedBits = await subtle.deriveBits({ name: "ECDH", public: serverKey }, keyPair.privateKey, 256);
  const hkdfBase = await subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  const aesKey = await subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(sid), info: enc.encode(HKDF_INFO) },
    hkdfBase, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  return { sid, aesKey };
}

async function decrypt(envelope, aesKey) {
  const plain = await subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(envelope.iv, "base64") },
    aesKey,
    Buffer.from(envelope.data, "base64")
  );
  return JSON.parse(dec.decode(plain));
}

async function run() {
  const mock = await startMock();
  const bff = await startBff();
  try {
    const { sid, aesKey } = await clientHandshake();

    // 1. JSON through BFF WITH session header -> encrypted envelope
    const encRes = await fetch("http://127.0.0.1:8799/main/api/thing", {
      headers: { "x-bff-sid": sid },
    });
    assert.strictEqual(encRes.headers.get("x-bff-enc"), "1", "should be flagged encrypted");
    const envelope = await encRes.json();
    assert.strictEqual(envelope.enc, 1, "response must be an envelope");
    assert.ok(!JSON.stringify(envelope).includes("do-not-leak"), "plaintext must not appear in body");
    const decrypted = await decrypt(envelope, aesKey);
    assert.deepStrictEqual(decrypted, JSON_PAYLOAD, "decrypted == original");
    console.log("[e2e] JSON encrypted + decrypted correctly, plaintext absent from wire");

    // 2. JSON through BFF WITHOUT session header -> plaintext passthrough (safety net)
    const plainRes = await fetch("http://127.0.0.1:8799/main/api/thing");
    assert.notStrictEqual(plainRes.headers.get("x-bff-enc"), "1");
    const plainBody = await plainRes.json();
    assert.deepStrictEqual(plainBody, JSON_PAYLOAD, "no-session => plaintext passthrough");
    console.log("[e2e] no-session request passes through as plaintext (bootstrap safety net)");

    // 3. Binary through BFF -> untouched
    const blobRes = await fetch("http://127.0.0.1:8799/main/api/blob", {
      headers: { "x-bff-sid": sid },
    });
    const blobBuf = Buffer.from(await blobRes.arrayBuffer());
    assert.ok(blobBuf.equals(BLOB), "binary must pass through byte-for-byte");
    console.log("[e2e] binary response passed through untouched");

    console.log("[e2e] OK — all proxy encryption assertions passed");
  } finally {
    bff.close();
    mock.close();
  }
}

run().catch((err) => {
  console.error("[e2e] FAILED:", err);
  process.exit(1);
});
