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
import {
  attachTruecallerLifecycleLog,
  startTruecallerRun,
  tcLog,
} from "../../../utils/truecaller/truecallerLog";

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
    // Records freeze/discard of the tab while the Truecaller app is in front —
    // the failure mode that is indistinguishable from a backend timeout in the UI.
    const detachLifecycleLog = attachTruecallerLifecycleLog();
    return () => {
      cancelledRef.current = true;
      detachLifecycleLog();
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
        let attempt = 0;
        const tick = async () => {
          if (cancelledRef.current) {
            tcLog("poll_cancelled", { attempt });
            resolve({ outcome: "cancelled" });
            return;
          }

          if (Date.now() - startedAt > TRUECALLER_POLL_TIMEOUT_MS) {
            tcLog("poll_timeout", { attempt, elapsedMs: Date.now() - startedAt });
            resolve({ outcome: "timeout" });
            return;
          }

          attempt += 1;
          try {
            const controller = new AbortController();
            abortRef.current = controller;
            const res = await getTruecallerStatus(requestId, { signal: controller.signal });
            const body = res?.data || {};

            // The single most useful line in the file: what the status endpoint
            // actually answered on this environment.
            tcLog("poll_tick", {
              attempt,
              elapsedMs: Date.now() - startedAt,
              httpStatus: res?.status,
              bodyStatus: body?.status ?? null,
              bodySuccess: body?.success ?? null,
              bodyKeys: Object.keys(body || {}),
              hasAccessToken: !!body?.data?.accessToken,
              message: body?.message,
            });

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
            tcLog("poll_error", {
              attempt,
              elapsedMs: Date.now() - startedAt,
              httpStatus: err?.response?.status ?? null,
              code: err?.code || err?.name || null,
              url: err?.config?.baseURL
                ? `${err.config.baseURL}${err.config.url || ""}`
                : err?.config?.url || null,
              // The backend's own 404 body names the route it could not find,
              // which is what distinguishes "not deployed" from a proxy problem.
              serverMessage:
                typeof err?.response?.data === "object"
                  ? err.response.data?.message
                  : String(err?.response?.data || "").slice(0, 200),
              message: String(err?.message || err).slice(0, 200),
            });

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
    startTruecallerRun();
    tcLog("login_click", {
      isSupported,
      reason: getTruecallerSupportReason(),
      status,
      href: window.location.href,
      ua: (navigator.userAgent || "").slice(0, 120),
    });

    if (!isSupported) {
      // Should not be reachable (button is hidden), but keep the flow honest.
      tcLog("aborted_unsupported", { reason: getTruecallerSupportReason() });
      toast.error("Truecaller login isn't available on this device. Please use your mobile number.");
      return;
    }
    if (status === "invoking" || status === "waiting") {
      tcLog("aborted_busy", { status });
      return;
    }

    const requestId = generateRequestNonce();
    setStatus("invoking");
    trackEvent("truecaller_login_started", {});

    try {
      // Attach device/FCM details to the pending request so the session the
      // callback creates has them (the callback itself carries none).
      const fcmTokens = await requestFCMToken().catch(() => null);
      tcLog("fcm_token", { obtained: !!fcmTokens });
      let sessionRouteMissing = false;
      try {
        const sessionRes = await createTruecallerSession({
          requestId,
          type: "CUSTOMER",
          deviceInfo: getDeviceInfo(),
          deviceType: getDeviceType(),
          ...(fcmTokens ? { fcmTokens } : {}),
        });
        tcLog("session_create_ok", {
          httpStatus: sessionRes?.status,
          bodySuccess: sessionRes?.data?.success ?? null,
          message: sessionRes?.data?.message,
        });
      } catch (err) {
        // Non-fatal on its own: pre-registration is optional in our contract, so
        // a backend may implement only the status endpoint. Recorded either way —
        // a 404 here is the first sign the endpoints are missing entirely.
        const httpStatus = err?.response?.status ?? null;
        sessionRouteMissing = httpStatus === 404 || httpStatus === 501;
        tcLog("session_create_failed", {
          httpStatus,
          sessionRouteMissing,
          serverMessage:
            typeof err?.response?.data === "object"
              ? err.response.data?.message
              : String(err?.response?.data || "").slice(0, 200),
          message: String(err?.message || err).slice(0, 200),
        });
      }

      /*
        Don't ask for a consent we cannot act on.

        Opening the sheet commits the user to a decision, and Truecaller then
        posts the access token to the callback URL — server side, out of our
        reach. If `status` isn't deployed there is nowhere for that result to
        surface, so the login dies *after* the user has already consented (the
        dev log showed exactly that: sheet opened, then a 404 51ms later).

        `session` 404ing is not proof on its own, since it is optional. So probe
        `status` once — the endpoint that genuinely cannot be missing — and only
        bail when that is absent too. One extra request, and only on the path
        that was already broken.
      */
      if (sessionRouteMissing) {
        let statusRouteMissing = false;
        try {
          const probe = await getTruecallerStatus(requestId);
          tcLog("status_probe_ok", {
            httpStatus: probe?.status,
            bodyStatus: probe?.data?.status ?? null,
          });
        } catch (err) {
          const httpStatus = err?.response?.status ?? null;
          statusRouteMissing = httpStatus === 404 || httpStatus === 501;
          tcLog("status_probe_failed", { httpStatus, statusRouteMissing });
        }

        if (statusRouteMissing) {
          setStatus("idle");
          tcLog("aborted_endpoints_missing", {});
          trackEvent("truecaller_login_failed", { error_reason: "endpoints_missing" });
          toast.error("Truecaller login isn't available yet. Please continue with your mobile number.");
          if (import.meta.env.DEV) {
            console.warn(
              "[truecaller] users/truecaller/session AND users/truecaller/status both returned 404/501 — the backend endpoints are not deployed on this environment, so the consent sheet was not opened. See TRUECALLER_WEB_IMPLEMENTATION.md."
            );
          }
          return;
        }
      }

      // Policy links come from truecallerWeb.js (absolute public URLs — the
      // consent sheet is rendered by the Truecaller app, so origin-relative
      // links would be unreachable).
      const { opened } = await invokeTruecaller({ requestNonce: requestId });

      if (!opened) {
        // Deep link did nothing => Truecaller app isn't installed.
        setStatus("idle");
        tcLog("app_not_installed", {});
        trackEvent("truecaller_login_unavailable", { reason: "app_not_installed" });
        toast.error("Truecaller app not found. Please continue with your mobile number.");
        return;
      }

      setStatus("waiting");
      tcLog("poll_start", {
        timeoutMs: TRUECALLER_POLL_TIMEOUT_MS,
        intervalMs: TRUECALLER_POLL_INTERVAL_MS,
      });
      const result = await pollForCompletion(requestId, Date.now());
      tcLog("poll_end", { outcome: result.outcome, message: result.message });
      if (cancelledRef.current) return;

      if (result.outcome === "completed") {
        const { isRegistered, deviceLimitReached } = completeCustomerLogin(result.userData, dispatch);
        // No tokens / phone / email in the log — presence and length only.
        tcLog("login_complete", {
          isRegistered,
          deviceLimitReached,
          hasUserId: !!result.userData?._id,
          phoneLen: String(result.userData?.phoneNumber || "").length,
        });
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
      tcLog("login_threw", {
        httpStatus: error?.response?.status ?? null,
        name: error?.name,
        message: String(error?.message || error).slice(0, 200),
        stack: String(error?.stack || "").split("\n").slice(0, 3).join(" | "),
      });
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
