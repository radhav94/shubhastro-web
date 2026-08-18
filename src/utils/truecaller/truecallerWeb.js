/**
 * Truecaller "Mobile Web SDK" helper.
 *
 * IMPORTANT — this is NOT the Android OAuth SDK flow.
 * The Android app uses the native SDK (TcSdk) and receives an authorization code
 * in-process. Browsers have no such SDK. Truecaller's web integration works via
 * an app deep link plus a SERVER-SIDE callback:
 *
 *   1. Browser generates a unique `requestNonce` and opens
 *      `truecallersdk://truesdk/web_verify?...` (this page).
 *   2. The Truecaller app shows its consent bottom sheet.
 *   3. On consent, Truecaller POSTs `{ requestId, accessToken, endpoint }`
 *      directly to the callback URL configured in the Truecaller developer
 *      portal — i.e. to OUR BACKEND, never to this browser.
 *   4. The backend fetches the profile from `endpoint` (Bearer accessToken),
 *      logs the user in / registers them, and stores the result against
 *      `requestId`.
 *   5. This browser polls the backend with the same `requestNonce` until the
 *      login result is available.
 *
 * Consequences that shape this module:
 *   - The access token is never available client-side, so there is nothing to
 *     "verify" here; we only invoke and then poll.
 *   - Truecaller mobile-web verification is supported on ANDROID BROWSERS ONLY.
 *     iOS and desktop must fall back to the OTP flow.
 *   - If the app is not installed the deep link silently does nothing, so we
 *     detect that via document focus (per Truecaller's documented approach).
 *
 * Docs: https://docs.truecaller.com/truecaller-sdk/mobile-websites
 */

import { isTruecallerLoginEnabled } from "../featureConfig";
import { tcLog } from "./truecallerLog";

/** Partner (app) key from the Truecaller developer portal. */
export const TRUECALLER_PARTNER_KEY = import.meta.env.VITE_TRUECALLER_PARTNER_KEY || "";

/** Name shown to the user inside the Truecaller consent sheet. */
const PARTNER_NAME = "ShubhAstro";

/**
 * Policy links rendered inside the consent sheet.
 *
 * These must be ABSOLUTE public URLs. The sheet is drawn by the Truecaller app,
 * not by this page, so `window.location.origin` is wrong twice over: on
 * localhost/ngrok/preview hosts the link is unreachable for the user, and even on
 * a working host the app's own React routes for these two paths are commented out
 * in Paths.js — the marketing site serves them. That is also why we don't build
 * them from PATH.
 *
 * Never derived from the current host — each environment names its origin
 * explicitly via VITE_POLICY_ORIGIN (dev -> session.shubhastro.ai,
 * stage/prod -> www.shubhastro.ai).
 *
 * Worth knowing when reading a dev consent sheet: the dev host serves these two
 * pages from an older deploy, so its copy still names "www.ShubhAstro.com" and
 * carries a placeholder grievance officer and "[●] working days". Harmless for
 * testing, but the text a real user must see is the prod one — so if this ever
 * needs to be user-facing on a non-prod host, point that env at prod instead.
 *
 * `VITE_POLICY_ORIGIN` exists so a domain change (or a separate legal host) is a
 * config edit rather than a code edit. It falls back to the production origin
 * because a blank value would silently produce `/privacy-policy` — a relative
 * path that resolves against Truecaller's own app, not our site.
 */
const DEFAULT_POLICY_ORIGIN = "https://www.shubhastro.ai";

const resolvePolicyOrigin = () => {
  const configured = (import.meta.env.VITE_POLICY_ORIGIN || "").trim();
  // Must be absolute, or the links break in the ways described above.
  if (!/^https?:\/\//i.test(configured)) return DEFAULT_POLICY_ORIGIN;
  return configured.replace(/\/+$/, ""); // tolerate a trailing slash in config
};

const POLICY_ORIGIN = resolvePolicyOrigin();
export const TRUECALLER_PRIVACY_URL = `${POLICY_ORIGIN}/privacy-policy`;
export const TRUECALLER_TERMS_URL = `${POLICY_ORIGIN}/terms-and-conditions`;

/**
 * How long we wait for the backend to receive Truecaller's callback before
 * giving up and telling the user to use OTP instead.
 */
export const TRUECALLER_POLL_TIMEOUT_MS = 45000;
/** Gap between polls of the backend status endpoint. */
export const TRUECALLER_POLL_INTERVAL_MS = 1500;

/**
 * Truecaller requires the nonce to be 8–64 chars. Uses crypto when available so
 * the value is unguessable (it is the correlation id for a login).
 */
export const generateRequestNonce = () => {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // 32 chars — inside Truecaller's 8–64 limit
};

/** True on Android (the only platform Truecaller mobile-web supports). */
export const isAndroidBrowser = () => {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
};

/** True on iOS — Truecaller mobile-web is explicitly unsupported there. */
export const isIOSBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSUA = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const iOSPlatform = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  return iOSUA || iOSPlatform;
};

/**
 * Whether we should offer the Truecaller button at all.
 * Requires: the feature flag on + a configured partner key + an Android browser.
 * We do not require "app installed" (undetectable up front) — that is handled
 * gracefully after invocation via the focus check.
 */
export const isTruecallerSupported = () =>
  isTruecallerLoginEnabled() && !!TRUECALLER_PARTNER_KEY && isAndroidBrowser() && !isIOSBrowser();

/**
 * Why the button is (not) offered. There are four independent gates and the
 * button just silently vanishes when any of them fails, which is undebuggable on
 * a phone — no devtools, and the env is only read at server start so a stale
 * server looks identical to an unsupported device. LoginScreen surfaces this in
 * DEV builds only.
 *
 * @returns {"ok"|"disabled"|"no_partner_key"|"ios"|"not_android"}
 */
export const getTruecallerSupportReason = () => {
  if (!isTruecallerLoginEnabled()) return "disabled";
  if (!TRUECALLER_PARTNER_KEY) return "no_partner_key";
  if (isIOSBrowser()) return "ios";
  if (!isAndroidBrowser()) return "not_android";
  return "ok";
};

/**
 * Build the Truecaller deep link.
 *
 * Colours must be hex with `#` encoded as %23 — `encodeURIComponent` handles
 * that for us. `lang` is kept at English to match the rest of the app's login.
 */
export const buildTruecallerDeepLink = ({
  requestNonce,
  privacyUrl = TRUECALLER_PRIVACY_URL,
  termsUrl = TRUECALLER_TERMS_URL,
  ctaColor = "#F75801",
  ctaTextColor = "#FFFFFF",
  ttlMs = TRUECALLER_POLL_TIMEOUT_MS,
}) => {
  const params = {
    type: "btmsheet",
    requestNonce,
    partnerKey: TRUECALLER_PARTNER_KEY,
    partnerName: PARTNER_NAME,
    lang: "en",
    loginPrefix: "getstarted",
    loginSuffix: "loginsignup",
    ctaPrefix: "continuewith",
    ctaColor,
    ctaTextColor,
    btnShape: "round",
    skipOption: "useanothernum",
    ttl: String(ttlMs),
    ...(privacyUrl ? { privacyUrl } : {}),
    ...(termsUrl ? { termsUrl } : {}),
  };

  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `truecallersdk://truesdk/web_verify?${query}`;
};

/**
 * Open the Truecaller consent sheet.
 *
 * Resolves `{ opened: true }` when the sheet appears, `{ opened: false }` when
 * the app is not installed (the deep link is a no-op, so the document keeps
 * focus). Truecaller documents this focus check as the way to detect a missing
 * app; the backend "flow_invoked" handshake is the more reliable signal, but it
 * lands on the server, so this stays as the client-side hint.
 */
export const invokeTruecaller = (options) =>
  new Promise((resolve) => {
    const deepLink = buildTruecallerDeepLink(options);

    // The key is a credential-ish value that ends up in a shareable log file, so
    // only its shape is recorded — enough to separate "no key" from "wrong key".
    tcLog("deeplink_build", {
      partnerKeyPrefix: TRUECALLER_PARTNER_KEY.slice(0, 6),
      partnerKeyLen: TRUECALLER_PARTNER_KEY.length,
      privacyUrl: options?.privacyUrl || TRUECALLER_PRIVACY_URL,
      termsUrl: options?.termsUrl || TRUECALLER_TERMS_URL,
      ttl: String(options?.ttlMs ?? TRUECALLER_POLL_TIMEOUT_MS),
      nonceLen: String(options?.requestNonce || "").length,
      linkLen: deepLink.length,
    });

    try {
      window.location = deepLink;
    } catch (err) {
      tcLog("deeplink_threw", { message: String(err?.message || err) });
      resolve({ opened: false });
      return;
    }

    setTimeout(() => {
      // Focus lost => the Truecaller sheet took over. Focus retained => nothing
      // handled the scheme, i.e. Truecaller is not installed.
      const opened = !document.hasFocus();
      tcLog("deeplink_result", {
        opened,
        hasFocus: document.hasFocus(),
        visibility: document.visibilityState,
      });
      resolve({ opened });
    }, 600);
  });
