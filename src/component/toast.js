import { toast as rht } from "react-hot-toast";

const options = {
  duration: 5000,
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

const showToast = (fn, msg, opts) => {
  rht.dismiss(activeToastId);
  activeToastId = fn(ensureString(msg), opts);
  return activeToastId;
};

const success = (msg) => showToast(rht.success, msg, options);

const error = (msg) => showToast(rht.error, msg, options);

const warning = (msg) => showToast(rht, msg, { ...options, icon: "⚠️" });

const info = (msg) => showToast(rht, msg, { ...options, icon: "ℹ️" });

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
