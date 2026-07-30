import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import SubscriptionModal from '../../../../component/UI/modal/SubscriptionModal/SubscriptionModal';
import { subscriptionApi, useGetSubscriptionStatusQuery } from '../../../../redux/api/subscription/subscriptionApi';
import { getSubscriptionErrorReason, SUBSCRIPTION_REASON } from '../../../../utils/subscription/featureGating';
import { trackEvent } from '../../../../utils/analytics';

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

  // The user tried to buy a plan from the modal but had insufficient wallet
  // balance. Close the modal, route to recharge (with a return URL), and
  // resolve the pending flow as 'recharge' so callers skip their own navigation.
  const handleModalInsufficientBalance = useCallback(() => {
    // The SubscriptionModal performs the /recharge navigation itself. Here we
    // just close the popup and resolve the pending flow as 'recharge' so the
    // caller skips its own "go back" navigation (which would clobber it).
    setShowSubscriptionModal(false);
    purchasedRef.current = false;
    const resolve = modalResolveRef.current;
    modalResolveRef.current = null;
    if (resolve) resolve('recharge');
  }, []);

  // On a successful purchase, just mark it as purchased. The success modal stays
  // open until the user explicitly closes it via the Continue button.
  const handleModalPurchased = useCallback(() => {
    purchasedRef.current = true;
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

      // Always show the plans popup first. We do NOT redirect to recharge here —
      // the balance is only checked when the user actually picks a plan. If that
      // purchase fails with insufficient balance, the modal's
      // `onInsufficientBalance` handler routes the user to recharge.
      toast.dismiss(gId);
      if (reason === SUBSCRIPTION_REASON.PREMIUM_REQUIRED || reason === SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE) {
        openSubscriptionModal('basic');
      } else {
        openSubscriptionModal('extended', extractExtendedPlans(result));
      }

      // Wait for the user. On purchase, loop to retry generation; otherwise stop.
      const outcome = await waitForModalOutcome();
      if (outcome === 'recharge') {
        trackEvent('shubh_ai_payment_failed', { feature_name: featureName, reason: SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE });
        return { blocked: true, reason: SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE, redirectedToRecharge: true };
      }
      if (outcome !== 'purchased') {
        trackEvent('shubh_ai_payment_failed', { feature_name: featureName, reason });
        return { blocked: true, reason };
      }
      trackEvent('shubh_ai_extended_plan_purchased', { feature_name: featureName, reason });
    }
    return { blocked: true, reason: 'RETRY_LIMIT' };
  }, [featureName, openSubscriptionModal, waitForModalOutcome, dispatch]);

  const subscriptionModal = (
    <SubscriptionModal
      isOpen={showSubscriptionModal}
      variant={subscriptionModalVariant}
      plans={subscriptionModalVariant === 'extended' ? extendedPlans : undefined}
      onClose={handleModalClose}
      onPurchased={handleModalPurchased}
      onInsufficientBalance={handleModalInsufficientBalance}
      onSelectPlan={handleModalClose}
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
