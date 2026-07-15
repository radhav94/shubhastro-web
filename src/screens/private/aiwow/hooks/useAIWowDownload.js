import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useDownloadReportPdfMutation, useGetAiHistoryQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { useWalletBalance } from '../../wallet/useWalletBalance';
import { trackEvent } from '../../../../utils/analytics';
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

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalVariant, setSubscriptionModalVariant] = useState('basic');
  const [extendedPlans, setExtendedPlans] = useState(null);
  const openSubscriptionModal = useCallback((mode = 'basic', plans = null) => {
    setSubscriptionModalVariant(mode);
    setExtendedPlans(Array.isArray(plans) && plans.length > 0 ? plans : null);
    setShowSubscriptionModal(true);
  }, []);

  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const kundliId = selectedProfile?._id || selectedProfile?.id || '';
  const { data: historyData } = useGetAiHistoryQuery(
    { kundliId, page: 1, limit: 10 },
    { skip: !kundliId }
  );

  const historyId = useMemo(() => extractHistoryId(resultData), [resultData]);

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

  // Download cost — no charges API. AI WOW reports run through the subscription
  // quota (backend enforces at generate-time), so downloads are free here; any
  // price provided on the result object is respected as a fallback.
  const downloadPrice = useMemo(() => {
    if (isAlreadyDownloaded) return 0;
    if (hasActiveSubscription) return 0; // covered by subscription quota — no wallet charge
    const fromResult =
      resultData?.downloadPrice ??
      resultData?.data?.downloadPrice ??
      resultData?.pdfDownloadCharge ??
      resultData?.data?.pdfDownloadCharge;
    return typeof fromResult === 'number' ? fromResult : 0;
  }, [isAlreadyDownloaded, hasActiveSubscription, resultData]);

  const id = toastId || `${featureName.replace(/\s+/g, '-').toLowerCase()}-pdf`;
  const fileName = useMemo(() => {
    return `${featureName.replace(/\s+/g, '-')}.pdf`;
  }, [featureName]);

  const handleDirectDownload = useCallback(async (url) => {
    setIsDownloading(true);
    try {
      toast.loading('Downloading PDF...', { id });
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('PDF downloaded!', { id });
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
        const res = await fetch(pdfUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
        toast.success('PDF downloaded!', { id });
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
    if (hasActiveSubscription) {
      handleConfirmDownload('en');
      return;
    }
    refreshWallet();
    trackEvent('shubh_ai_payment_initiated', { feature_name: featureName, price: downloadPrice });
    setShowDownloadModal(true);
  }, [hasActiveSubscription, handleConfirmDownload, refreshWallet, downloadPrice, featureName]);

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

    // Handlers
    handleDownloadClick,
    handleConfirmDownload,
    handleDirectDownload,
    refreshWallet,
  };
};

export default useAIWowDownload;
