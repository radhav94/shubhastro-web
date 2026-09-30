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
