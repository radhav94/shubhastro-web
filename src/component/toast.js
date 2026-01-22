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

const success = (msg) => {
  return rht.success(ensureString(msg), options);
};

const error = (msg) => {
  return rht.error(ensureString(msg), options);
};

const warning = (msg) => {
  return rht(ensureString(msg), { ...options, icon: "⚠️" });
};

const promise = (myPromise, msgObj) => {
  return rht.promise(myPromise, msgObj, options);
};

const toast = {
  success,
  error,
  warning,
  promise,
};

export default toast;
