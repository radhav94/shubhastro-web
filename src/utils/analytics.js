/**
 * Analytics utility — pushes events to both GTM dataLayer and direct GA4 gtag.
 *
 * GTM (GTM-T5DTGXHW) and gtag (G-MQBQTN9GSH) are configured in index.html.
 * Events are pushed to both for redundancy.
 *
 * All events automatically include base context:
 * - user_id: customer ID from localStorage
 * - timestamp: ISO string
 * - app_version: from env
 * - device_type: mobile | desktop (cached)
 *
 * Usage:
 *   import { trackEvent } from '../utils/analytics';
 *   trackEvent("horoscope_viewed", { sign: "aries", time_period: "daily" });
 *
 * Every call is also recorded to an on-device log (see analyticsLog.js), together
 * with which of the two sinks accepted it. Read it from the console with
 * `__gtmLog()`, or download it with `__gtmLog.download()`.
 */

import {
  installAnalyticsLogConsoleApi,
  logAnalyticsEvent,
} from "./analyticsLog";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const DEVICE_TYPE = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";

installAnalyticsLogConsoleApi();

/**
 * Track an analytics event via GTM dataLayer + direct GA4 gtag
 * @param {string} eventName - snake_case event name
 * @param {Record<string, unknown>} [properties] - event-specific properties
 */
export const trackEvent = (eventName, properties = {}) => {
  const payload = {
    user_id: localStorage.getItem("shubhtalk_customer_id") || "anonymous",
    timestamp: new Date().toISOString(),
    app_version: APP_VERSION,
    device_type: DEVICE_TYPE,
    ...properties,
  };

  /*
    Both sinks are optional at runtime — the GTM container may not have loaded
    yet, or an extension may have stripped it. A push in that state is lost, and
    GTM's own Preview mode can't show you what never arrived. Record the outcome
    per sink so "the event didn't fire" can be told apart from "the event fired
    but nothing was listening".
  */
  const delivered = { dataLayer: false, gtag: false };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
    delivered.dataLayer = true;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
    delivered.gtag = true;
  }

  /*
    Nothing is printed to the console. This used to log two lines per event, on
    every environment — on screens that fire a dozen events that buried anything
    else in there, including real errors.

    The persisted log replaces it: read it with `__gtmLog()` on demand, or use the
    on-screen panel (AnalyticsLogPanel) to download it as a file.
  */
  logAnalyticsEvent(eventName, payload, delivered);
};
