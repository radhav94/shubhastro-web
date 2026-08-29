/* ────────────────────── Surviving a reload on the OTP step ──────────────────
 *
 * The onboarding wizard is six screens on one route, and which screen you are on
 * is React state. That is fine until the browser throws the page away — which is
 * exactly what happens in the middle of an OTP:
 *
 *   tap "Claim ₹250" -> OTP sent -> switch to Messages to read the code ->
 *   come back -> Chrome on Android has discarded the backgrounded tab and
 *   reloads /login -> state gone -> the number field is empty and the OTP screen
 *   is nowhere to be found.
 *
 * The visitor is now holding a valid code with nothing to type it into. A Clarity
 * session shows the shape of it: promo claimed at 00:56, a run of page
 * hide/visible events, then five minutes of bouncing between login, home and an
 * astrologer profile, a second claim attempt at 05:14, and out — 20 clicks, no
 * signup.
 *
 * So remember the step. sessionStorage (per-tab, cleared with the tab) and a TTL
 * just past the life of an OTP: resuming into "enter the code" only helps while
 * the code still works, and past that the login step is the honest place to land.
 * The number also seeds the login field, so an expired resume still doesn't cost
 * anyone a retype.
 *
 * Lives in its own module because both Onboarding (which reads it on mount and
 * writes it per step) and OTPScreen (which clears it the moment a code verifies)
 * need it, and importing back from Onboarding would be a cycle.
 */
const OTP_RESUME_KEY = "shubhtalk_otp_step";
const OTP_RESUME_TTL_MS = 10 * 60 * 1000;

/** @returns {{phoneNumber: string, at: number}|null} Fresh marker, or null. */
export const loadOtpResume = () => {
  try {
    const raw = sessionStorage.getItem(OTP_RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.phoneNumber) return null;
    if (!parsed.at || Date.now() - parsed.at > OTP_RESUME_TTL_MS) {
      sessionStorage.removeItem(OTP_RESUME_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveOtpResume = (phoneNumber) => {
  try {
    sessionStorage.setItem(
      OTP_RESUME_KEY,
      JSON.stringify({ phoneNumber, at: Date.now() })
    );
  } catch {
    /* sessionStorage unavailable (private mode / quota) — non-critical */
  }
};

export const clearOtpResume = () => {
  try {
    sessionStorage.removeItem(OTP_RESUME_KEY);
  } catch {
    /* ignore */
  }
};
