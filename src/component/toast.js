import { toast as rht } from "react-hot-toast";

const options = {
  duration: 3000,
  position: "top-right",
    zIndex: 9999999999,
};

// Helper to ensure message is always a string
const ensureString = (msg) => {
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'object' && msg !== null) {
    // If it's an object, try to extract message
    if (msg.message) return String(msg.message);
    if (msg.error) return String(msg.error);
    // Fallback: stringify the object
    return JSON.stringify(msg);
  }
  return String(msg || 'An error occurred');
};

let activeToastId = null;
let lastToastMessage = null;
let lastToastTime = 0;

/*
 * Collapse only same-tick bursts of an identical message (e.g. several socket
 * handlers reporting one failure). This used to be 2000ms, which silently
 * swallowed deliberate repeat taps: a user tapping an unavailable Chat button
 * four times got one toast, so taps 2-4 changed nothing on screen and they kept
 * hammering — exactly what Clarity reports as a rage click. Stacking is not a
 * risk here because every show dismisses the previous toast first, so the only
 * thing a long window bought us was the missing acknowledgement.
 */
const DEDUP_INTERVAL = 350;

const showToast = (fn, msg, opts) => {
  const message = ensureString(msg);
  const now = Date.now();

  // Skip duplicate message within dedup interval
  if (message === lastToastMessage && now - lastToastTime < DEDUP_INTERVAL) {
    return activeToastId;
  }

  // Dismiss + recreate rather than update in place, so the enter animation
  // replays and a repeat tap is visibly acknowledged.
  rht.dismiss(activeToastId);
  lastToastMessage = message;
  lastToastTime = now;
  activeToastId = fn(message, opts);
  return activeToastId;
};

const success = (msg, opts) => showToast(rht.success, msg, { ...options, ...opts });

const error = (msg, opts) => showToast(rht.error, msg, { ...options, ...opts });

const warning = (msg, opts) => showToast(rht, msg, { ...options, icon: "⚠️", ...opts });

const info = (msg, opts) => showToast(rht, msg, { ...options, icon: "ℹ️", ...opts });

const promise = (myPromise, msgObj) => {
  rht.dismiss(activeToastId);
  activeToastId = rht.promise(myPromise, msgObj, options);
  return activeToastId;
};

const toast = {
  success,
  error,
  warning,
  info,
  promise,
};

export default toast;
