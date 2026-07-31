/**
 * In-memory session-key store.
 *
 * Maps a session id -> { key: Buffer, createdAt: number }. Sessions expire
 * after SESSION_TTL_MS and are swept periodically.
 *
 * SCALING NOTE: this is per-process. If you run more than one secure gateway instance
 * behind a load balancer, move this to a shared store (e.g. Redis) or enable
 * sticky sessions, otherwise a request can land on an instance that doesn't
 * hold the session key and decryption on the client will fail.
 */

import { SESSION_TTL_MS } from "./config.js";

const sessions = new Map();

export function putSession(sid, key) {
  sessions.set(sid, { key, createdAt: Date.now() });
}

export function getSessionKey(sid) {
  const entry = sessions.get(sid);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > SESSION_TTL_MS) {
    sessions.delete(sid);
    return null;
  }
  return entry.key;
}

export function deleteSession(sid) {
  sessions.delete(sid);
}

// Periodic sweep of expired sessions.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [sid, entry] of sessions) {
    if (now - entry.createdAt > SESSION_TTL_MS) sessions.delete(sid);
  }
}, Math.min(SESSION_TTL_MS, 60_000));

// Don't keep the event loop alive solely for the sweep timer.
if (typeof sweep.unref === "function") sweep.unref();
