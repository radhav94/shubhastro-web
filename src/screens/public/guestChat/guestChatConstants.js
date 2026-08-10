// Shared key for the guest chat auto-accept handshake.
// When set, the astrologer's chat acceptance is accepted automatically on the
// user's behalf (no accept/reject popup) — used by GuestChatFlow and the global
// WaitingQueueContext. Value is the target astrologer id.
export const GUEST_AUTO_ACCEPT_KEY = "shubhtalk_guest_auto_accept";

// Guest fan-out (first-accept-wins) support.
// When a guest initiates a call/chat we fan out the request to the selected
// astrologer AND the similarOnlineAstrologers returned by preSessionBalanceCheck.
// The first astrologer to accept is auto-accepted; the remaining requests are
// withdrawn. This flag is set (to Date.now()) the moment the first acceptance is
// auto-accepted so that any late "astrologer_accepted" events from the other
// fanned-out astrologers can be auto-rejected instead of showing a ring popup.
export const GUEST_FANOUT_RESOLVED_KEY = "shubhtalk_guest_fanout_resolved";

// Late acceptances are only treated as fan-out stragglers within this window.
// After it elapses the flag is ignored (and cleared) so it can never interfere
// with a later, unrelated session.
export const GUEST_FANOUT_RESOLVED_WINDOW_MS = 90 * 1000;

/* ─────────────────────────── Guest details draft ───────────────────────────
 *
 * Draft of the guest chat details form. Two jobs:
 *
 * 1. Survive a detour. The form asks a guest for six things on a route they can
 *    leave with one back gesture; without a draft, any detour meant retyping
 *    everything, and abandoning was cheaper than returning.
 *
 * 2. Carry over into onboarding. When a guest's profile can't be resolved after
 *    OTP, the app hard-redirects to `/login?step=personalize` (see
 *    services/appServices/kundliServicesNew.js). That drops the user into
 *    PersonalizeScreen + BirthDetailsScreen asking for the same name, gender,
 *    birth date, time and place they just typed. Seeding those screens from this
 *    draft turns "fill six fields again" into "confirm and continue".
 *
 * Kept in sessionStorage: it should survive navigation within the visit but not
 * outlive the browser session, since it holds personal details.
 */

export const GUEST_DRAFT_KEY = "guest_chat_form_draft";

const DRAFT_DATE_FIELDS = ["dob", "time"];

const padTwo = (n) => String(n).padStart(2, "0");

export const loadGuestDraft = () => {
  try {
    const raw = sessionStorage.getItem(GUEST_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Dates round-trip through JSON as ISO strings — revive them.
    DRAFT_DATE_FIELDS.forEach((key) => {
      if (parsed[key]) {
        const revived = new Date(parsed[key]);
        parsed[key] = Number.isNaN(revived.getTime()) ? null : revived;
      }
    });
    return parsed;
  } catch {
    return null;
  }
};

export const saveGuestDraft = (form) => {
  try {
    sessionStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(form));
  } catch {
    /* sessionStorage unavailable (private mode / quota) — non-critical */
  }
};

export const clearGuestDraft = () => {
  try {
    sessionStorage.removeItem(GUEST_DRAFT_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Maps the draft onto the Onboarding `formData` shape.
 *
 * Formats match what PersonalizeScreen and BirthDetailsScreen expect:
 * `birthDate` as YYYY-MM-DD, `birthTime` as 24h HH:MM, coordinates as numbers.
 * Returns null when there's no usable draft so callers can fall back.
 */
export const draftToOnboardingFormData = () => {
  const draft = loadGuestDraft();
  if (!draft) return null;

  const values = {};

  if (draft.name) values.name = draft.name;
  if (draft.identity) values.identity = draft.identity;
  if (draft.mobileNumber) values.phoneNumber = draft.mobileNumber;
  if (draft.birthPlace) values.birthPlace = draft.birthPlace;

  if (draft.dob instanceof Date) {
    values.birthDate = `${draft.dob.getFullYear()}-${padTwo(draft.dob.getMonth() + 1)}-${padTwo(draft.dob.getDate())}`;
  }

  values.unknownBirthTime = !!draft.unknownBirthTime;
  if (!draft.unknownBirthTime && draft.time instanceof Date) {
    values.birthTime = `${padTwo(draft.time.getHours())}:${padTwo(draft.time.getMinutes())}`;
  }

  // Only carry coordinates across as a pair — BirthDetailsScreen gates its
  // submit on latitude, so a half-set location would block the user again.
  if (draft.latitude && draft.longitude) {
    values.latitude = draft.latitude;
    values.longitude = draft.longitude;
    if (draft.timezone != null) values.timezone = draft.timezone;
  }

  return Object.keys(values).length ? values : null;
};
