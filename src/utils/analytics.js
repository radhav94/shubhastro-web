/**
 * =========================================================
 * SHUBHASTRO ANALYTICS UTILITY
 * =========================================================
 *
 * Sends application events to:
 *
 * 1. Google Tag Manager dataLayer  (GTM-T5DTGXHW)
 * 2. Google Analytics 4 via gtag   (G-MQBQTN9GSH)
 *
 * Both are configured in index.html. Events go to both for redundancy.
 *
 * Every event automatically contains:
 *
 * - user_id
 * - timestamp
 * - app_version
 * - device_type
 *
 * Example:
 *
 *   import { trackEvent } from "../utils/analytics";
 *
 *   trackEvent("horoscope_viewed", { sign: "aries", time_period: "daily" });
 *
 * Nothing is printed per event. Every call is recorded to an on-device log
 * instead (see analyticsLog.js), together with which of the two sinks accepted
 * it. Read it from the console with `__gtmLog()`, download it with
 * `__gtmLog.download()`, or use the on-screen panel (AnalyticsLogPanel).
 *
 * Analytics must never break the application: everything below is wrapped so a
 * failure here cannot take a screen down with it.
 *
 * =========================================================
 */

import {
  installAnalyticsLogConsoleApi,
  logAnalyticsEvent,
} from "./analyticsLog";

const IS_DEV = import.meta.env.DEV;

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

/**
 * ---------------------------------------------------------
 * DEVICE TYPE
 * ---------------------------------------------------------
 */

const getDeviceType = () => {
  if (typeof navigator === "undefined") return "desktop";

  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? "mobile"
    : "desktop";
};

const DEVICE_TYPE = getDeviceType();

/**
 * ---------------------------------------------------------
 * CUSTOMER ID
 * ---------------------------------------------------------
 */

const getCustomerId = () => {
  try {
    if (typeof localStorage === "undefined") return "anonymous";
    return localStorage.getItem("shubhtalk_customer_id") || "anonymous";
  } catch (error) {
    // Safari in private mode throws on localStorage access.
    if (IS_DEV) console.warn("[Analytics] Unable to read customer ID:", error);
    return "anonymous";
  }
};

const isValidEventName = (eventName) =>
  typeof eventName === "string" && eventName.trim().length > 0;

installAnalyticsLogConsoleApi();

/**
 * Track an analytics event via GTM dataLayer + direct GA4 gtag.
 *
 * @param {string} eventName - snake_case event name
 * @param {Record<string, unknown>} [properties] - event-specific properties
 */
export const trackEvent = (eventName, properties = {}) => {
  try {
    if (!isValidEventName(eventName)) {
      if (IS_DEV) console.warn("[Analytics] Invalid event name:", eventName);
      return;
    }

    const payload = {
      user_id: getCustomerId(),
      timestamp: new Date().toISOString(),
      app_version: APP_VERSION,
      device_type: DEVICE_TYPE,
      ...properties,
    };

    /*
      Both sinks are optional at runtime — the GTM container may not have loaded
      yet, or an extension may have stripped it. A push in that state is lost,
      and GTM's own Preview mode cannot show you what never arrived. Record the
      outcome per sink so "the event didn't fire" can be told apart from "the
      event fired but nothing was listening".
    */
    const delivered = { dataLayer: false, gtag: false };

    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
      delivered.dataLayer = true;
    }

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      delivered.gtag = true;
    }

    logAnalyticsEvent(eventName, payload, delivered);
  } catch (error) {
    if (IS_DEV) {
      console.error("[Analytics] Failed to track event:", eventName, error);
    }
  }
};

/**
 * Identify the current user to GA4 and GTM. Call after a successful login.
 *
 * @param {string} userId - customer ID, or falsy for anonymous
 */
export const setAnalyticsUser = (userId) => {
  try {
    const normalizedUserId = userId || "anonymous";

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("set", "user_id", normalizedUserId);
    }

    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: "analytics_user_set",
        user_id: normalizedUserId,
      });
    }

    // Routed through the same log as everything else, so identify/clear calls
    // show up in `__gtmLog()` next to the events they scope.
    logAnalyticsEvent(
      "analytics_user_set",
      { user_id: normalizedUserId },
      {
        dataLayer:
          typeof window !== "undefined" && Array.isArray(window.dataLayer),
        gtag:
          typeof window !== "undefined" && typeof window.gtag === "function",
      }
    );
  } catch (error) {
    if (IS_DEV) console.error("[Analytics] Failed to set user:", error);
  }
};

/** Drop the identified user. Call on logout. */
export const clearAnalyticsUser = () => {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("set", "user_id", null);
    }

    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: "analytics_user_cleared" });
    }

    logAnalyticsEvent(
      "analytics_user_cleared",
      {},
      {
        dataLayer:
          typeof window !== "undefined" && Array.isArray(window.dataLayer),
        gtag:
          typeof window !== "undefined" && typeof window.gtag === "function",
      }
    );
  } catch (error) {
    if (IS_DEV) console.error("[Analytics] Failed to clear user:", error);
  }
};
