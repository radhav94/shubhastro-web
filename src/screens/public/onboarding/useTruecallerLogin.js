import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  createTruecallerSession,
  getTruecallerStatus,
} from "../../../services/appServices/truecallerService";
import {
  generateRequestNonce,
  getTruecallerSupportReason,
  invokeTruecaller,
  isTruecallerSupported,
  TRUECALLER_POLL_INTERVAL_MS,
  TRUECALLER_POLL_TIMEOUT_MS,
} from "../../../utils/truecaller/truecallerWeb";
import { getDeviceInfo, getDeviceType } from "../../../utils/deviceInfo";
import { requestFCMToken } from "../../../services/firebase";
import { completeCustomerLogin } from "../../../utils/auth/completeCustomerLogin";
import { trackEvent } from "../../../utils/analytics";

/**
 * Drives the Truecaller mobile-web login.
 *
 * Flow (see utils/truecaller/truecallerWeb.js for why it works this way):
 *   register request on backend -> open Truecaller deep link -> poll backend
 *   until Truecaller's server-side callback has completed the login.
 *
 * @param {object}   options
 * @param {Function} options.onLoggedIn - called with ({ userData, isRegistered,
 *   deviceLimitReached }) once the session is persisted. The caller navigates.
 */
const useTruecallerLogin = ({ onLoggedIn } = {}) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("idle"); // idle | invoking | waiting | error
  const isSupported = isTruecallerSupported();

  // Timers/abort handles are cleaned up on unmount so a backgrounded login
  // can't keep polling or fire state updates after the screen is gone.
  const pollTimerRef = useRef(null);
  const abortRef = useRef(null);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  /**
   * Poll the backend until Truecaller's callback lands, the user rejects, or we
   * time out. Recursive timeout (not setInterval) so a slow response can never
   * overlap with the next poll.
   */
  const pollForCompletion = useCallback(
    (requestId, startedAt) =>
      new Promise((resolve) => {
        const tick = async () => {
          if (cancelledRef.current) {
            resolve({ outcome: "cancelled" });
            return;
          }

          if (Date.now() - startedAt > TRUECALLER_POLL_TIMEOUT_MS) {
            resolve({ outcome: "timeout" });
            return;
          }

          try {
            const controller = new AbortController();
            abortRef.current = controller;
            const res = await getTruecallerStatus(requestId, { signal: controller.signal });
            const body = res?.data || {};

            if (body.status === "completed" && body.data?.accessToken) {
              resolve({ outcome: "completed", userData: body.data });
              return;
            }
            if (body.status === "rejected" || body.status === "expired") {
              resolve({ outcome: body.status, message: body.message });
              return;
            }
            // "pending" (or anything unrecognised) -> keep waiting.
          } catch (err) {
            // Cancelled by unmount/cleanup — stop quietly.
            if (
              err?.code === "ERR_CANCELED" ||
              err?.name === "CanceledError" ||
              err?.name === "AbortError"
            ) {
              resolve({ outcome: "cancelled" });
              return;
            }

            // 404/501 means the status endpoint isn't deployed on this
            // environment. That will never resolve, so retrying for the full 45s
            // just makes the button sit on "Verifying with Truecaller..." before
            // reporting a misleading timeout. Fail fast and name the real cause.
            const httpStatus = err?.response?.status;
            if (httpStatus === 404 || httpStatus === 501) {
              resolve({ outcome: "not_implemented" });
              return;
            }

            // Transient network/5xx: swallow and retry until the timeout. A
            // single blip shouldn't kill a login that may already have succeeded
            // on the server.
          }

          pollTimerRef.current = setTimeout(tick, TRUECALLER_POLL_INTERVAL_MS);
        };

        tick();
      }),
    []
  );

  const loginWithTruecaller = useCallback(async () => {
    if (!isSupported) {
      // Should not be reachable (button is hidden), but keep the flow honest.
      toast.error("Truecaller login isn't available on this device. Please use your mobile number.");
      return;
    }
    if (status === "invoking" || status === "waiting") return;

    const requestId = generateRequestNonce();
    setStatus("invoking");
    trackEvent("truecaller_login_started", {});

    try {
      // Attach device/FCM details to the pending request so the session the
      // callback creates has them (the callback itself carries none).
      const fcmTokens = await requestFCMToken().catch(() => null);
      try {
        await createTruecallerSession({
          requestId,
          type: "CUSTOMER",
          deviceInfo: getDeviceInfo(),
          deviceType: getDeviceType(),
          ...(fcmTokens ? { fcmTokens } : {}),
        });
      } catch {
        // Non-fatal: if the backend doesn't require pre-registration the status
        // endpoint is still the source of truth. Continue to the deep link.
      }

      // Policy links come from truecallerWeb.js (absolute public URLs — the
      // consent sheet is rendered by the Truecaller app, so origin-relative
      // links would be unreachable).
      const { opened } = await invokeTruecaller({ requestNonce: requestId });

      if (!opened) {
        // Deep link did nothing => Truecaller app isn't installed.
        setStatus("idle");
        trackEvent("truecaller_login_unavailable", { reason: "app_not_installed" });
        toast.error("Truecaller app not found. Please continue with your mobile number.");
        return;
      }

      setStatus("waiting");
      const result = await pollForCompletion(requestId, Date.now());
      if (cancelledRef.current) return;

      if (result.outcome === "completed") {
        const { isRegistered, deviceLimitReached } = completeCustomerLogin(result.userData, dispatch);
        setStatus("idle");
        toast.dismiss();
        toast.success("Logged in with Truecaller");
        trackEvent("truecaller_login_success", { user_id: result.userData?._id });
        onLoggedIn?.({ userData: result.userData, isRegistered, deviceLimitReached });
        return;
      }

      setStatus("idle");

      if (result.outcome === "not_implemented") {
        trackEvent("truecaller_login_failed", { error_reason: "status_endpoint_missing" });
        toast.error("Truecaller login isn't available yet. Please continue with your mobile number.");
        if (import.meta.env.DEV) {
          console.warn(
            "[truecaller] GET users/truecaller/status returned 404/501 — the backend endpoint is not deployed on this environment. See TRUECALLER_WEB_IMPLEMENTATION.md."
          );
        }
      } else if (result.outcome === "rejected") {
        trackEvent("truecaller_login_failed", { error_reason: "user_rejected" });
        toast.error(result.message || "Truecaller verification was cancelled.");
      } else if (result.outcome === "timeout" || result.outcome === "expired") {
        trackEvent("truecaller_login_failed", { error_reason: result.outcome });
        toast.error("Truecaller verification timed out. Please use your mobile number.");
      }
      // "cancelled" => component unmounted; say nothing.
    } catch (error) {
      if (cancelledRef.current) return;
      console.error("Truecaller login error:", error);
      setStatus("error");
      trackEvent("truecaller_login_failed", {
        error_reason: error?.response?.status ? `http_${error.response.status}` : "request_threw",
      });
      toast.error("Truecaller login failed. Please continue with your mobile number.");
      setStatus("idle");
    } finally {
      cleanup();
    }
  }, [cleanup, dispatch, isSupported, onLoggedIn, pollForCompletion, status]);

  return {
    /** Render the Truecaller button only when this is true. */
    isSupported,
    /**
     * "ok" | "no_partner_key" | "ios" | "not_android" — for the DEV-only hint on
     * the login screen, so a hidden button is diagnosable on a real phone.
     */
    unsupportedReason: getTruecallerSupportReason(),
    /** "idle" | "invoking" | "waiting" | "error" */
    status,
    isBusy: status === "invoking" || status === "waiting",
    loginWithTruecaller,
  };
};

export default useTruecallerLogin;
