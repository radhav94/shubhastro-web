/**
 * Frontend crypto client for the encrypting secure gateway.
 *
 * Performs an ephemeral ECDH (P-256) handshake with the gateway, derives a
 * shared AES-256-GCM session key via HKDF-SHA256, and decrypts the response
 * envelopes the gateway produces: { enc: 1, iv: base64, data: base64(ciphertext||tag) }.
 *
 * This must stay in sync with secure-gateway/src/crypto.js (curve, HKDF
 * hash/salt/info, GCM layout). The HKDF salt is the session id and the info
 * string is fixed.
 *
 * REALITY CHECK: this is obfuscation to keep readable JSON out of the Network
 * tab, not a security boundary. The key is derived in the browser, so a
 * determined user can reproduce this handshake and read the plaintext. Treat it
 * accordingly — never rely on it to protect data the user must not see.
 */

// Must match secure-gateway/src/config.js HKDF_INFO exactly.
import { SGW_HANDSHAKE_URL } from "../apiConfig";

const HKDF_INFO = "shubhtalk-sgw-aesgcm-v1";
const HANDSHAKE_URL = SGW_HANDSHAKE_URL;

const subtle = globalThis.crypto?.subtle;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let sessionState = null; // { sid, key: CryptoKey, expiresAt: number }
let inFlight = null; // Promise dedupe for concurrent ensureSession() calls

/* ----------------------------- base64 helpers ----------------------------- */

function bytesToB64(bytes) {
  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function b64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------- handshake -------------------------------- */

// Bounded retry so a transient blip (gateway restart, momentary network error,
// 5xx) doesn't surface as a failed load. Permanent failures (no Web Crypto, or
// a 4xx from the gateway) are NOT retried — they won't fix themselves.
const HANDSHAKE_MAX_ATTEMPTS = 3;
const HANDSHAKE_BACKOFF_MS = [200, 600, 1500]; // delay applied before each retry

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handshakeOnce() {
  // 1. Ephemeral ECDH key pair.
  const keyPair = await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  // 2. Export our public key in raw (uncompressed) form: 0x04 || X || Y.
  const rawPub = await subtle.exportKey("raw", keyPair.publicKey);
  const clientPublicKey = bytesToB64(rawPub);

  // 3. Exchange public keys with the secure gateway.
  const res = await fetch(HANDSHAKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientPublicKey }),
  });
  if (!res.ok) {
    const err = new Error(`handshake failed: ${res.status}`);
    // 4xx is a client/contract problem — retrying won't help. 5xx/transient may.
    if (res.status >= 400 && res.status < 500) err.permanent = true;
    throw err;
  }
  const { sid, serverPublicKey, ttlMs } = await res.json();

  // 4. Import the server's public key and derive the shared secret.
  const serverKey = await subtle.importKey(
    "raw",
    b64ToBytes(serverPublicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedBits = await subtle.deriveBits(
    { name: "ECDH", public: serverKey },
    keyPair.privateKey,
    256
  );

  // 5. HKDF-SHA256(sharedSecret, salt=sid, info=HKDF_INFO) -> AES-256-GCM key.
  const hkdfBase = await subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  const aesKey = await subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: textEncoder.encode(sid),
      info: textEncoder.encode(HKDF_INFO),
    },
    hkdfBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Refresh a little before the server expires the key to avoid a race.
  const safety = Math.min(60_000, Math.floor((ttlMs || 0) * 0.1));
  sessionState = {
    sid,
    key: aesKey,
    expiresAt: Date.now() + (ttlMs || 0) - safety,
  };
  return sessionState;
}

async function performHandshake() {
  if (!subtle) throw new Error("Web Crypto unavailable (requires HTTPS/localhost)");

  let lastErr;
  for (let attempt = 0; attempt < HANDSHAKE_MAX_ATTEMPTS; attempt++) {
    try {
      return await handshakeOnce();
    } catch (err) {
      lastErr = err;
      if (err?.permanent) break; // don't retry failures that can't recover
      if (attempt < HANDSHAKE_MAX_ATTEMPTS - 1) {
        await sleep(HANDSHAKE_BACKOFF_MS[Math.min(attempt, HANDSHAKE_BACKOFF_MS.length - 1)]);
      }
    }
  }
  throw lastErr;
}

/**
 * Ensure a valid session exists, performing (or reusing) a handshake.
 * Concurrent callers share a single in-flight handshake.
 */
export async function ensureSession() {
  if (sessionState && Date.now() < sessionState.expiresAt) return sessionState;
  if (inFlight) return inFlight;
  inFlight = performHandshake()
    .catch((err) => {
      sessionState = null;
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Current session id, or null if no handshake has completed yet. */
export function getSessionId() {
  return sessionState && Date.now() < sessionState.expiresAt ? sessionState.sid : null;
}

/**
 * Drop the current session so the next ensureSession() forces a fresh
 * handshake. Used to recover from a gateway 428 (session required/expired).
 */
export function resetSession() {
  sessionState = null;
}

/** True if the value looks like a secure gateway-encrypted envelope. */
export function isEncryptedEnvelope(value) {
  return (
    value &&
    typeof value === "object" &&
    value.enc === 1 &&
    typeof value.iv === "string" &&
    typeof value.data === "string"
  );
}

/**
 * Decrypt a secure gateway envelope into the original parsed JSON value.
 * Re-handshakes once if the current key fails to decrypt (e.g. key rotated).
 */
export async function decryptEnvelope(envelope) {
  if (!subtle) throw new Error("Web Crypto unavailable");
  const session = await ensureSession();
  const iv = b64ToBytes(envelope.iv);
  const data = b64ToBytes(envelope.data);

  const attempt = async (key) => {
    const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return JSON.parse(textDecoder.decode(plainBuf));
  };

  try {
    return await attempt(session.key);
  } catch (err) {
    // Key may have rotated/expired on the server — refresh once and retry.
    sessionState = null;
    const fresh = await ensureSession();
    return attempt(fresh.key);
  }
}
