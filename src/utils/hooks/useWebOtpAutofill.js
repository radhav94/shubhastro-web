import { useEffect, useRef } from "react";

/**
 * Fill the OTP boxes from the SMS on Android Chrome (WebOTP API).
 *
 * This is what powers the "Allow Chrome to read the message and copy code"
 * prompt. The prompt is only ever shown while a `navigator.credentials.get({otp})`
 * request is pending, so a screen that does not make that call gets no autofill
 * at all — `autocomplete="one-time-code"` alone does nothing on Android (it is
 * iOS Safari's mechanism). Two of this app's three OTP screens were in exactly
 * that state, which is why "Allow" appeared to copy nothing on mWeb.
 *
 * Behaviour notes that matter on Android:
 *
 *  - One request at a time per document. A second concurrent call rejects with
 *    InvalidStateError, so `enabled` must be false for any OTP UI that is not
 *    on screen (a mounted-but-hidden modal would steal the request).
 *  - The request must still be pending when the SMS lands. It is re-armed on
 *    `rearmKey` (bump it per code request / resend) and again when the tab
 *    becomes visible with nothing pending — the user leaving for the Messages
 *    app and coming back is the normal path here, and a request that errored in
 *    the meantime would otherwise leave the prompt doing nothing.
 *  - The SMS must carry the origin binding as its last line:
 *        @<host> #<code>      e.g.  @shubhastro.ai #123456
 *    with the host matching the page origin exactly (apex vs www counts).
 *    Without it Chrome never offers the prompt — that part is the SMS template,
 *    not something this hook can fix.
 *
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - arm only while the OTP UI is visible
 * @param {Function} options.onCode - called with the digits-only code
 * @param {number|string} [options.rearmKey=0] - change to arm a fresh request
 * @param {number} [options.length=6]
 */
export const useWebOtpAutofill = ({ enabled = true, onCode, rearmKey = 0, length = 6 } = {}) => {
  // Held in a ref so re-arming does not depend on the caller memoising it.
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;
    // Feature detection, not UA sniffing: absent on iOS and desktop.
    if (!("OTPCredential" in window)) return undefined;
    // WebOTP is secure-context only; on http it throws rather than resolving.
    if (!window.isSecureContext) return undefined;

    let controller = null;
    let cancelled = false;

    const arm = () => {
      // Never overlap: a second pending request rejects with InvalidStateError
      // and kills the one the user is about to approve.
      if (controller || cancelled) return;

      controller = new AbortController();
      const mine = controller;

      let request;
      try {
        request = navigator.credentials.get({
          otp: { transport: ["sms"] },
          signal: mine.signal,
        });
      } catch (err) {
        // Synchronous throw (unsupported transport, another request in flight).
        controller = null;
        if (import.meta.env.DEV) console.warn("[webotp] request rejected:", err?.name || err);
        return;
      }

      request
        .then((credential) => {
          if (cancelled) return;
          /*
            Normalised the same way manual entry is: digits only, clamped to the
            expected length. A raw `code` carrying any stray character would set a
            value the boxes and the length-based auto-submit both reject, so
            "Allow" would look like it did nothing even though the credential was
            read.
          */
          const code = String(credential?.code || "").replace(/\D/g, "").slice(0, length);
          if (code) {
            onCodeRef.current?.(code);
          } else if (import.meta.env.DEV) {
            console.warn("[webotp] credential had no usable digits:", credential?.code);
          }
        })
        .catch((err) => {
          // AbortError is ours (unmount / re-arm) and is not a failure.
          if (err?.name !== "AbortError" && import.meta.env.DEV) {
            console.warn("[webotp] not filled:", err?.name, err?.message);
          }
        })
        .finally(() => {
          if (controller === mine) controller = null;
        });
    };

    arm();

    /*
      Re-arm on return to the page, but only when nothing is pending. Aborting a
      live request here would break the very flow this hook exists for (the user
      IS away in the Messages app while it waits).
    */
    const onVisibility = () => {
      if (document.visibilityState === "visible") arm();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      controller?.abort();
      controller = null;
    };
  }, [enabled, rearmKey, length]);
};

export default useWebOtpAutofill;
