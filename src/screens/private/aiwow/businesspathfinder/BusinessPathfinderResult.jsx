import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './BusinessPathfinderResult.module.scss';
import { Toast } from '../../../../component';
import TTSButton from '../../../../component/UI/TTSButton';
import DownloadReportModal from '../components/DownloadReportModal';
import { useWalletBalance } from '../../../private/wallet/useWalletBalance';
import { useGetChargesQuery, useGetAiHistoryQuery } from '../../../../redux/api/aiwow/aiwowApi';
import remedyMortarImg from '../../../../assets/images/remedy-mortar.png';
import { trackEvent } from '../../../../utils/analytics';

const BusinessPathfinderResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const reportId = result?.historyId || result?._id || result?.id || null;
  const downloadedKey = reportId ? `bp_report_downloaded_${reportId}` : null;

  // Locally track a download done in this session / persisted across refresh.
  const [downloadedThisSession, setDownloadedThisSession] = useState(
    () => !!downloadedKey && localStorage.getItem(downloadedKey) === 'true'
  );
  const { balance: walletBalance, refreshWallet } = useWalletBalance();
  const { data: chargesData } = useGetChargesQuery();
  const charges = chargesData?.data || null;

  // Derive "already downloaded" from AI history so it persists across refresh.
  const selectedProfile = useSelector((state) => state.aiwow?.selectedKundliProfile);
  const kundliId = selectedProfile?._id || selectedProfile?.id || '';
  const { data: historyData } = useGetAiHistoryQuery(
    { kundliId, page: 1, limit: 10 },
    { skip: !kundliId }
  );

  const historyId = reportId;
  const historyItem = useMemo(
    () => historyData?.data?.history?.find((h) => h._id === historyId || h.featureId === historyId) || null,
    [historyData, historyId]
  );

  const isAlreadyDownloaded = useMemo(() => {
    if (downloadedThisSession) return true;
    const candidates = [historyItem?.pdfPath, result?.pdfPath, result?.data?.pdfPath];
    return candidates.some((p) => typeof p === 'string' && p.startsWith('http'));
  }, [downloadedThisSession, historyItem, result]);

  // Find the Business Pathfinder download charge from the charges API.
  // Response shape: { data: [{ title, list: [{ slug, title, amount }] }] }
  const getChargeAmount = () => {
    if (!Array.isArray(charges)) return null;
    for (const section of charges) {
      if (!Array.isArray(section?.list)) continue;
      const match = section.list.find(
        (c) =>
          c?.slug?.toLowerCase() === 'business-pathfinder-report' ||
          c?.slug?.toLowerCase()?.includes('business-pathfinder') ||
          c?.title?.toLowerCase()?.includes('business pathfinder')
      );
      if (match) return match.amount ?? match.pdfDownloadCharge ?? null;
    }
    return null;
  };

  const getDownloadCost = () => {
    if (isAlreadyDownloaded) return 0;
    const amount = getChargeAmount();
    return amount ?? 10;
  };

  const handleDownloadClick = () => {
    refreshWallet();
    setDownloadModalOpen(true);
  };

  const handleConfirmDownload = async () => {
    if (!result?._id) {
      Toast.error('Something went wrong. Please try again.');
      return;
    }
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('shubhtalk_customer_token');
      const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
      const res = await fetch(`${BASE_URL}/api/ai-history/pdf?historyId=${result._id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.pdfUrl) {
        const pdfRes = await fetch(data.data.pdfUrl);
        const blob = await pdfRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'Business-Pathfinder-Report.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
        Toast.success('PDF downloaded!');
        setDownloadedThisSession(true);
        if (downloadedKey) localStorage.setItem(downloadedKey, 'true');
        refreshWallet();
        const cost = getChargeAmount();
        if (cost > 0) {
          trackEvent('business_pathfinder_payment_completed', { amount: cost });
        }
      } else {
        Toast.error('Something went wrong. Please try again.');
      }
    } catch {
      Toast.error('Something went wrong. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadModalOpen(false);
    }
  };

  if (!result) {
    return (
      <>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className={styles.pageTitle}>Business Pathfinder</span>
        </div>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <p>No report data found. Please generate a report first.</p>
            <button className={styles.generateBtn} onClick={() => navigate('/ai-wow/business-pathfinder')}>
              Generate Report
            </button>
          </div>
        </div>
      </>
    );
  }

  const {
    compatibilityScore,
    cosmicVerdict,
    scoreLabel,
    starIndustryFit,
    bestLaunchWindow,
    topStrengths,
    topWatchouts,
    fundingOutlook,
    suggestedRemedy,
    inputs,
    kundliDetails,
    createdAt,
    _id,
  } = result;

  const score = compatibilityScore || 0;
  const alignment = scoreLabel || (score >= 70 ? 'Strong Alignment' : score >= 40 ? 'Moderate Alignment' : 'Needs Attention');
  
  // Format birth date
  const birthDate = kundliDetails 
    ? `${kundliDetails.day} ${['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][kundliDetails.month]}, ${kundliDetails.year}`
    : '';
  const reportDate = createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.pageTitle}>Business Pathfinder</span>
      </div>

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.resultHeader}>
          <h1>Business Pathfinder Results</h1>
          <p>{result.subtitle || 'Your personalized astrological business guidance report'}</p>
        </div>

        {/* User Info Card */}
        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <span className={styles.infoIconBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F75801" stroke="none">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </span>
            <div>
              <span className={styles.infoLabel}>Generated for</span>
              <span className={styles.infoValue}>{kundliDetails?.name || 'User'}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIconBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F75801" stroke="none">
                <rect x="4" y="5" width="16" height="15" rx="2"/><rect x="8" y="2" width="2" height="5" rx="1"/><rect x="14" y="2" width="2" height="5" rx="1"/><rect x="4" y="10" width="16" height="2" fill="#fff"/>
              </svg>
            </span>
            <div>
              <span className={styles.infoLabel}>Birth Details</span>
              <span className={styles.infoValue}>{birthDate}</span>
              <span className={styles.infoSub}>{kundliDetails?.place || ''}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIconBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F75801" stroke="none">
                <rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="7" width="8" height="2" rx="1" fill="#fff"/><rect x="8" y="11" width="6" height="2" rx="1" fill="#fff"/><rect x="8" y="15" width="4" height="2" rx="1" fill="#fff"/>
              </svg>
            </span>
            <div>
              <span className={styles.infoLabel}>Report ID</span>
              <span className={styles.infoValue}>SY-{_id ? _id.slice(-8).toUpperCase() : 'N/A'}</span>
              <span className={styles.infoSub}>{reportDate}</span>
            </div>
          </div>
        </div>

        {/* Compatibility Score */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreLeft}>
            <h3 className={styles.scoreTitle}>Compatibility Score</h3>
            <div className={styles.scoreCircle}>
              <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f0e0d0" strokeWidth="12"/>
                <circle cx="60" cy="60" r="48" fill="none" stroke="#D43400" strokeWidth="12"
                  strokeDasharray={`${(score / 100) * 301.6} 301.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className={styles.scoreText}>
                <span className={styles.scoreNumber}>{score}%</span>
                <span className={styles.scoreMax}>/100</span>
              </div>
            </div>
            <span className={styles.alignmentBadge}>✨ {alignment}</span>
          </div>
          <div className={styles.scoreRight} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
              <TTSButton text={`Compatibility Score ${score} percent. ${alignment}. Cosmic Verdict. ${cosmicVerdict || ''}`} />
            </span>
            <h4>Cosmic Verdict</h4>
            <p>{cosmicVerdict || 'Your business alignment shows promising cosmic energy.'}</p>
          </div>
        </div>

        {/* Result Title */}
        <div className={styles.sectionDivider}>
          <span className={styles.titleBar}></span>
          <h2>{result.resultTitle || 'DETAILED ANALYSIS'}</h2>
        </div>

        {/* Star Industry Fit */}
        {starIndustryFit && (
          <div className={styles.resultCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
              <TTSButton text={`Star Industry Fit. ${starIndustryFit}`} />
            </span>
            <div className={styles.cardIcon}>💼</div>
            <div className={styles.cardContent}>
              <h3>Star Industry Fit</h3>
              <p>{starIndustryFit}</p>
            </div>
          </div>
        )}

        {/* Best Launch Window */}
        {bestLaunchWindow && (
          <div className={styles.resultCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
              <TTSButton text={`Best Launch Window. ${typeof bestLaunchWindow === 'object' ? bestLaunchWindow.description : bestLaunchWindow}`} />
            </span>
            <div className={styles.cardIcon}>🚀</div>
            <div className={styles.cardContent}>
              <h3>Best Launch Window</h3>
              <p>{typeof bestLaunchWindow === 'object' ? bestLaunchWindow.description : bestLaunchWindow}</p>
            </div>
          </div>
        )}

        {/* Top 3 Strengths & Watch-Outs */}
        {((topStrengths && topStrengths.length > 0) || (topWatchouts && topWatchouts.length > 0)) && (
          <div className={styles.twoColCard}>
            {topStrengths && topStrengths.length > 0 && (
              <div className={styles.colCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                  <TTSButton text={`Top 3 Strengths. ${topStrengths.map(i => typeof i === 'string' ? i : i.text || i.description).join('. ')}`} />
                </span>
                <span className={styles.cardIcon}>💪</span>
                <h4>Top 3 Strength</h4>
                <ul>
                  {topStrengths.map((item, idx) => (
                    <li key={idx}>{typeof item === 'string' ? item : item.text || item.description}</li>
                  ))}
                </ul>
              </div>
            )}
            {topWatchouts && topWatchouts.length > 0 && (
              <div className={styles.colCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                  <TTSButton text={`Top 3 Watch Outs. ${topWatchouts.map(i => typeof i === 'string' ? i : i.text || i.description).join('. ')}`} />
                </span>
                <span className={styles.cardIcon}>👁️</span>
                <h4>Top 3 Watch - Outs</h4>
                <ul>
                  {topWatchouts.map((item, idx) => (
                    <li key={idx}>{typeof item === 'string' ? item : item.text || item.description}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Funding Outlook */}
        {fundingOutlook && (
          <div className={styles.resultCardStacked} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
              <TTSButton text={`Funding Outlook. ${fundingOutlook}`} />
            </span>
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardIcon}>🔮</div>
              <p>Funding Outlook</p>
            </div>
            <div className={styles.cardBody}>
              <p>{fundingOutlook}</p>
            </div>
          </div>
        )}

        {/* Suggested Remedy */}
        {suggestedRemedy && (
          <div className={styles.resultCardStacked + ' ' + styles.remedyCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
              <TTSButton text={`Suggested Remedy. ${suggestedRemedy}`} />
            </span>
            <div className={styles.cardHeaderRow}>
              <img src={remedyMortarImg} alt="Remedy" className={styles.remedyImg} />
              <p>Suggested Remedy</p>
            </div>
            <div className={styles.cardBody}>
              <p>{suggestedRemedy}</p>
            </div>
          </div>
        )}

        {/* Download Report */}
        <div className={styles.downloadCard}>
          <div className={styles.downloadLeft}>
            <h4>Download Your Report</h4>
            <p>Get your detailed astrological business analysis in PDF format.</p>
            <div className={styles.downloadFeatures}>
              <span>✓ Detailed Analysis</span>
              <span>✓ Instant Download</span>
            </div>
          </div>
          <div className={styles.downloadRight}>
            <span className={styles.downloadPrice}>{getDownloadCost() === 0 ? 'Free' : `₹${getDownloadCost()}`}</span>
            <button className={styles.downloadBtn} onClick={handleDownloadClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <div>
                <span className={styles.downloadBtnText}>Download Now</span>
                <span className={styles.downloadBtnSub}>Premium PDF Report</span>
              </div>
            </button>
          </div>
        </div>

        {/* Download Modal */}
        <DownloadReportModal
          isOpen={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
          onDownload={handleConfirmDownload}
          featureName="Business Pathfinder"
          downloadCost={getDownloadCost()}
          walletBalance={walletBalance ?? 0}
          isDownloading={isDownloading}
          showLanguageSelection={false}
        />

        {/* Generate Another */}
        <div className={styles.generateWrap}>
          <button className={styles.generateBtn} onClick={() => navigate('/ai-wow/business-pathfinder')}>
            Generate another report
          </button>
        </div>
      </div>
    </>
  );
};

export default BusinessPathfinderResult;
