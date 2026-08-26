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
 * The signup bonus figure shown to visitors who have not registered yet
 * ("₹250 RECHARGE FOR NEW SIGN UPS", "Claim ₹250 Now", and so on).
 *
 * Controlled by VITE_SIGNUP_BONUS_AMOUNT so the offer can be changed per
 * environment without a code edit.
 *
 * IMPORTANT: this only changes what the copy *promises*. The bonus itself is
 * credited server-side during registration, so this must be changed together
 * with the backend's value — set it to 100 while the backend still credits 250
 * and every pre-signup screen understates the offer (or overstates it the other
 * way round, which is worse).
 *
 * Nothing after signup uses this: WelcomeBonusModal and the header both read the
 * real wallet balance, so what a user is told they received is always the amount
 * actually credited.
 *
 * Vite inlines env vars as strings, so this is parsed rather than used directly.
 *
 * Setting it to "0" is meaningful: it means there is no signup offer at all, and
 * the screens drop the offer artwork and fall back to neutral copy rather than
 * advertising "₹0". Only a missing, blank, non-numeric or negative value falls
 * back to 250 — a deliberate 0 is not treated as a mistake.
 *
 * @returns {number} 0 when the offer is switched off
 */
export const getSignupBonusAmount = () => {
  const raw = import.meta.env.VITE_SIGNUP_BONUS_AMOUNT;
  const text = String(raw ?? "").trim();
  if (text === "") return 250;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) return 250;
  return parsed;
};

/**
 * Whether there is a signup offer to advertise at all.
 * Use this to decide between offer copy and neutral copy.
 *
 * @returns {boolean}
 */
export const isSignupBonusEnabled = () => getSignupBonusAmount() > 0;

/**
 * The figure formatted for display, e.g. "₹250". Empty string when the offer is
 * off, so a caller that forgets to check cannot render "₹0".
 *
 * @returns {string}
 */
export const getSignupBonusLabel = () =>
  isSignupBonusEnabled() ? `₹${getSignupBonusAmount()}` : "";

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
