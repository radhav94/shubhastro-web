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
