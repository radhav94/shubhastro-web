import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './ClothColorResult.module.scss';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import DownloadReportModal from '../components/DownloadReportModal';
import SubscriptionModal from '../../../../component/UI/modal/SubscriptionModal/SubscriptionModal';
import { useAIWowDownload } from '../hooks/useAIWowDownload';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';

const ClothColorResult = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate(PATH.privateRoutes.CLOTH_COLOR_LANDING.path[0], { replace: true });
  const [activeTab, setActiveTab] = useState('recommended');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get data from Redux
  const reduxResult = useSelector((state) => state.aiwow.clothColor.result);
  const reduxImage = useSelector((state) => state.aiwow.clothColor.image);
  const reduxFormData = useSelector((state) => state.aiwow.clothColor.formData);

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'clothes-colour-analysis')?.title || 'Color Analysis';

  const downloadResultData = useMemo(() => {
    if (!reduxResult) return null;
    const { pdfPath, data, ...rest } = reduxResult;
    const cleanData = data ? (() => { const { pdfPath: _p, ...d } = data; return d; })() : undefined;
    const result = cleanData !== undefined ? { ...rest, data: cleanData } : rest;
    if (result.featureName) return result;
    return { ...result, featureName: 'color-analysis' };
  }, [reduxResult]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    isAlreadyDownloaded, downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload,
    showSubscriptionModal, setShowSubscriptionModal, subscriptionModalVariant, extendedPlans,
  } = useAIWowDownload({ resultData: downloadResultData });

  useEffect(() => {
    console.log('ClothColorResult - Loading result:', {
      hasReduxResult: !!reduxResult,
      reduxResultType: typeof reduxResult,
      reduxResultKeys: reduxResult ? Object.keys(reduxResult) : [],
      hasReduxImage: !!reduxImage,
      hasReduxFormData: !!reduxFormData
    });

    if (reduxResult) {
      try {
        console.log('📦 Redux result:', reduxResult);
        
        // Handle the actual API response structure
        const apiData = reduxResult.data || reduxResult;
        const formData = reduxFormData || {};
        
        console.log('ClothColorResult - Processing data:', {
          hasApiData: !!apiData,
          apiDataKeys: apiData ? Object.keys(apiData) : [],
          hasDetectedColors: !!(apiData.detectedColors),
          hasRecommendedColors: !!(apiData.recommendedColors),
          hasAstrologicalMatches: !!(apiData.astrologicalMatches)
        });
        
        // Check if we have the new API structure with detectedColors, aiConfidence, astrologicalMatches
        if (apiData.detectedColors || apiData.astrologicalMatches) {
          console.log('✅ Using new API structure');
          setResultData({
            image: reduxImage,
            intention: formData.intention || apiData.intention,
            analysisDate: apiData.analysisDate,
            dominantPlanet: apiData.dominantPlanet || apiData.astrologicalMatches?.dominantPlanet,
            detectedColors: apiData.detectedColors || [],
            aiConfidence: apiData.aiConfidence,
            astrologicalMatches: apiData.astrologicalMatches || {},
            // Map to old structure for backward compatibility
            recommendedColors: apiData.recommendedColors || apiData.astrologicalMatches?.recommendedColors || [],
            suggestedCombinations: apiData.suggestedCombinations || apiData.astrologicalMatches?.suggestedCombinations || [],
            wardrobeAnalysis: apiData.wardrobeAnalysis || apiData.astrologicalMatches?.wardrobeAnalysis,
            colorsToAvoid: apiData.colorsToAvoid || apiData.astrologicalMatches?.colorsToAvoid || [],
          });
        } else {
          // Old structure
          console.log('✅ Using old API structure');
          setResultData({
            image: reduxImage,
            intention: formData.intention || apiData.intention,
            analysisDate: apiData.analysisDate,
            dominantPlanet: apiData.dominantPlanet,
            recommendedColors: apiData.recommendedColors || [],
            suggestedCombinations: apiData.suggestedCombinations || [],
            wardrobeAnalysis: apiData.wardrobeAnalysis,
            colorsToAvoid: apiData.colorsToAvoid || [],
          });
        }
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/ai-wow/clothes-colour-analysis', { replace: true });
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/ai-wow/clothes-colour-analysis', { replace: true });
      return;
    }
    
    setLoading(false);
  }, [reduxResult, reduxImage, reduxFormData, navigate]);

  const getIntentionLabel = (intention) => {
    const labels = {
      'focus_study': 'Focus & Study',
      'career_success': 'Career Success',
      'love_relationships': 'Love & Relationships',
      'health_wellness': 'Health & Wellness',
      'general_prosperity': 'General Prosperity',
    };
    return labels[intention] || intention;
  };

  const renderRecommended = () => (
    <div className={styles.tabContent}>

      <div className={styles.intentionCard} style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
        <TTSButton text={`Analysis Details. Intention: ${getIntentionLabel(resultData.intention)}${resultData.analysisDate ? '. Analysis Date: ' + String(resultData.analysisDate) : ''}${resultData.dominantPlanet ? '. Dominant Planet: ' + String(resultData.dominantPlanet) : ''}`} />
      </span>
      {resultData.image && (
        <div className={styles.clothImageWrapper}>
          <img src={resultData.image} alt="Analyzed clothes" className={styles.clothImage} />
        </div>
      )}
      <div className={styles.rightSideContent}>
          <h3 className={styles.cardTitle}>Analysis Details</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>Intention:</span>
            <span className={styles.value}>{getIntentionLabel(resultData.intention)}</span>
          </div>
          {resultData.analysisDate && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Analysis Date:</span>
              <span className={styles.value}>{String(resultData.analysisDate)}</span>
            </div>
          )}
          {resultData.dominantPlanet && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Dominant Planet:</span>
              <span className={styles.value}>{String(resultData.dominantPlanet)}</span>
            </div>
          )}
        </div>
      </div>

      {resultData.recommendedColors && Array.isArray(resultData.recommendedColors) && resultData.recommendedColors.length > 0 && (
        <div className={styles.colorsCard} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`Recommended Colors. ${resultData.recommendedColors.map(c => c.colorName + (c.description ? ': ' + c.description : '') + (c.benefits?.length > 0 ? '. Benefits: ' + c.benefits.join(', ') : '') + (c.whenToWear ? '. When to Wear: ' + c.whenToWear : '')).join('. ')}`} />
          </span>
          <h3 className={styles.cardTitle}>Recommended Colors</h3>
          <div className={styles.colorsGrid}>
            {resultData.recommendedColors.map((color, index) => (
              <div key={index} className={styles.colorItem}>
                <div className={styles.colorHeader}>
                  <div className={styles.colorInfo}>
                    <div 
                      className={styles.colorSwatch} 
                      style={{ backgroundColor: color.hexCode || '#000' }}
                    ></div>
                    <div>
                      <h4 className={styles.colorName}>{String(color.colorName || 'Unknown')}</h4>
                      <span className={styles.colorType}>
                        {color.type ? String(color.type) : ''}{color.type && color.planet ? ' • ' : ''}{color.planet ? String(color.planet) : ''}
                      </span>
                    </div>
                  </div>
                  <span className={styles.hexCode}>{String(color.hexCode || '')}</span>
                </div>
                {color.description && (
                  <p className={styles.colorDescription}>{String(color.description)}</p>
                )}
                
                {color.benefits && Array.isArray(color.benefits) && color.benefits.length > 0 && (
                  <>
                    <h5 className={styles.subTitle}>Benefits</h5>
                    <ul className={styles.benefitsList}>
                      {color.benefits.map((benefit, idx) => (
                        <li key={idx} className={styles.benefitItem}>{String(benefit)}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                {color.whenToWear && (
                  <div className={styles.whenToWear}>
                    <span className={styles.whenLabel}>When to Wear:</span>
                    <span className={styles.whenValue}>{String(color.whenToWear)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCombinations = () => (
    <div className={styles.tabContent}>
      {resultData.suggestedCombinations && Array.isArray(resultData.suggestedCombinations) && resultData.suggestedCombinations.length > 0 && (
        <div className={styles.combinationsCard} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`Suggested Color Combinations. ${resultData.suggestedCombinations.map(c => (c.colors ? c.colors.map(cl => cl.colorName).join(' and ') : '') + (c.description ? '. ' + c.description : '') + (c.occasion ? '. Best For: ' + c.occasion : '')).join('. ')}`} />
          </span>
          <h3 className={styles.cardTitle}>Suggested Color Combinations</h3>
          <div className={styles.combinationsGrid}>
            {resultData.suggestedCombinations.map((combo, index) => (
              <div key={index} className={styles.comboItem}>
                {combo.colors && Array.isArray(combo.colors) && (
                  <div className={styles.comboColors}>
                    {combo.colors.map((color, idx) => (
                      <div key={idx} className={styles.comboColorBox}>
                        <div 
                          className={styles.comboSwatch} 
                          style={{ backgroundColor: color.hexCode || '#000' }}
                        ></div>
                        <span className={styles.comboColorName}>{String(color.colorName || 'Unknown')}</span>
                      </div>
                    ))}
                  </div>
                )}
                {combo.description && (
                  <p className={styles.comboDescription}>{String(combo.description)}</p>
                )}
                {combo.occasion && (
                  <div className={styles.comboOccasion}>
                    <span className={styles.occasionLabel}>Best For:</span>
                    <span className={styles.occasionValue}>{String(combo.occasion)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {resultData.wardrobeAnalysis && (
        <div className={styles.wardrobeCard} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`Wardrobe Analysis. ${resultData.wardrobeAnalysis.detectedColors?.length > 0 ? 'Detected Colors: ' + resultData.wardrobeAnalysis.detectedColors.map(c => c.colorName + ' ' + c.percentage + ' percent').join(', ') + '. ' : ''}${resultData.wardrobeAnalysis.astrologicalMatches?.length > 0 ? 'Astrological Matches: ' + resultData.wardrobeAnalysis.astrologicalMatches.map(m => m.detectedColor + ' to ' + m.recommendedColor + ' ' + m.matchPercentage + ' percent match' + (m.suggestion ? '. ' + m.suggestion : '')).join(', ') : ''}`} />
          </span>
          <h3 className={styles.cardTitle}>Wardrobe Analysis</h3>
          
          {resultData.wardrobeAnalysis.detectedColors && Array.isArray(resultData.wardrobeAnalysis.detectedColors) && resultData.wardrobeAnalysis.detectedColors.length > 0 && (
            <div className={styles.detectedColorsSection}>
              <h4 className={styles.subTitle}>Detected Colors in Your Wardrobe</h4>
              {resultData.wardrobeAnalysis.detectedColors.map((color, idx) => (
                <div key={idx} className={styles.detectedColorItem}>
                  <div className={styles.detectedColorHeader}>
                    <div className={styles.detectedColorInfo}>
                      <div 
                        className={styles.colorSwatch} 
                        style={{ backgroundColor: color.hexCode || '#000' }}
                      ></div>
                      <span className={styles.detectedColorName}>{String(color.colorName || 'Unknown')}</span>
                    </div>
                    <div className={styles.detectedColorStats}>
                      <span className={styles.percentage}>{color.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resultData.wardrobeAnalysis.astrologicalMatches && Array.isArray(resultData.wardrobeAnalysis.astrologicalMatches) && resultData.wardrobeAnalysis.astrologicalMatches.length > 0 && (
            <div className={styles.matchesSection}>
              <h4 className={styles.subTitle}>Astrological Matches</h4>
              {resultData.wardrobeAnalysis.astrologicalMatches.map((match, idx) => (
                <div key={idx} className={styles.matchItem}>
                  <div className={styles.matchHeader}>
                    <span className={styles.matchLabel}>
                      {String(match.detectedColor)} → {String(match.recommendedColor)}
                    </span>
                    <span className={styles.matchPercentage}>{match.matchPercentage}% match</span>
                  </div>
                  {match.suggestion && (
                    <p className={styles.matchSuggestion}>{String(match.suggestion)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAvoid = () => (
    <div className={styles.tabContent}>
      {resultData.colorsToAvoid && Array.isArray(resultData.colorsToAvoid) && resultData.colorsToAvoid.length > 0 ? (
        <div className={styles.avoidCard} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`Colors to Avoid. ${resultData.colorsToAvoid.map(c => c.colorName + (c.reason ? ': ' + c.reason : '')).join('. ')}`} />
          </span>
          <h3 className={styles.cardTitle}>Colors to Avoid Today</h3>
          <p className={styles.avoidIntro}>
            These colors may not be favorable for your intention on this day:
          </p>
          <div className={styles.avoidGrid}>
            {resultData.colorsToAvoid.map((color, index) => (
              <div key={index} className={styles.avoidItem}>
                <div className={styles.avoidHeader}>
                  <div className={styles.avoidColorInfo}>
                    <div 
                      className={styles.avoidSwatch} 
                      style={{ backgroundColor: color.hexCode || '#000' }}
                    ></div>
                    <div>
                      <h4 className={styles.avoidColorName}>{String(color.colorName || 'Unknown')}</h4>
                      <span className={styles.avoidHex}>{String(color.hexCode || '')}</span>
                    </div>
                  </div>
                </div>
                {color.reason && (
                  <div className={styles.avoidReason}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.warningIcon}>
                      <path d="M8 1L1 14H15L8 1Z" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
                      <path d="M8 6V9" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="11.5" r="0.5" fill="#f59e0b"/>
                    </svg>
                    <span className={styles.reasonText}>{String(color.reason)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.avoidCard} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text="Colors to Avoid. No specific colors to avoid for your intention today." />
          </span>
          <h3 className={styles.cardTitle}>Colors to Avoid</h3>
          <p className={styles.avoidIntro}>
            No specific colors to avoid for your intention today.
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return null;
  }

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

      <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'recommended' ? styles.active : ''}`}
            onClick={() => setActiveTab('recommended')}
          >
            Recommended
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'combinations' ? styles.active : ''}`}
            onClick={() => setActiveTab('combinations')}
          >
            Combinations
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'avoid' ? styles.active : ''}`}
            onClick={() => setActiveTab('avoid')}
          >
            Avoid
          </button>
        </div>

        </div>

      <div className={styles.content}>
          {activeTab === 'recommended' && renderRecommended()}
          {activeTab === 'combinations' && renderCombinations()}
          {activeTab === 'avoid' && renderAvoid()}
        {/* <button className={styles.doneButton} onClick={() => navigate('/ai-wow')}> */}
        {/* <button className={styles.doneButton} onClick={() => navigate('/ai-wow')}>
          Done
        </button> */}

        <button 
          className={styles.consultButton}
          onClick={() => navigate(PATH.privateRoutes.ASTROLOGERS_LIST.path)}
        >
          Consult with Expert Astrologer
        </button>
      </div>

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
        featureName="clothes-colour-analysis"
        plans={subscriptionModalVariant === 'extended' ? extendedPlans : undefined}
      />
    </div>
    </>
  );
};

export default ClothColorResult;
