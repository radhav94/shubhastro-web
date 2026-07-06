import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useGetChargesQuery, useDownloadReportPdfMutation, useGetAiHistoryQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { useWalletBalance } from '../../wallet/useWalletBalance';
import { trackEvent } from '../../../../utils/analytics';

/**
 * Extracts the history ID from a result object, checking multiple possible locations.
 */
const extractHistoryId = (result) =>
  result?.historyId || result?._id || result?.id ||
  result?.data?.historyId || result?.data?._id || result?.data?.id || null;

/**
 * Finds the matching charge amount from the charges API response dynamically.
 *
 * The charges API returns: { data: [{ title, list: [{ title, slug, amount, ... }] }] }
 *
 * Matching strategy (no hardcoding):
 *   1. Exact slug match (featureName → slug conversion)
 *   2. Keyword match on slug or title fields
 */
const findChargeAmount = (charges, featureName) => {
  if (!Array.isArray(charges) || !featureName) return null;

  const normalized = featureName.trim().toLowerCase();
  // e.g. "Palmistry Analysis" → "palmistry-analysis-report"
  const exactSlug = normalized.replace(/\s+/g, '-') + '-report';
  // Primary keyword: first word, e.g. "palmistry"
  const keyword = normalized.split(/\s+/)[0];

  for (const section of charges) {
    if (!Array.isArray(section?.list)) continue;

    // Strategy 1: exact slug match
    const exactMatch = section.list.find(
      (c) => c?.slug?.toLowerCase() === exactSlug
    );
    if (exactMatch) return exactMatch.amount ?? exactMatch.pdfDownloadCharge ?? 0;

    // Strategy 2: slug or title contains the keyword
    if (keyword) {
      const keywordMatch = section.list.find(
        (c) => c?.slug?.toLowerCase()?.includes(keyword) ||
               c?.title?.toLowerCase()?.includes(keyword)
      );
      if (keywordMatch) return keywordMatch.amount ?? keywordMatch.pdfDownloadCharge ?? 0;
    }
  }

  return null;
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
  const { data: chargesData } = useGetChargesQuery();
  const [downloadReportPdf] = useDownloadReportPdfMutation();
  const { balance: walletBalance, refreshWallet } = useWalletBalance();

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

  // Download cost — dynamically matches against charges API using featureName
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

  const handleDownloadClick = useCallback(() => {
    refreshWallet();
    trackEvent("shubh_ai_payment_initiated", { feature_name: featureName, price: downloadPrice });
    setShowDownloadModal(true);
  }, [refreshWallet]);

  const handleConfirmDownload = useCallback(async (language) => {
    if (!historyId) {
      toast.error('PDF not available for this report');
      return;
    }
    setIsDownloading(true);
    try {
      toast.loading('Downloading PDF...', { id });
      const result = await downloadReportPdf({ historyId, language }).unwrap();
      const pdfUrl = result?.data?.pdfUrl;
      if (!pdfUrl) throw new Error('PDF URL not found');
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
    } catch {
      toast.error('Failed to download PDF', { id });
      trackEvent("shubh_ai_payment_failed", { feature_name: featureName, reason: "download_failed" });
    } finally {
      setIsDownloading(false);
    }
  }, [historyId, id, fileName, downloadReportPdf, refreshWallet]);

  return {
    // State
    isDownloading,
    showDownloadModal,
    setShowDownloadModal,
    existingPdfUrl,
    isAlreadyDownloaded,
    downloadPrice,
    walletBalance,

    // Handlers
    handleDownloadClick,
    handleConfirmDownload,
    handleDirectDownload,
    refreshWallet,
  };
};

export default useAIWowDownload;
