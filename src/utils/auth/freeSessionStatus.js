import {
  getProfile,
  getProfileId,
  extractFirstSessionFree,
} from "../../services/appServices/profileService";

/*
 * Free-session eligibility, resolved once at login.
 *
 * The offer label ("₹21/min Free" on every astrologer card, and the landing
 * popup) needs to know whether THIS user still has their free first session.
 * That answer belongs to the backend and does not change while the user browses,
 * so it is resolved at login and cached, rather than re-derived per screen.
 *
 * Two sources, in order:
 *
 *   1. The login response itself. If the backend puts `isFirstSessionFree` on the
 *      user payload, nothing extra is fetched.
 *   2. GET /api/Profile/:id — the common profile endpoint the app already calls
 *      at startup for registration status.
 *
 * If neither carries the field, NOTHING is cached, and consumers treat "not
 * known" the same as "not eligible" — no free labels, no popup. Only an explicit
 * `true` turns the offer on for a user. See utils/hooks/useFreeSession.
 *
 * The absence is still stored as absence rather than as `false` so the profile
 * fallback in useFreeSession can retry it later in the session; it just does not
 * grant anything in the meantime.
 */
/*
 * Also hardcoded in utils/navigationHelper.js, which clears it on a forced
 * logout. That module cannot import this one without creating an import cycle
 * through the axios client — see the comment there. Rename in both places.
 */
const KEY = "shubhtalk_first_session_free";

/*
 * Fired whenever the cached value changes. localStorage is not reactive and this
 * is resolved asynchronously after login, so the screens already on display
 * (astrologer cards, the landing popup) need telling — otherwise a user who just
 * logged in keeps the pre-login labels until the next navigation.
 */
export const FREE_SESSION_EVENT = "free-session-status";

/** @returns {boolean|null} null when unknown (never fetched, or not sent) */
export const readFreeSessionStatus = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  } catch {
    return null;
  }
};

const write = (value) => {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value ? "true" : "false");
  } catch {
    /* storage unavailable — callers fall back to the flag */
  }
  try {
    window.dispatchEvent(new Event(FREE_SESSION_EVENT));
  } catch {
    /* non-browser context */
  }
};

/** Called on logout: the next user's eligibility is their own. */
export const clearFreeSessionStatus = () => write(null);

/**
 * Resolve and cache eligibility for a user who just logged in.
 *
 * Fire-and-forget: the caller should not await it. Login navigation must not
 * wait on a promo label, and every consumer treats "not yet known" as "fall back
 * to the flag" rather than as an error state.
 *
 * @param {Object} [userData] - the login response payload, if available
 */
export const resolveFreeSessionStatus = async (userData) => {
  // 1) Straight from the login payload, when the backend sends it there.
  const fromLogin = extractFirstSessionFree(userData);
  if (fromLogin !== null) {
    write(fromLogin);
    return fromLogin;
  }

  // 2) The profile endpoint.
  const id = userData?._id || getProfileId();
  if (!id) return null;

  try {
    const response = await getProfile(id, { skipToast: true });
    const fromProfile = extractFirstSessionFree(response);
    // Only cache a real answer. A profile without the field leaves this unknown
    // on purpose — see the note at the top of this file.
    if (fromProfile !== null) write(fromProfile);
    return fromProfile;
  } catch {
    // 404 (no profile yet), offline, or a failed request. Unknown, not false.
    return null;
  }
};

export default resolveFreeSessionStatus;
