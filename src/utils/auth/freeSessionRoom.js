/*
 * Which chat room is the user's free first session.
 *
 * The chat screen needs to know whether the session it is showing is the free
 * one (header "1st Free Chat" badge, "ending soon" banner, the locked footer
 * once it runs out). That cannot be read from the eligibility flag at render
 * time: the moment a session is accepted, useFreeSessionWatcher marks the offer
 * as spent (markFreeSessionConsumed), so by the time ChatWindow mounts — often
 * after a full `window.location.href` navigation — `isFirstSessionFree` already
 * reads false.
 *
 * So the watcher records the room id here, at accept time, BEFORE it marks the
 * offer consumed. localStorage (not sessionStorage) so the answer survives the
 * hard navigation into the chat and a reload mid-session; it is keyed by room,
 * so a stale value can never mark a different session as free.
 */
const KEY = "shubhtalk_free_session_room";

/** @param {string} roomId */
export const rememberFreeSessionRoom = (roomId) => {
  if (!roomId) return;
  try {
    localStorage.setItem(KEY, String(roomId));
  } catch {
    /* storage unavailable — the chat simply shows the paid UI */
  }
};

/** @param {string} roomId @returns {boolean} */
export const isFreeSessionRoom = (roomId) => {
  if (!roomId) return false;
  try {
    return localStorage.getItem(KEY) === String(roomId);
  } catch {
    return false;
  }
};

/*
 * Audio calls use the same single slot. The offer is one session, so only one
 * id is ever "the free one"; a call is stored with a `call:` prefix so a call's
 * room id can never be mistaken for a chat room id (and vice versa).
 * Video calls are never recorded — the offer covers chat and audio only.
 */
const CALL_PREFIX = "call:";

/** @param {string} callRoomId the call's session roomId (call:accepted `roomId`) */
export const rememberFreeSessionCall = (callRoomId) => {
  if (!callRoomId) return;
  rememberFreeSessionRoom(`${CALL_PREFIX}${callRoomId}`);
};

/** @param {string} callRoomId @returns {boolean} */
export const isFreeSessionCall = (callRoomId) =>
  !!callRoomId && isFreeSessionRoom(`${CALL_PREFIX}${callRoomId}`);

export const clearFreeSessionRoom = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Whether a `chat:accepted` / `call:accepted` payload explicitly says the
 * session is free.
 * The backend does not send such a field today; this is here so it is honoured
 * the day it does, without another client change.
 */
export const payloadSaysFree = (data) =>
  data?.isFreeSession === true ||
  data?.isFree === true ||
  data?.isFirstSessionFree === true ||
  data?.freeSession === true;

/*
 * Timing facts about the free session, recorded at accept time next to the
 * room id: when it started and — if the payload says — how long the free part
 * is. Lets the free countdown be timed on its own should `remainingTime` ever
 * also count wallet-funded minutes (see freeSessionUtils.getFreeSecondsLeft).
 * Same single slot as the room id: one free session, keyed by its id.
 */
const META_KEY = "shubhtalk_free_session_meta";

/**
 * @param {string} id      the room id, or `call:<roomId>` for a call
 * @param {number|null} freeSeconds  free allowance, when the payload carries one
 */
export const rememberFreeSessionMeta = (id, freeSeconds = null) => {
  if (!id) return;
  try {
    localStorage.setItem(
      META_KEY,
      JSON.stringify({ id: String(id), freeSeconds: Number(freeSeconds) > 0 ? Number(freeSeconds) : null, startedAt: Date.now() })
    );
  } catch {
    /* storage unavailable — the countdown falls back to remainingTime */
  }
};

/** @returns {{ id: string, freeSeconds: number|null, startedAt: number }|null} */
export const readFreeSessionMeta = (id) => {
  if (!id) return null;
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || "null");
    return meta && meta.id === String(id) ? meta : null;
  } catch {
    return null;
  }
};

/** Storage id of a free call, for rememberFreeSessionMeta / readFreeSessionMeta. */
export const freeSessionCallId = (callRoomId) => (callRoomId ? `${CALL_PREFIX}${callRoomId}` : null);

/* ───────────────────── Emergency sessions are never free ─────────────────────
 *
 * The free first session does not apply to EMERGENCY chat / call / video: those
 * are always paid from the wallet, even when `isFirstSessionFree` is true. The
 * accepted payloads only sometimes carry `isEmergency`, so the user's own
 * request is remembered per astrologer when an emergency session is started
 * (see useAstrologerConnect) and checked when the session is accepted.
 */
const EMERGENCY_KEY = "shubhtalk_emergency_request";
// Long enough to cover an emergency request ringing and being accepted.
const EMERGENCY_TTL_MS = 10 * 60 * 1000;

export const rememberEmergencyRequest = (astrologerId) => {
  try {
    localStorage.setItem(
      EMERGENCY_KEY,
      JSON.stringify({ astrologerId: astrologerId ? String(astrologerId) : null, at: Date.now() })
    );
  } catch {
    /* storage unavailable — fall back to the payload's isEmergency */
  }
};

export const clearEmergencyRequest = () => {
  try {
    localStorage.removeItem(EMERGENCY_KEY);
  } catch {
    /* ignore */
  }
};

/** True when this accepted session is an emergency one (payload flag, or the user's recent emergency request to this astrologer). */
export const isEmergencySession = (data) => {
  if (data?.isEmergency === true || data?.sessionType === "emergency" || data?.type === "emergency") return true;
  try {
    const req = JSON.parse(localStorage.getItem(EMERGENCY_KEY) || "null");
    if (!req || Date.now() - Number(req.at) > EMERGENCY_TTL_MS) return false;
    const astroId = data?.astrologerId || data?.astrologerDetail?._id || data?.astrologer?._id;
    return !req.astrologerId || !astroId || String(astroId) === req.astrologerId;
  } catch {
    return false;
  }
};

/* ──────────────────── Live-stream sessions are never free ────────────────────
 *
 * A call (or a queued chat re-initiated) from an astrologer's LIVE STREAM
 * (LiveView: `isLive: true` + `liveRoomDetails`) is not the free first session:
 * it is requested from the live room, billed at the live rate and checked
 * against the wallet up front (LiveView's getBalance). SHB-2148: such a call was
 * still tagged free at `call:accepted` (the accepted payload does not echo
 * `isLive`, and the user was still free-eligible), so it showed the free-call UI
 * and ended on the locked FreeCallEndedScreen.
 *
 * As with emergency requests, the user's own live request is remembered per
 * astrologer when it is sent and checked when the session is accepted; the
 * payload flags are honoured too, the day the backend echoes them.
 */
const LIVE_KEY = "shubhtalk_live_requests";
// Long enough to cover a live request waiting in the queue and being accepted.
const LIVE_TTL_MS = 15 * 60 * 1000;

const readLiveRequests = () => {
  try {
    const map = JSON.parse(localStorage.getItem(LIVE_KEY) || "null");
    if (!map || typeof map !== "object") return {};
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(map).filter(([, at]) => now - Number(at) <= LIVE_TTL_MS)
    );
  } catch {
    return {};
  }
};
const writeLiveRequests = (map) => {
  try {
    if (Object.keys(map).length) localStorage.setItem(LIVE_KEY, JSON.stringify(map));
    else localStorage.removeItem(LIVE_KEY);
  } catch {
    /* storage unavailable — fall back to the payload / activeCall.origin */
  }
};

/** Called when a session is requested from a live stream (LiveView). */
export const rememberLiveRequest = (astrologerId) => {
  if (!astrologerId) return;
  writeLiveRequests({ ...readLiveRequests(), [String(astrologerId)]: Date.now() });
};

/** Forget the live request to this astrologer (all of them when no id). */
export const clearLiveRequest = (astrologerId) => {
  if (!astrologerId) {
    writeLiveRequests({});
    return;
  }
  const map = readLiveRequests();
  delete map[String(astrologerId)];
  writeLiveRequests(map);
};

/** The payload / session object itself says it comes from a live stream. */
export const payloadSaysLive = (data) =>
  data?.isLive === true ||
  data?.fromLive === true ||
  data?.origin === "live" ||
  !!data?.liveRoomDetails;

const sessionAstrologerId = (data) =>
  data?.astrologerId?._id ||
  data?.astrologerId ||
  data?.astrologerDetail?._id ||
  data?.astrologer?._id ||
  data?.recieverDetail?._id ||
  null;

/**
 * True when this accepted session was requested from a live stream: the
 * payload says so, or the user has a recent live request to this astrologer.
 * With no astrologer id in the payload, any recent live request counts — a
 * paid session wrongly shown as free (the bug) is worse than the reverse.
 */
export const isLiveSession = (data) => {
  if (payloadSaysLive(data)) return true;
  const map = readLiveRequests();
  const ids = Object.keys(map);
  if (!ids.length) return false;
  const astroId = sessionAstrologerId(data);
  return astroId ? ids.includes(String(astroId)) : true;
};
