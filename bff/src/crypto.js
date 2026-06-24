/**
 * BFF crypto helpers.
 *
 * Key agreement: ephemeral ECDH on the P-256 (prime256v1) curve. This avoids
 * shipping a static key inside the browser bundle — each session derives its
 * own AES-256-GCM key from an ECDH handshake.
 *
 * Response confidentiality: AES-256-GCM. The 16-byte auth tag is appended to
 * the ciphertext (matching the Web Crypto API's expectation on the client),
 * and the random 12-byte IV is sent alongside in the envelope.
 *
 * IMPORTANT (honesty): this is obfuscation against casual Network-tab scraping,
 * not a security boundary. The client must derive the same key to decrypt, so a
 * determined user can reproduce the handshake and read the plaintext. Real
 * protection comes from the backend returning less data per role.
 */

import crypto from "node:crypto";
import { HKDF_INFO } from "./config.js";

const CURVE = "prime256v1"; // === P-256 on the Web Crypto side
const HKDF_HASH = "sha256";
const AES_KEY_LEN = 32; // 256-bit
const GCM_IV_LEN = 12;

/**
 * Create an ephemeral ECDH key pair for one handshake.
 * Returns the Node ECDH instance and the uncompressed public key (0x04||X||Y),
 * which is the same byte layout Web Crypto produces with `exportKey("raw")`.
 */
export function createEcdh() {
  const ecdh = crypto.createECDH(CURVE);
  ecdh.generateKeys();
  return { ecdh, publicKey: ecdh.getPublicKey() };
}

/**
 * Derive the shared AES-256 key from our ECDH private material and the client's
 * raw (uncompressed) public key, salted with the session id so two sessions
 * never derive the same key from the same ECDH output.
 */
export function deriveSessionKey(ecdh, clientPublicKeyRaw, sid) {
  const sharedSecret = ecdh.computeSecret(clientPublicKeyRaw); // 32-byte X coord
  const salt = Buffer.from(sid, "utf8");
  const info = Buffer.from(HKDF_INFO, "utf8");
  const derived = crypto.hkdfSync(HKDF_HASH, sharedSecret, salt, info, AES_KEY_LEN);
  return Buffer.from(derived); // hkdfSync returns an ArrayBuffer
}

/**
 * Encrypt a UTF-8 string (typically a JSON body) with AES-256-GCM.
 * Returns the transport envelope the frontend knows how to decrypt.
 */
export function encryptJson(plaintextString, key) {
  const iv = crypto.randomBytes(GCM_IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintextString, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Append the tag so the client (Web Crypto AES-GCM) can verify+decrypt in one call.
  const payload = Buffer.concat([ciphertext, tag]);
  return {
    enc: 1,
    iv: iv.toString("base64"),
    data: payload.toString("base64"),
  };
}

export function newSessionId() {
  return crypto.randomUUID();
}
