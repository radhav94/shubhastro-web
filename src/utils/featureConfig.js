/**
 * Centralized feature flags configuration.
 * Toggle features on/off via environment variables in .env-cmdrc
 *
 * Usage:
 *   import { isShubhMallEnabled } from "../utils/featureConfig";
 *   if (isShubhMallEnabled()) { ... }
 */

/**
 * Check if ShubhMall (e-commerce) feature is enabled.
 * Controlled by VITE_SHUBH_MALL_ENABLED env variable.
 * Defaults to false if not set, null, or blank.
 */
export const isShubhMallEnabled = () => {
  const value = import.meta.env.VITE_SHUBH_MALL_ENABLED;
  // Default to false if not set, null, undefined, or blank
  if (!value || value.trim() === "") return false;
  return value === "true";
};

/**
 * Check if Truecaller one-tap login is enabled.
 * Controlled by VITE_TRUECALLER_ENABLED env variable.
 *
 * Defaults to false when unset or blank, matching isShubhMallEnabled() — an
 * unconfigured environment should not start offering a login method whose
 * server-side callback may not exist there. Turning this off hides the button
 * entirely; the OTP flow is untouched either way.
 */
export const isTruecallerLoginEnabled = () => {
  const value = import.meta.env.VITE_TRUECALLER_ENABLED;
  if (!value || value.trim() === "") return false;
  return value === "true";
};

/**
 * List of route paths that belong to ShubhMall.
 * Used to block navigation when the feature is disabled.
 */
export const SHUBH_MALL_PATHS = [
  "/shubh-mall",
  "/shop",
  "/viewcart",
  "/checkout",
  "/product-details",
  "/category",
  "/categories",
  "/purpose",
  "/booking-success",
  "/mall-order",
  "/consultant/payment",
];

/**
 * Check if a given path belongs to ShubhMall routes.
 */
export const isShubhMallRoute = (path) => {
  if (!path) return false;
  return SHUBH_MALL_PATHS.some(
    (mallPath) => path === mallPath || path.startsWith(mallPath + "/") || path.startsWith(mallPath + "?")
  );
};
