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
 */

const IS_DEV = import.meta.env.DEV;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const DEVICE_TYPE = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";

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

  // GTM
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...payload,
    });
  }

  // Direct GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
    console.log("Gtag event called");
  }

  console.log("[Analytics]", eventName, payload);
};
