import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './FaceReadingResult.module.scss';
import { Toast } from '../../../../component';
import DownloadReportModal from '../components/DownloadReportModal';
import FaceReport from './FaceReport';
import SubscriptionModal from '../../../../component/UI/modal/SubscriptionModal/SubscriptionModal';
import { useAIWowDownload } from '../hooks/useAIWowDownload';
import { PATH } from '../../../../utils/routes/Paths';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { trackEvent } from '../../../../utils/analytics';

/**
 * The six result sections, each paired with the key it reads from the analysis
 * response. Every one of those keys is destructured with an empty default
 * (`= {}`), and `{}` is truthy — so a section the API omitted still rendered its
 * tab in the bar and opened a completely blank panel. Only offer a tab when
 * there is something behind it.
 */
const TAB_SECTIONS = [
  { id: 'overall', label: 'Overall', key: 'overallReading' },
  { id: 'personality', label: 'Personality', key: 'personalityAnalysis' },
  { id: 'aura', label: 'Aura', key: 'auraColors' },
  { id: 'features', label: 'Features', key: 'facialFeatures' },
  { id: 'cosmic', label: 'Cosmic', key: 'cosmicConnections' },
  { id: 'insights', label: 'Insights', key: 'personalizedInsights' },
];

const hasContent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

const FaceReadingResult = () => {
  const navigate = useNavigate();
  // Route the in-page back button through the browser Back so it hits the
  // exit-intent guard that FaceReport's RecommendedAstrologersModal arms on
  // mount — i.e. the first press opens the discounted-astrologer offer instead
  // of leaving, exactly like the browser Back does. The modal handles leaving
  // the report once the offer is closed.
  const handleBack = () => window.history.back();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get data from Redux
  const reduxResult = useSelector((state) => state.aiwow.faceReading.result);
  const reduxImage = useSelector((state) => state.aiwow.faceReading.image);

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'astro-face-reading')?.title || 'Face Reading Analysis';

  const downloadResultData = useMemo(() => {
    if (!reduxResult) return null;
    const { pdfPath, data, ...rest } = reduxResult;
    const cleanData = data ? (() => { const { pdfPath: _p, ...d } = data; return d; })() : undefined;
    const result = cleanData !== undefined ? { ...rest, data: cleanData } : rest;
    if (result.featureName) return result;
    return { ...result, featureName: 'face-analysis' };
  }, [reduxResult]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    isAlreadyDownloaded, downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload,
    showSubscriptionModal, setShowSubscriptionModal, subscriptionModalVariant, extendedPlans,
  } = useAIWowDownload({ resultData: downloadResultData });

  useEffect(() => {
    console.log('FaceReadingResult - Loading result:', {
      hasReduxResult: !!reduxResult,
      reduxResultType: typeof reduxResult,
      reduxResultKeys: reduxResult ? Object.keys(reduxResult) : [],
      hasReduxImage: !!reduxImage
    });

    if (reduxResult) {
      try {
        // Handle nested data structure
        const resultData = reduxResult.data || reduxResult;
        
        console.log('FaceReadingResult - Processing data:', {
          hasResultData: !!resultData,
          resultDataKeys: resultData ? Object.keys(resultData) : [],
          hasFaceImage: !!(resultData.faceImage || reduxImage)
        });

        setAnalysisData({
          ...resultData,
          faceImage: reduxImage || resultData.faceImage
        });
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/ai-wow/astro-face-reading', { replace: true });
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/ai-wow/astro-face-reading', { replace: true });
      return;
    }
    
    setLoading(false);
  }, [reduxResult, reduxImage, navigate]);

  // Hiding an empty section is right for the visitor, but hiding it *silently*
  // would also hide a possible API regression on a paid reading — nobody would
  // learn that sections stopped arriving. Record which ones came back empty.
  useEffect(() => {
    if (!analysisData) return;
    const missing = TAB_SECTIONS
      .filter(({ key }) => !hasContent(analysisData[key]))
      .map(({ id }) => id);
    if (missing.length) {
      trackEvent('shubh_ai_result_section_missing', {
        feature_name: 'astro-face-reading',
        missing_sections: missing.join(','),
        missing_count: missing.length,
      });
    }
  }, [analysisData]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>No analysis data available</p>
          <button onClick={() => navigate('/ai-wow/astro-face-reading', { replace: true })}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Only the image is needed here now; FaceReport reads the sections itself, and
  // decides per card whether there is anything to show.
  const { faceImage } = analysisData;

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>{featureTitle}</h1>
        <button className={styles.downloadButton} onClick={handleDownloadClick} disabled={isDownloading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19A2 2 0 0119 21H5A2 2 0 013 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isDownloading ? "Downloading..." : "Download"}
        </button>
        </div>
      </header>

      {/*
        Redesigned report. All six sections, the banner and the sidebar now live
        in FaceReport; this screen keeps the data plumbing, download and
        subscription flow. The tab bar moved in there too, so the empty-section
        filtering it used to do is handled by each card rendering only when its
        own field is present.
      */}
      <FaceReport
        data={analysisData}
        faceImage={faceImage}
        onDownload={handleDownloadClick}
      />

      <DownloadReportModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleConfirmDownload}
        featureName={`${featureTitle} Report`}
        downloadCost={downloadPrice}
        walletBalance={walletBalance ?? 0}
        isDownloading={isDownloading}
        showLanguageSelection={false}
      />
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        variant={subscriptionModalVariant}
        plans={subscriptionModalVariant === 'extended' ? extendedPlans : undefined}
      />
    </div>
    </>
  );
};

export default FaceReadingResult;
