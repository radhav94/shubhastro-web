import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import SubscriptionModal from '../../../../component/UI/modal/SubscriptionModal/SubscriptionModal';
import { subscriptionApi, useGetSubscriptionStatusQuery, useLazyGetSubscriptionStatusQuery } from '../../../../redux/api/subscription/subscriptionApi';
import { getSubscriptionErrorReason, SUBSCRIPTION_REASON } from '../../../../utils/subscription/featureGating';
import { trackEvent } from '../../../../utils/analytics';
import { SUBSCRIPTION_EVENTS, trackSubscriptionEvent } from '../../../../utils/subscriptionAnalytics';

/**
 * Extract the extended plan(s) returned inline in a generate/report response.
 * The backend includes `data.extendedPlans` (array) and/or
 * `data.recommendedExtendedPlan` (single) when EXTENDED_PLAN_REQUIRED.
 */
export const extractExtendedPlans = (result) => {
  const d = result?.data || {};
  if (Array.isArray(d.extendedPlans) && d.extendedPlans.length > 0) return d.extendedPlans;
  if (d.recommendedExtendedPlan) return [d.recommendedExtendedPlan];
  return null;
};

/**
 * Reusable entitlement gate for AI WOW report GENERATION.
 *
 * The backend enforces subscription/quota at report generate-time. This hook
 * wraps a generate call and, when the backend blocks it, opens the appropriate
 * plans popup (extended plans come inline in the response — no plans-API call).
 * It then WAITS for the user to finish with the popup: if they purchase, the
 * generation is retried automatically so the flow proceeds; if they cancel, it
 * resolves as blocked.
 *
 * Usage:
 *   const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName });
 *   const result = await runWithEntitlement(() => analyzeAura(imageData, signal));
 *   if (result.blocked) { ...stop / reset progress... }
 *   else if (result.success) { ...proceed... }
 *   else { ...show result.error... }
 *   // render {subscriptionModal} somewhere in JSX
 */
export const useAIWowSubscriptionGate = ({ featureName = 'ai-report' } = {}) => {
  const dispatch = useDispatch();
  const customerToken = typeof window !== 'undefined' ? localStorage.getItem('shubhtalk_customer_token') : null;
  const { data: subscriptionStatus } = useGetSubscriptionStatusQuery(undefined, { skip: !customerToken });
  const hasActiveSubscription = !!subscriptionStatus?.data?.hasActiveSubscription;
  // Lazy fetch so we can read a FRESH subscription status on demand — needed
  // right after a guest registers (the cached query is still skipped/stale at
  // that moment, so we must fetch with the newly-available token).
  const [triggerSubStatus] = useLazyGetSubscriptionStatusQuery();

  // #7 SUBSCRIPTION_STATUS_CHECKED — fire when the status API resolves. Deduped
  // per distinct (has_active_subscription, remaining_quota) so re-renders /
  // cache reads don't spam the event.
  const statusFiredRef = useRef(null);
  useEffect(() => {
    if (!subscriptionStatus?.data) return;
    const remainingQuota =
      subscriptionStatus.data.remainingQuota ??
      subscriptionStatus.data.subscription?.remainingQuota ??
      null;
    const signature = `${hasActiveSubscription}|${remainingQuota}`;
    if (statusFiredRef.current === signature) return;
    statusFiredRef.current = signature;
    trackSubscriptionEvent(SUBSCRIPTION_EVENTS.STATUS_CHECKED, {
      has_active_subscription: hasActiveSubscription,
      remaining_quota: remainingQuota,
    });
  }, [subscriptionStatus, hasActiveSubscription]);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalVariant, setSubscriptionModalVariant] = useState('basic');
  const [extendedPlans, setExtendedPlans] = useState(null);

  // Resolves the promise returned by `waitForModalOutcome` with 'purchased'
  // or 'cancelled'. `purchasedRef` records a successful purchase so that
  // closing the success view resolves as 'purchased'.
  const modalResolveRef = useRef(null);
  const purchasedRef = useRef(false);

  const openSubscriptionModal = useCallback((mode = 'basic', plans = null) => {
    setSubscriptionModalVariant(mode);
    setExtendedPlans(Array.isArray(plans) && plans.length > 0 ? plans : null);
    purchasedRef.current = false;
    setShowSubscriptionModal(true);
  }, []);

  const waitForModalOutcome = useCallback(
    () => new Promise((resolve) => {
      modalResolveRef.current = resolve;
    }),
    []
  );

  const handleModalClose = useCallback(() => {
    setShowSubscriptionModal(false);
    const outcome = purchasedRef.current ? 'purchased' : 'cancelled';
    purchasedRef.current = false;
    const resolve = modalResolveRef.current;
    modalResolveRef.current = null;
    if (resolve) resolve(outcome);
  }, []);

  /*
    There is deliberately no insufficient-balance handler here any more.

    It used to close this popup and resolve the flow as 'recharge', because
    SubscriptionModal navigated away to /recharge. The modal now opens the recharge
    sheet over itself and retries the same plan once the wallet is funded, so an
    empty wallet is no longer an exit from this flow — it is a step inside it.
    Closing the popup at that point would have cancelled the purchase the user was
    in the middle of making.

    The outcome is therefore whatever the user ends up doing: 'purchased' if the
    retry succeeds, or a plain dismissal if they back out.
  */

  // On a successful purchase, just mark it as purchased. The success modal stays
  // open until the user explicitly closes it via the Continue button.
  const handleModalPurchased = useCallback(() => {
    purchasedRef.current = true;
  }, []);

  // The user picked a zero-price plan. SubscriptionModal runs no purchase for
  // these, so nothing about the user's entitlement changes and retrying the
  // generate call would just be blocked again.
  //
  // This used to be wired straight to `handleModalClose`, which closed the popup
  // and resolved the pending flow as 'cancelled' — so the tap produced no
  // report, no navigation and no message at all. Resolve it distinctly instead
  // so the caller can explain what happened.
  const handleModalFreePlanSelected = useCallback(() => {
    setShowSubscriptionModal(false);
    purchasedRef.current = false;
    const resolve = modalResolveRef.current;
    modalResolveRef.current = null;
    if (resolve) resolve('free-plan');
  }, []);

  /**
   * Runs a generate call and handles entitlement blocks. When blocked, it opens
   * the plans popup and waits for the user; on purchase it retries generation.
   *
   * @param {() => Promise<{success:boolean, data?:any, error?:object}>} generateFn
   * @returns {Promise<
   *   { success:true, data:any } |         // proceed
   *   { success:false, error:object } |    // non-entitlement failure -> show message
   *   { blocked:true, reason:string }      // user cancelled -> stop
   * >}
   */
  const runWithEntitlement = useCallback(async (generateFn) => {
    const gId = `${String(featureName).replace(/\s+/g, '-').toLowerCase()}-generate`;

    // ── Proactive subscription check (BEFORE any generation runs) ──────────
    // Product rule: a report may only be generated when the user has an active
    // subscription. This is critical for the guest flow — after a guest fills
    // the form and registers we must NOT auto-fire the analyze API. Instead,
    // check the (freshly fetched) subscription status first; if there's no
    // active plan, show the plans popup and only proceed once the user has
    // purchased. On cancel we stop without ever calling the generate API.
    try {
      const statusRes = await triggerSubStatus(undefined, false).unwrap();
      const activePlan = !!statusRes?.data?.hasActiveSubscription;
      if (!activePlan) {
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.STATUS_CHECKED, {
          has_active_subscription: false,
          remaining_quota:
            statusRes?.data?.remainingQuota ??
            statusRes?.data?.subscription?.remainingQuota ??
            null,
        });
        toast.dismiss(gId);
        openSubscriptionModal('basic');
        const outcome = await waitForModalOutcome();
        if (outcome !== 'purchased') {
          trackEvent('shubh_ai_payment_failed', { feature_name: featureName, reason: SUBSCRIPTION_REASON.PREMIUM_REQUIRED });
          return { blocked: true, reason: SUBSCRIPTION_REASON.PREMIUM_REQUIRED };
        }
        // Purchased — refresh cached status, then fall through to generate.
        dispatch(subscriptionApi.util.invalidateTags(['SubscriptionStatus']));
      }
    } catch {
      // Status check failed (network etc.) — fall back to the server-side
      // entitlement gate in the loop below rather than blocking the user.
    }

    // Cap retries to avoid any pathological loop if the backend keeps blocking.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await generateFn();
      const reason = result?.success === false ? getSubscriptionErrorReason(result) : null;

      // Success OR a non-entitlement failure — let the caller handle it.
      if (!reason) {
        // A successful generation consumes a quota/generation on the backend.
        // Invalidate the cached subscription status so the "generations left"
        // shown on My Account refreshes without a manual page reload.
        if (result?.success !== false) {
          dispatch(subscriptionApi.util.invalidateTags(['SubscriptionStatus']));
        }
        return result;
      }

      // Always show the plans popup first. The balance is only checked when the
      // user actually picks a plan, and an empty wallet is handled inside the
      // modal (it opens the recharge sheet and retries the same plan), so nothing
      // here needs to know about it.
      toast.dismiss(gId);
      if (reason === SUBSCRIPTION_REASON.PREMIUM_REQUIRED || reason === SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE) {
        openSubscriptionModal('basic');
      } else {
        openSubscriptionModal('extended', extractExtendedPlans(result));
      }

      // Wait for the user. On purchase, loop to retry generation; otherwise stop.
      const outcome = await waitForModalOutcome();
      if (outcome === 'free-plan') {
        // Don't retry — the free plan grants nothing new. Say so rather than
        // closing the popup and appearing to do nothing.
        toast.error('That plan does not include this report. Pick a paid plan to continue.');
        trackEvent('shubh_ai_payment_failed', { feature_name: featureName, reason });
        return { blocked: true, reason };
      }
      if (outcome !== 'purchased') {
        trackEvent('shubh_ai_payment_failed', { feature_name: featureName, reason });
        return { blocked: true, reason };
      }
      trackEvent('shubh_ai_extended_plan_purchased', { feature_name: featureName, reason });
    }
    return { blocked: true, reason: 'RETRY_LIMIT' };
  }, [featureName, openSubscriptionModal, waitForModalOutcome, dispatch, triggerSubStatus]);


  const subscriptionModal = (
    <SubscriptionModal
      isOpen={showSubscriptionModal}
      variant={subscriptionModalVariant}
      featureName={featureName}
      plans={subscriptionModalVariant === 'extended' ? extendedPlans : undefined}
      onClose={handleModalClose}
      onPurchased={handleModalPurchased}
      onSelectPlan={handleModalFreePlanSelected}
    />
  );

  return {
    hasActiveSubscription,
    runWithEntitlement,
    openSubscriptionModal,
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionModalVariant,
    subscriptionModal,
  };
};

export default useAIWowSubscriptionGate;
