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
