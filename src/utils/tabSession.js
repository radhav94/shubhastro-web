/**
 * Per-tab room ownership tracking.
 *
 * Problem this solves: the backend broadcasts session events like
 * `call:astrologer_accepted` / `chat:astrologer_accepted` to EVERY socket the
 * user has open (i.e. every browser tab). Without any notion of which tab
 * started the request, all tabs would start ringing — including tabs that have
 * no accept/reject UI.
 *
 * We track which room IDs were initiated by THIS tab and only let the initiating
 * tab react to the accept/ring events.
 *
 * Why sessionStorage:
 *   - It is scoped per tab/window (not shared across tabs, unlike localStorage).
 *   - It survives a page reload within the same tab, so ownership isn't lost if
 *     the user refreshes while a request is pending.
 */

const OWNED_ROOMS_KEY = "shubhtalk_owned_rooms"; // { [roomId]: timestamp }
const PENDING_INTENTS_KEY = "shubhtalk_pending_intents"; // [{ bucket, ts }]
const MAX_AGE = 30 * 60 * 1000; // 30 minutes

// Map any specific type to a coarse bucket used for correlation.
// A call request may be "audio" or "video"; a chat request is "chat".
const toBucket = (type) => (type === "chat" ? "chat" : "call");

const isBrowser = () => typeof window !== "undefined" && !!window.sessionStorage;

const readJSON = (key, fallback) => {
  if (!isBrowser()) return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / serialization errors */
  }
};

const now = () => Date.now();

/** Drop owned rooms / pending intents older than MAX_AGE. */
const pruneOwnedRooms = (owned) => {
  const cutoff = now() - MAX_AGE;
  let changed = false;
  const next = {};
  for (const [roomId, ts] of Object.entries(owned || {})) {
    if (typeof ts === "number" && ts >= cutoff) {
      next[roomId] = ts;
    } else {
      changed = true;
    }
  }
  return { next, changed };
};

const pruneIntents = (intents) => {
  const cutoff = now() - MAX_AGE;
  return (intents || []).filter((i) => i && typeof i.ts === "number" && i.ts >= cutoff);
};

/**
 * Record that THIS tab just initiated a call/chat request. We don't know the
 * server-assigned roomId yet — it arrives later via `call:room` / `chat:room`.
 */
export const markInitiated = (type) => {
  if (!isBrowser()) return;
  const bucket = toBucket(type);
  const intents = pruneIntents(readJSON(PENDING_INTENTS_KEY, []));
  intents.push({ bucket, ts: now() });
  writeJSON(PENDING_INTENTS_KEY, intents);
};

/** True if THIS tab already owns the given roomId. */
export const ownsRoom = (roomId) => {
  if (!roomId || !isBrowser()) return false;
  const owned = readJSON(OWNED_ROOMS_KEY, {});
  return Object.prototype.hasOwnProperty.call(owned, roomId);
};

/**
 * Attempt to claim a roomId for THIS tab.
 *
 * Returns true when:
 *   - this tab already owns the room, or
 *   - this tab has an outstanding "initiated" intent for the same bucket
 *     (call/chat), which it then consumes and binds to this roomId.
 *
 * Returns false when this tab never initiated a matching request — that's how a
 * non-initiating tab knows to ignore the accept/ring event.
 */
export const claimRoom = (roomId, type) => {
  if (!roomId || !isBrowser()) return false;

  const { next: ownedPruned } = pruneOwnedRooms(readJSON(OWNED_ROOMS_KEY, {}));

  // Already ours.
  if (Object.prototype.hasOwnProperty.call(ownedPruned, roomId)) {
    writeJSON(OWNED_ROOMS_KEY, ownedPruned);
    return true;
  }

  const bucket = toBucket(type);
  const intents = pruneIntents(readJSON(PENDING_INTENTS_KEY, []));
  const idx = intents.findIndex((i) => i.bucket === bucket);
  if (idx === -1) {
    // Persist any pruning we did, but this tab did not initiate this request.
    writeJSON(OWNED_ROOMS_KEY, ownedPruned);
    writeJSON(PENDING_INTENTS_KEY, intents);
    return false;
  }

  // Consume the oldest matching intent and bind the room to this tab.
  intents.splice(idx, 1);
  ownedPruned[roomId] = now();
  writeJSON(PENDING_INTENTS_KEY, intents);
  writeJSON(OWNED_ROOMS_KEY, ownedPruned);
  return true;
};

/** Release ownership of a room once the session reaches a terminal state. */
export const releaseRoom = (roomId) => {
  if (!roomId || !isBrowser()) return;
  const owned = readJSON(OWNED_ROOMS_KEY, {});
  if (Object.prototype.hasOwnProperty.call(owned, roomId)) {
    delete owned[roomId];
    writeJSON(OWNED_ROOMS_KEY, owned);
  }
};
