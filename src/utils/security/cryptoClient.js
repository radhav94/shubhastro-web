/**
 * Frontend crypto client for the encrypting BFF.
 *
 * Performs an ephemeral ECDH (P-256) handshake with the BFF, derives a shared
 * AES-256-GCM session key via HKDF-SHA256, and decrypts the response envelopes
 * the BFF produces: { enc: 1, iv: base64, data: base64(ciphertext||tag) }.
 *
 * This must stay in sync with bff/src/crypto.js (curve, HKDF hash/salt/info,
 * GCM layout). The HKDF salt is the session id and the info string is fixed.
 *
 * REALITY CHECK: this is obfuscation to keep readable JSON out of the Network
 * tab, not a security boundary. The key is derived in the browser, so a
 * determined user can reproduce this handshake and read the plaintext. Treat it
 * accordingly — never rely on it to protect data the user must not see.
 */

// Must match bff/src/config.js HKDF_INFO exactly.
const HKDF_INFO = "shubhtalk-bff-aesgcm-v1";
const HANDSHAKE_URL = "/__bff/handshake";

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

async function performHandshake() {
  if (!subtle) throw new Error("Web Crypto unavailable (requires HTTPS/localhost)");

  // 1. Ephemeral ECDH key pair.
  const keyPair = await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  // 2. Export our public key in raw (uncompressed) form: 0x04 || X || Y.
  const rawPub = await subtle.exportKey("raw", keyPair.publicKey);
  const clientPublicKey = bytesToB64(rawPub);

  // 3. Exchange public keys with the BFF.
  const res = await fetch(HANDSHAKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientPublicKey }),
  });
  if (!res.ok) throw new Error(`handshake failed: ${res.status}`);
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

/** True if the value looks like a BFF-encrypted envelope. */
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
 * Decrypt a BFF envelope into the original parsed JSON value.
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
