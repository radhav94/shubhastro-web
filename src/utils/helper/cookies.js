/**
 * Lightweight cookie helpers (no external dependency).
 *
 * Used to persist small pieces of client-side state (e.g. guest/non-logged-in
 * kundli profiles) across page navigations and reloads.
 *
 * NOTE: Browser cookies are limited to ~4KB per cookie. These helpers are
 * intended for small JSON payloads only. setJSONCookie returns false when the
 * serialized value would exceed the safe limit so callers can react gracefully.
 */

const MAX_COOKIE_BYTES = 4000; // keep below the ~4096 byte hard limit

/**
 * Read a raw cookie value by name.
 * @param {string} name
 * @returns {string|null} decoded value or null when not present
 */
export const getCookie = (name) => {
  if (typeof document === "undefined" || !name) return null;
  try {
    const prefix = `${encodeURIComponent(name)}=`;
    const row = document.cookie
      .split("; ")
      .find((c) => c.startsWith(prefix));
    if (!row) return null;
    return decodeURIComponent(row.slice(prefix.length));
  } catch {
    return null;
  }
};

/**
 * Write a raw cookie value.
 * @param {string} name
 * @param {string} value
 * @param {{ days?: number, path?: string, sameSite?: string, secure?: boolean }} [options]
 * @returns {boolean} true when written
 */
export const setCookie = (name, value, options = {}) => {
  if (typeof document === "undefined" || !name) return false;
  const {
    days = 7,
    path = "/",
    sameSite = "Lax",
    secure = typeof window !== "undefined" && window.location?.protocol === "https:",
  } = options;

  try {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (typeof days === "number") {
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      cookie += `; expires=${expires.toUTCString()}`;
    }
    cookie += `; path=${path}`;
    cookie += `; SameSite=${sameSite}`;
    if (secure) cookie += "; Secure";
    document.cookie = cookie;
    return true;
  } catch {
    return false;
  }
};

/**
 * Remove a cookie by name.
 * @param {string} name
 * @param {{ path?: string }} [options]
 */
export const removeCookie = (name, options = {}) => {
  if (typeof document === "undefined" || !name) return;
  const { path = "/" } = options;
  try {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  } catch {
    /* no-op */
  }
};

/**
 * Read and parse a JSON cookie value.
 * @param {string} name
 * @param {*} [fallback=null] value returned when cookie is missing or invalid
 * @returns {*}
 */
export const getJSONCookie = (name, fallback = null) => {
  const raw = getCookie(name);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Serialize and store a JSON value in a cookie.
 * @param {string} name
 * @param {*} value
 * @param {object} [options] forwarded to setCookie
 * @returns {boolean} false when serialization fails or exceeds the size limit
 */
export const setJSONCookie = (name, value, options = {}) => {
  try {
    const serialized = JSON.stringify(value);
    // encodeURIComponent can inflate size; measure the encoded length.
    if (encodeURIComponent(serialized).length > MAX_COOKIE_BYTES) {
      return false;
    }
    return setCookie(name, serialized, options);
  } catch {
    return false;
  }
};

/**
 * Cookie key for guest (non-logged-in) kundli profiles, shared across pages.
 */
export const GUEST_KUNDLI_COOKIE = "guestKundliProfiles";

/**
 * Remove all guest kundli profiles. Call this on login so a freshly
 * authenticated user does not carry over profiles added while browsing as a guest.
 */
export const clearGuestKundliProfiles = () => removeCookie(GUEST_KUNDLI_COOKIE);
