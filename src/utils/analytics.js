/**
 * Analytics utility — pushes events to GTM dataLayer
 *
 * GTM (GTM-T5DTGXHW) is already configured in index.html.
 * Events are pushed via dataLayer and routed to GA4/other
 * destinations through GTM triggers.
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
 * Track an analytics event via GTM dataLayer
 * @param {string} eventName - snake_case event name
 * @param {Record<string, unknown>} [properties] - event-specific properties
 */
export const trackEvent = (eventName, properties = {}) => {
  const dataLayer = window.dataLayer;

  if (!Array.isArray(dataLayer)) {
    console.warn("[Analytics] dataLayer not available, skipping:", eventName);
    return;
  }

  const payload = {
    event: eventName,
    user_id: localStorage.getItem("shubhtalk_customer_id") || "anonymous",
    timestamp: new Date().toISOString(),
    app_version: APP_VERSION,
    device_type: DEVICE_TYPE,
    ...properties,
  };

  dataLayer.push(payload);
  console.log("[Analytics]", eventName, payload);
};
