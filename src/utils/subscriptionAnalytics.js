/**
 * Subscription analytics — GTM/GA4 event names + a thin wrapper around the
 * shared `trackEvent` (which already attaches user_id, timestamp, device_type,
 * app_version and pushes to the GTM dataLayer + gtag).
 *
 * Event catalogue (properties beyond the auto-added user_id):
 *  1. SUBSCRIPTION_PAYWALL_SHOWN        feature_key, plan_type
 *  2. SUBSCRIPTION_PLANS_LOADED         plans_count, plan_type
 *  3. SUBSCRIPTION_PLAN_SELECTED        plan_code, plan_name, plan_price, plan_type
 *  4. SUBSCRIPTION_PURCHASE_SUCCESS     plan_code, amount
 *  5. SUBSCRIPTION_PURCHASE_FAILED      plan_code, error_reason
 *  6. SUBSCRIPTION_PAYWALL_DISMISSED    feature_key, plan_type
 *  7. SUBSCRIPTION_STATUS_CHECKED       has_active_subscription, remaining_quota
 *  8. SUBSCRIPTION_FREE_PLAN_SELECTED   feature_key
 *  9. SUBSCRIPTION_INSUFFICIENT_BALANCE plan_code
 * 10. SUBSCRIPTION_CANCELLED            subscription_id
 */
import { trackEvent } from './analytics';

export const SUBSCRIPTION_EVENTS = {
  PAYWALL_SHOWN: 'SUBSCRIPTION_PAYWALL_SHOWN',
  PLANS_LOADED: 'SUBSCRIPTION_PLANS_LOADED',
  PLAN_SELECTED: 'SUBSCRIPTION_PLAN_SELECTED',
  PURCHASE_SUCCESS: 'SUBSCRIPTION_PURCHASE_SUCCESS',
  PURCHASE_FAILED: 'SUBSCRIPTION_PURCHASE_FAILED',
  PAYWALL_DISMISSED: 'SUBSCRIPTION_PAYWALL_DISMISSED',
  STATUS_CHECKED: 'SUBSCRIPTION_STATUS_CHECKED',
  FREE_PLAN_SELECTED: 'SUBSCRIPTION_FREE_PLAN_SELECTED',
  INSUFFICIENT_BALANCE: 'SUBSCRIPTION_INSUFFICIENT_BALANCE',
  CANCELLED: 'SUBSCRIPTION_CANCELLED',
};

/**
 * Fire a subscription analytics event.
 * @param {string} eventName - one of SUBSCRIPTION_EVENTS
 * @param {Record<string, unknown>} [properties]
 */
export const trackSubscriptionEvent = (eventName, properties = {}) => {
  // Drop undefined/null props so GTM tags don't receive empty values.
  const clean = {};
  Object.entries(properties).forEach(([k, v]) => {
    if (v !== undefined && v !== null) clean[k] = v;
  });
  trackEvent(eventName, clean);
};
