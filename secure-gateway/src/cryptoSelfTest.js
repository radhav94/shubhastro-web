/**
 * Round-trip self test.
 *
 * Emulates the browser client using Node's Web Crypto (globalThis.crypto.subtle)
 * and proves it can decrypt what the server side (node:crypto in crypto.js)
 * produces. This mirrors src/utils/security/cryptoClient.js step for step.
 *
 * Run: npm run selftest  (from the secure-gateway/ directory)
 */

import assert from "node:assert";
import { createEcdh, deriveSessionKey, encryptJson, newSessionId } from "./crypto.js";
import { HKDF_INFO } from "./config.js";

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

async function run() {
  // ---- client: ephemeral ECDH key pair (same as cryptoClient.js) ----
  const clientKeyPair = await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );
  const clientRawPub = Buffer.from(await subtle.exportKey("raw", clientKeyPair.publicKey));
  assert.strictEqual(clientRawPub.length, 65, "client raw pub must be 65 bytes");
  assert.strictEqual(clientRawPub[0], 0x04, "client raw pub must be uncompressed");

  // ---- server: handshake + key derivation (handshake.js / crypto.js) ----
  const sid = newSessionId();
  const { ecdh, publicKey: serverRawPub } = createEcdh();
  const serverKey = deriveSessionKey(ecdh, clientRawPub, sid);

  // ---- server: encrypt a representative JSON payload ----
  const original = {
    status: true,
    data: { id: 42, name: "Astrologer Test", phone: "+91-90000-00000", items: [1, 2, 3] },
    message: "Success!",
  };
  const envelope = encryptJson(JSON.stringify(original), serverKey);
  assert.strictEqual(envelope.enc, 1);
  assert.ok(typeof envelope.iv === "string" && typeof envelope.data === "string");

  // ---- client: derive the same key the browser would ----
  const serverKeyImported = await subtle.importKey(
    "raw",
    serverRawPub,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedBits = await subtle.deriveBits(
    { name: "ECDH", public: serverKeyImported },
    clientKeyPair.privateKey,
    256
  );
  const hkdfBase = await subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  const clientAesKey = await subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(sid), info: enc.encode(HKDF_INFO) },
    hkdfBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // ---- client: decrypt the envelope ----
  const ivBytes = Buffer.from(envelope.iv, "base64");
  const dataBytes = Buffer.from(envelope.data, "base64");
  const plainBuf = await subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    clientAesKey,
    dataBytes
  );
  const decrypted = JSON.parse(dec.decode(plainBuf));

  assert.deepStrictEqual(decrypted, original, "decrypted payload must equal original");

  // ---- negative: wrong session id must NOT decrypt ----
  let tampered = false;
  try {
    const wrongKey = deriveSessionKey(createEcdh().ecdh, clientRawPub, sid);
    const badEnvelope = encryptJson(JSON.stringify(original), wrongKey);
    // decrypt badEnvelope with clientAesKey (derived for serverKey) -> should throw
    await subtle.decrypt(
      { name: "AES-GCM", iv: Buffer.from(badEnvelope.iv, "base64") },
      clientAesKey,
      Buffer.from(badEnvelope.data, "base64")
    );
  } catch {
    tampered = true;
  }
  assert.ok(tampered, "mismatched key must fail to decrypt (GCM auth)");

  console.log("[selftest] OK — ECDH(P-256) + HKDF-SHA256 + AES-256-GCM round-trip verified");
  console.log("[selftest] sample envelope:", JSON.stringify(envelope).slice(0, 120) + "...");
}

run().catch((err) => {
  console.error("[selftest] FAILED:", err);
  process.exit(1);
});
