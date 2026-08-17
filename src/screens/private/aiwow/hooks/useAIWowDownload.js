import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useGetChargesQuery, useDownloadReportPdfMutation, useGetAiHistoryQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { useWalletBalance } from '../../wallet/useWalletBalance';
import { trackEvent } from '../../../../utils/analytics';
import { downloadFile } from '../../../../utils/helper/downloadFile';
import { useGetSubscriptionStatusQuery } from '../../../../redux/api/subscription/subscriptionApi';
import { getSubscriptionErrorReason, SUBSCRIPTION_REASON } from '../../../../utils/subscription/featureGating';
import { extractExtendedPlans } from './useAIWowSubscriptionGate';

/**
 * Extracts the history ID from a result object, checking multiple possible locations.
 */
const extractHistoryId = (result) =>
  result?.historyId || result?._id || result?.id ||
  result?.data?.historyId || result?.data?._id || result?.data?.id || null;

/**
/**
 * Finds the matching download charge from the charges API response by feature.
 * Response shape: { data: [{ title, list: [{ title, slug, amount, ... }] }] }
 */
export const findChargeAmount = (charges, featureName) => {
  if (!Array.isArray(charges) || !featureName) return null;
  const normalized = featureName.trim().toLowerCase();
  const exactSlug = normalized.replace(/\s+/g, '-') + '-report';
  const keyword = normalized.split(/\s+/)[0];
  for (const section of charges) {
    if (!Array.isArray(section?.list)) continue;
    const exactMatch = section.list.find((c) => c?.slug?.toLowerCase() === exactSlug);
    if (exactMatch) return exactMatch.amount ?? exactMatch.pdfDownloadCharge ?? 0;
    if (keyword) {
      const keywordMatch = section.list.find(
        (c) => c?.slug?.toLowerCase()?.includes(keyword) || c?.title?.toLowerCase()?.includes(keyword)
      );
      if (keywordMatch) return keywordMatch.amount ?? keywordMatch.pdfDownloadCharge ?? 0;
    }
  }
  return null;
};

/**
 * Handles an entitlement block reason from the report/PDF endpoint (thrown error
 * or a 200 { success:false } body). Opens the subscription/extended modal via
 * onUpsell for premium/extended reasons; toasts for wallet/unknown failures.
 */
const handleReportBlock = (reason, { id, featureName, onUpsell, extendedPlans }) => {
  if (reason === SUBSCRIPTION_REASON.PREMIUM_REQUIRED) {
    toast.dismiss(id);
    if (onUpsell) onUpsell('basic');
  } else if (
    reason === SUBSCRIPTION_REASON.EXTENDED_PLAN_REQUIRED ||
    reason === SUBSCRIPTION_REASON.EXTENDED_PLAN_EXHAUSTED
  ) {
    // Show the extended popup using the plans returned inline in the response.
    toast.dismiss(id);
    if (onUpsell) onUpsell('extended', extendedPlans);
  } else if (reason === SUBSCRIPTION_REASON.INSUFFICIENT_WALLET_BALANCE) {
    toast.error('Insufficient wallet balance. Please recharge.', { id });
  } else {
    toast.error('Failed to download PDF', { id });
  }
  trackEvent('shubh_ai_payment_failed', { feature_name: featureName, reason: reason || 'download_failed' });
};

/**
 * Shared hook for AI WOW result page download logic.
 *
 * Consolidates: PDF path resolution, download cost lookup, wallet refresh,
 * history query, and all download handlers into a single reusable hook.
 *
 * @param {Object} options
 * @param {Object|null} options.resultData - The analysis result object from Redux or location state
 * @param {string} [options.toastId] - Unique toast ID for download notifications
 * @returns {Object} Download state and handlers
 */
export const useAIWowDownload = ({ resultData, toastId }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadedPdfUrl, setDownloadedPdfUrl] = useState(null);

  // Shared queries — RTK Query deduplicates identical args across components
  const [downloadReportPdf] = useDownloadReportPdfMutation();
  const { balance: walletBalance, refreshWallet } = useWalletBalance();

  const customerToken = typeof window !== 'undefined' ? localStorage.getItem('shubhtalk_customer_token') : null;
  const { data: subscriptionStatus } = useGetSubscriptionStatusQuery(undefined, { skip: !customerToken });
  const hasActiveSubscription = !!subscriptionStatus?.data?.hasActiveSubscription;

  // Always fetch charges: every AI-Wow report download shows the payment popup
  // and charges on the first download (even for subscribers), per product
  // requirement. Re-downloading the same generated report stays free.
  const { data: chargesData } = useGetChargesQuery(undefined);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalVariant, setSubscriptionModalVariant] = useState('basic');
  const [extendedPlans, setExtendedPlans] = useState(null);
  const openSubscriptionModal = useCallback((mode = 'basic', plans = null) => {
    setSubscriptionModalVariant(mode);
    setExtendedPlans(Array.isArray(plans) && plans.length > 0 ? plans : null);
    setShowSubscriptionModal(true);
  }, []);
  const handleSubscriptionInsufficientBalance = useCallback(() => {
    setShowSubscriptionModal(false);
  }, []);

  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const kundliId = selectedProfile?._id || selectedProfile?.id || '';
  const { data: historyData } = useGetAiHistoryQuery(
    { kundliId, page: 1, limit: 10 },
    { skip: !kundliId }
  );

  const historyId = useMemo(() => extractHistoryId(resultData), [resultData]);

  // Reset cached PDF URL when the underlying result changes (e.g. profile switch)
  const prevHistoryIdRef = useRef(historyId);
  useEffect(() => {
    if (prevHistoryIdRef.current !== historyId) {
      setDownloadedPdfUrl(null);
      prevHistoryIdRef.current = historyId;
    }
  }, [historyId]);

  const historyItem = useMemo(
    () => historyData?.data?.history?.find((h) => h._id === historyId || h.featureId === historyId) || null,
    [historyData, historyId]
  );

  // Memoized PDF path resolution
  const existingPdfUrl = useMemo(() => {
    if (downloadedPdfUrl) return downloadedPdfUrl;
    const historyPdf = historyItem?.pdfPath;
    if (typeof historyPdf === 'string' && historyPdf.startsWith('http')) return historyPdf;
    if (typeof resultData?.pdfPath === 'string' && resultData.pdfPath.startsWith('http')) return resultData.pdfPath;
    if (typeof resultData?.data?.pdfPath === 'string' && resultData.data.pdfPath.startsWith('http')) return resultData.data.pdfPath;
    return null;
  }, [downloadedPdfUrl, historyItem, resultData]);

  const isAlreadyDownloaded = !!existingPdfUrl;

  // Resolve featureName dynamically from resultData or history item
  const featureName = resultData?.featureName || resultData?.data?.featureName || historyItem?.featureName || 'ai-report';

  // Download cost — an already-downloaded report (same generation) is free;
  // otherwise show the charge from the charges API. The first download of every
  // freshly generated report is charged, regardless of subscription.
  const downloadPrice = useMemo(() => {
    if (isAlreadyDownloaded) return 0;
    const charges = chargesData?.data;
    if (!charges) return null;
    return findChargeAmount(charges, featureName);
  }, [isAlreadyDownloaded, chargesData, featureName]);

  const id = toastId || `${featureName.replace(/\s+/g, '-').toLowerCase()}-pdf`;
  const fileName = useMemo(() => {
    return `${featureName.replace(/\s+/g, '-')}.pdf`;
  }, [featureName]);

  const handleDirectDownload = useCallback(async (url) => {
    setIsDownloading(true);
    try {
      toast.loading('Downloading PDF...', { id });
      /*
       * downloadFile rather than a hand-rolled <a download> click. Facebook,
       * Instagram and WeChat webviews silently ignore that click, and the old
       * code showed "PDF downloaded!" unconditionally — so a visitor arriving
       * from an Instagram link was told the report had saved when nothing had.
       * The helper falls back to opening the URL and reports what happened.
       */
      const outcome = await downloadFile(url, fileName);
      // Delay the toast to let iOS handle the download trigger without swallowing it
      setTimeout(() => {
        toast.dismiss(id);
        if (outcome === 'downloaded') {
          toast.success('PDF downloaded!', { id: `${id}-success`, duration: 3000 });
        } else if (outcome === 'opened') {
          toast.success('PDF opened in a new tab. Use your browser menu to save it.', {
            id: `${id}-success`,
            duration: 5000,
          });
        } else {
          toast.error('Failed to download PDF', { id: `${id}-success`, duration: 4000 });
        }
      }, 600);
    } catch {
      toast.error('Failed to download PDF', { id });
    } finally {
      setIsDownloading(false);
    }
  }, [id, fileName]);

  const handleConfirmDownload = useCallback(async (language) => {
    if (!historyId) {
      toast.error('PDF not available for this report');
      return;
    }
    setIsDownloading(true);
    try {
      toast.loading('Downloading PDF...', { id });
      let result;
      let reason = null;
      try {
        result = await downloadReportPdf({ historyId, language }).unwrap();
        if (result?.success === false) reason = getSubscriptionErrorReason(result);
      } catch (err) {
        reason = getSubscriptionErrorReason(err);
        result = err?.data || err;
        if (!reason) {
          toast.error('Failed to download PDF', { id });
          return;
        }
      }

      // Success — download the PDF.
      if (!reason) {
        const pdfUrl = result?.data?.pdfUrl;
        if (!pdfUrl) {
          toast.error('Failed to download PDF', { id });
          return;
        }
        /*
         * Same in-app-browser problem as handleDirectDownload, but with money
         * involved: the wallet has already been charged by this point, so
         * claiming "Payment Successful! PDF downloaded." when the webview
         * dropped the <a download> click meant the visitor paid and received
         * nothing, with no hint that anything was wrong. `downloadedPdfUrl` is
         * still recorded below, which makes the retry free — so the honest
         * message can point at that.
         */
        const outcome = await downloadFile(pdfUrl, fileName);
        // Delay the toast to let iOS handle the download trigger without swallowing it
        setTimeout(() => {
          toast.dismiss(id);
          if (outcome === 'downloaded') {
            toast.success(
              downloadPrice > 0 ? 'Payment Successful! PDF downloaded.' : 'PDF downloaded!',
              { id: `${id}-success`, duration: 3000 }
            );
          } else if (outcome === 'opened') {
            toast.success('PDF opened in a new tab. Use your browser menu to save it.', {
              id: `${id}-success`,
              duration: 5000,
            });
          } else {
            toast.error(
              'Your report is ready but the download did not start. Tap download again — it is free now.',
              { id: `${id}-success`, duration: 6000 }
            );
          }
        }, 600);
        setShowDownloadModal(false);
        setDownloadedPdfUrl(pdfUrl);
        refreshWallet();
        if (downloadPrice > 0) {
          trackEvent("shubh_ai_payment_completed", { feature_name: featureName, amount_paid: downloadPrice });
        }
        trackEvent("shubh_ai_report_downloaded", { feature_name: featureName });
        return;
      }

      // Blocked — for EXTENDED_PLAN_REQUIRED show the extended popup populated
      // from the plans returned inline in the response (no silent auto-charge).
      setShowDownloadModal(false);
      handleReportBlock(reason, {
        id,
        featureName,
        onUpsell: openSubscriptionModal,
        extendedPlans: extractExtendedPlans(result),
      });
    } finally {
      setIsDownloading(false);
    }
  }, [historyId, id, fileName, downloadReportPdf, refreshWallet, downloadPrice, openSubscriptionModal, featureName]);

  const handleDownloadClick = useCallback(() => {
    // Always show the payment popup so the first download of every generated
    // report is confirmed/charged (re-downloading the same report is free via
    // downloadPrice === 0). No subscription shortcut.
    refreshWallet();
    trackEvent('shubh_ai_payment_initiated', { feature_name: featureName, price: downloadPrice });
    setShowDownloadModal(true);
  }, [refreshWallet, downloadPrice, featureName]);

  return {
    // State
    isDownloading,
    showDownloadModal,
    setShowDownloadModal,
    existingPdfUrl,
    isAlreadyDownloaded,
    downloadPrice,
    walletBalance,
    hasActiveSubscription,
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionModalVariant,
    extendedPlans,
    handleSubscriptionInsufficientBalance,

    // Handlers
    handleDownloadClick,
    handleConfirmDownload,
    handleDirectDownload,
    refreshWallet,
  };
};

export default useAIWowDownload;
