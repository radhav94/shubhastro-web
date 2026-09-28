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

/*
 * Local "a session just ended" signal, for flows that end a session without the
 * server echoing an end event back to us (Pandit AI emits chat:end itself).
 * useFreeSessionWatcher listens for this alongside the socket's end events.
 */
export const SESSION_ENDED_EVENT = "shubhtalk:session-ended";

/**
 * Announce that a session has ended, so eligibility is re-read from the profile.
 *
 * Call this from any flow that ends a session itself instead of waiting for the
 * server's end event (Pandit AI text and voice both do). Safe to call more than
 * once per session — the watcher debounces and refreshFreeSessionStatus no-ops
 * once the answer is already false.
 */
export const notifySessionEnded = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
};

/**
 * Record that the free first session has been used, without waiting for the
 * backend to say so.
 *
 * Called when a session actually STARTS (the astrologer accepted — chat, audio,
 * video or Pandit AI). The offer is one session total, so from that moment the
 * user no longer has a free one and the cards must quote the real per-minute
 * price.
 *
 * Why the client concludes this instead of only trusting the profile flag:
 * reported case — a user started a free session, dropped it part-way, returned to
 * the listing and was still shown "Free" on every astrologer; the next attempt
 * then failed the wallet check with "insufficient balance". So the backend had
 * already counted the session while the label had not caught up. Waiting for the
 * flag meant advertising a free session that would be refused — the worst of the
 * two ways to be wrong.
 *
 * Trade-off, stated plainly: if the backend does NOT count a particular session
 * against the offer, this hides the offer earlier than it should. It self-heals —
 * the value is cleared on logout and re-resolved from the profile at the next
 * login — but within this session the user would see paid prices. That is the
 * safer direction: a price that turns out to be free is a pleasant surprise; a
 * "Free" label that charges is a complaint.
 */
export const markFreeSessionConsumed = () => {
  if (readFreeSessionStatus() === false) return;
  write(false);
};

// One profile read at a time: several end events can describe one session.
let refreshInFlight = null;

/**
 * Re-read eligibility from the profile API.
 *
 * Needed because the backend flips `isFirstSessionFree` to false once the user
 * has actually had a session — chat, audio, video or Pandit AI. Without this the
 * value cached at login stays `true` for the rest of the visit, so the cards keep
 * promising a free session the user has already used.
 *
 * Skipped once the answer is already `false`: it never goes back to true within a
 * session, so there is nothing left to learn. Also skipped for guests.
 *
 * @returns {Promise<boolean|null>} the fresh value, or null when unknown
 */
export const refreshFreeSessionStatus = async () => {
  if (typeof window === "undefined") return null;
  if (!localStorage.getItem("shubhtalk_customer_token")) return null;
  // Already used up — no request can change that.
  if (readFreeSessionStatus() === false) return false;
  if (refreshInFlight) return refreshInFlight;

  const id = getProfileId();
  if (!id) return null;

  refreshInFlight = (async () => {
    try {
      const response = await getProfile(id, { skipToast: true });
      const value = extractFirstSessionFree(response);

      /*
        Dev-only, and worth keeping: responses come through the encrypting secure
        gateway, so the Network tab shows ciphertext — there is no other way to see
        what the profile actually said about this flag. Distinguishes the three
        outcomes that look identical on screen: the server still says `true`, the
        server stopped sending the field (value null, cache untouched), or the
        request failed. Stripped from production builds (esbuild `pure`).
      */
      if (import.meta.env.DEV) {
        console.log("[freeSession] profile read →", {
          isFirstSessionFree: value,
          fieldPresent: value !== null,
          cachedBefore: readFreeSessionStatus(),
        });
      }

      // Only cache a real answer; a profile without the field leaves it unknown
      // (see the note at the top of this file).
      if (value !== null) write(value);
      return value;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.log("[freeSession] profile read failed →", err?.response?.status || err?.message);
      }
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

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
