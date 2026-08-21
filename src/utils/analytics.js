/**
 * =========================================================
 * SHUBHASTRO ANALYTICS UTILITY
 * =========================================================
 *
 * Sends application events to:
 *
 * 1. Google Tag Manager dataLayer
 * 2. Google Analytics 4 via gtag
 *
 * GTM:
 * GTM-T5DTGXHW
 *
 * GA4:
 * G-MQBQTN9GSH
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
 * import { trackEvent } from "../utils/analytics";
 *
 * trackEvent("horoscope_viewed", {
 *   sign: "aries",
 *   time_period: "daily"
 * });
 *
 * =========================================================
 */

const IS_DEV = import.meta.env.DEV;

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION || "1.0.0";

/**
 * ---------------------------------------------------------
 * DEVICE TYPE
 * ---------------------------------------------------------
 */

const getDeviceType = () => {
  if (typeof navigator === "undefined") {
    return "desktop";
  }

  return /Mobi|Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  )
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
    if (typeof localStorage === "undefined") {
      return "anonymous";
    }

    return (
      localStorage.getItem(
        "shubhtalk_customer_id"
      ) || "anonymous"
    );
  } catch (error) {
    if (IS_DEV) {
      console.warn(
        "[Analytics] Unable to read customer ID:",
        error
      );
    }

    return "anonymous";
  }
};

/**
 * ---------------------------------------------------------
 * EVENT NAME VALIDATION
 * ---------------------------------------------------------
 */

const isValidEventName = (eventName) => {
  return (
    typeof eventName === "string" &&
    eventName.trim().length > 0
  );
};

/**
 * ---------------------------------------------------------
 * TRACK EVENT
 * ---------------------------------------------------------
 *
 * Sends event to:
 *
 * GTM dataLayer
 * +
 * Direct GA4
 *
 * Analytics errors NEVER break the application.
 *
 * ---------------------------------------------------------
 */

export const trackEvent = (
  eventName,
  properties = {}
) => {
  try {
    if (!isValidEventName(eventName)) {
      if (IS_DEV) {
        console.warn(
          "[Analytics] Invalid event name:",
          eventName
        );
      }

      return;
    }

    const customerId =
      getCustomerId();

    const payload = {
      user_id: customerId,
      timestamp: new Date().toISOString(),
      app_version: APP_VERSION,
      device_type: DEVICE_TYPE,
      ...properties
    };

    /**
     * -----------------------------------------------------
     * GOOGLE TAG MANAGER
     * -----------------------------------------------------
     */

    if (
      typeof window !== "undefined" &&
      Array.isArray(window.dataLayer)
    ) {
      window.dataLayer.push({
        event: eventName,
        ...payload
      });
    }

    /**
     * -----------------------------------------------------
     * GOOGLE ANALYTICS 4
     * -----------------------------------------------------
     */

    if (
      typeof window !== "undefined" &&
      typeof window.gtag === "function"
    ) {
      window.gtag(
        "event",
        eventName,
        payload
      );
    }

    /**
     * -----------------------------------------------------
     * DEVELOPMENT LOGGING
     * -----------------------------------------------------
     */

    if (IS_DEV) {
      console.log(
        "[Analytics]",
        eventName,
        payload
      );
    }
  } catch (error) {
    /**
     * Analytics must NEVER break the application.
     */

    if (IS_DEV) {
      console.error(
        "[Analytics] Failed to track event:",
        eventName,
        error
      );
    }
  }
};

/**
 * ---------------------------------------------------------
 * SET ANALYTICS USER
 * ---------------------------------------------------------
 *
 * Call this after successful login.
 *
 * Example:
 *
 * setAnalyticsUser(customerId);
 *
 * ---------------------------------------------------------
 */

export const setAnalyticsUser = (
  userId
) => {
  try {
    const normalizedUserId =
      userId || "anonymous";

    /**
     * GA4 user_id
     */
    if (
      typeof window !== "undefined" &&
      typeof window.gtag === "function"
    ) {
      window.gtag(
        "set",
        "user_id",
        normalizedUserId
      );
    }

    /**
     * GTM / dataLayer
     */
    if (
      typeof window !== "undefined" &&
      Array.isArray(window.dataLayer)
    ) {
      window.dataLayer.push({
        event: "analytics_user_set",
        user_id: normalizedUserId
      });
    }

    if (IS_DEV) {
      console.log(
        "[Analytics] User identified:",
        normalizedUserId
      );
    }
  } catch (error) {
    if (IS_DEV) {
      console.error(
        "[Analytics] Failed to set user:",
        error
      );
    }
  }
};

/**
 * ---------------------------------------------------------
 * CLEAR ANALYTICS USER
 * ---------------------------------------------------------
 *
 * Call this on logout.
 *
 * ---------------------------------------------------------
 */

export const clearAnalyticsUser = () => {
  try {
    /**
     * Clear GA4 user ID
     */
    if (
      typeof window !== "undefined" &&
      typeof window.gtag === "function"
    ) {
      window.gtag(
        "set",
        "user_id",
        null
      );
    }

    /**
     * Notify GTM
     */
    if (
      typeof window !== "undefined" &&
      Array.isArray(window.dataLayer)
    ) {
      window.dataLayer.push({
        event: "analytics_user_cleared"
      });
    }

    if (IS_DEV) {
      console.log(
        "[Analytics] User cleared"
      );
    }
  } catch (error) {
    if (IS_DEV) {
      console.error(
        "[Analytics] Failed to clear user:",
        error
      );
    }
  }
};