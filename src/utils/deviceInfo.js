/**
 * Generates a device identifier string for multi-device login tracking.
 * Format: "BrowserName on OS | persistent-UUID"
 * The UUID is generated once and stored in localStorage to identify this browser instance.
 */

const DEVICE_ID_KEY = "shubhtalk_device_id";

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

const getBrowserName = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  return "Browser";
};

const getOSName = () => {
  const ua = navigator.userAgent;
  if (ua.includes("iPhone")) return "iOS";
  if (ua.includes("iPad")) return "iPadOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
};

export const getDeviceInfo = () => {
  const browser = getBrowserName();
  const os = getOSName();
  const deviceId = getOrCreateDeviceId();
  return `${browser} on ${os}|${deviceId}`;
};

export const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return "mobile-ios";
  if (/iPad/.test(ua)) return "mobile-ios";
  if (/Android/.test(ua) && /Mobile/.test(ua)) return "mobile-android";
  if (/Android/.test(ua)) return "mobile-android";
  return "web";
};

/**
 * Detects embedded/in-app webviews (Facebook, Instagram, WeChat, LinkedIn, etc.).
 *
 * These browsers silently ignore a programmatic `<a download>` click, so any
 * blob-based download must fall back to opening the file in a new tab instead
 * of reporting success. See `src/utils/helper/downloadFile.js`.
 */
export const isInAppBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";

  // Facebook (FBAN/FBAV), Instagram, Messenger, WeChat, Line, LinkedIn, Snapchat, Twitter
  if (/FBAN|FBAV|FB_IAB|Instagram|Messenger|MicroMessenger|Line\/|LinkedInApp|Snapchat|Twitter/i.test(ua)) {
    return true;
  }

  // Generic Android WebView: has "wv" or lacks a real browser token
  if (/\bwv\b/i.test(ua)) return true;

  // iOS in-app webviews are WebKit without Safari's token
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS && !/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) {
    return true;
  }

  return false;
};
