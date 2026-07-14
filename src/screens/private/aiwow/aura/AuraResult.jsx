import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './AuraResult.module.scss';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import DownloadReportModal from '../components/DownloadReportModal';
import SubscriptionModal from '../../../../component/UI/modal/SubscriptionModal/SubscriptionModal';
import { useAIWowDownload } from '../hooks/useAIWowDownload';

const AuraResult = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate('/ai-wow/aura-photography', { replace: true });
  const [activeTab, setActiveTab] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [expandedDominant, setExpandedDominant] = useState(false);
  const [expandedAstrological, setExpandedAstrological] = useState(false);
  const [expandedStrengths, setExpandedStrengths] = useState(false);
  const [expandedRecommendations, setExpandedRecommendations] = useState(false);
  const [expandedMood, setExpandedMood] = useState(false);

  // Helper to convert hex color codes to readable names for TTS
  const getColorName = (hex) => {
    if (!hex || !hex.startsWith('#')) return hex;
    const colorMap = {
      '#FFD700': 'Gold', '#FFA500': 'Orange', '#FF0000': 'Red',
      '#800080': 'Purple', '#0000FF': 'Blue', '#00FF00': 'Green',
      '#FFFF00': 'Yellow', '#FFC0CB': 'Pink', '#FFFFFF': 'White',
      '#000000': 'Black', '#808080': 'Gray', '#4B0082': 'Indigo',
      '#EE82EE': 'Violet', '#00FFFF': 'Cyan', '#FF00FF': 'Magenta',
      '#C0C0C0': 'Silver', '#A52A2A': 'Brown', '#FF4500': 'Orange Red',
      '#7FFFD4': 'Aquamarine', '#DC143C': 'Crimson',
    };
    return colorMap[hex.toUpperCase()] || hex;
  };
  
  const analysisData = useSelector((state) => state.aiwow.aura.result);
  const auraImage = useSelector((state) => state.aiwow.aura.image);

  const downloadResultData = useMemo(() => {
    if (!analysisData) return null;
    if (analysisData.featureName) return analysisData;
    return { ...analysisData, featureName: 'Aura Analysis' };
  }, [analysisData]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    isAlreadyDownloaded, downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload,
    showSubscriptionModal, setShowSubscriptionModal, subscriptionModalVariant,
  } = useAIWowDownload({ resultData: downloadResultData });

  useEffect(() => {
    console.log('AuraResult - Loading result:', {
      hasReduxResult: !!analysisData,
      reduxResultType: typeof analysisData,
      reduxResultKeys: analysisData ? Object.keys(analysisData) : []
    });

    // Validate Redux state
    if (!analysisData) {
      console.error('No analysis data found in Redux state');
      Toast.error('No analysis results found. Please analyze your aura first.');
      navigate('/ai-wow/aura-photography', { replace: true });
      return;
    }

    // Validate data structure - handle both direct data and nested data
    try {
      const actualData = analysisData.data || analysisData;
      
      if (typeof actualData !== 'object') {
        throw new Error('Invalid data format: expected object');
      }

      console.log('AuraResult - Validated data:', {
        hasActualData: !!actualData,
        actualDataKeys: Object.keys(actualData),
        hasOverallReading: !!(actualData.overallReading),
        hasAuraColors: !!(actualData.auraColors),
        hasChakraAnalysis: !!(actualData.chakraAnalysis)
      });

      // Check for required fields (adjust based on your API response)
      const hasValidStructure = 
        actualData.overallReading || 
        actualData.auraColors || 
        actualData.chakraAnalysis ||
        actualData.energyLevels;

      if (!hasValidStructure) {
        console.warn('Analysis data missing expected fields:', actualData);
        setValidationError('Incomplete analysis data received. Some information may be missing.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Data validation error:', error);
      Toast.error('Invalid analysis data format. Please try again.');
      navigate('/ai-wow/aura-photography', { replace: true });
    }
  }, [analysisData, navigate]);

  const tabs = [
    { id: 'overall', label: 'Overall' },
    { id: 'colors', label: 'Aura Colors' },
    { id: 'chakras', label: 'Chakras' },
    // { id: 'energy', label: 'Energy' },
    { id: 'spiritual', label: 'Spiritual' },
  ];

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
          <button onClick={() => navigate('/ai-wow/aura-photography', { replace: true })}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { 
    imageUrl,
    aura = {},
    astrologicalData = {},
    moodData = {}
  } = analysisData;

  // Map API response to component structure
  const displayImage = imageUrl || auraImage;
  const dominantColor = {
    color: aura.primaryColor,
    percentage: aura.intensity,
    meaning: aura.interpretation
  };
  
  const auraColors = [
    {
      color: aura.primaryColor,
      type: 'Primary Aura',
      percentage: aura.blendRatio?.astrological || 60,
      meaning: `Your primary aura reflects your ${astrologicalData.sunSign} solar energy`,
      traits: [astrologicalData.element, astrologicalData.dominantPlanet]
    },
    {
      color: aura.secondaryColor,
      type: 'Secondary Aura',
      percentage: aura.blendRatio?.emotional || 40,
      meaning: `Your emotional state shows ${moodData.detectedEmotion} energy`,
      traits: [moodData.detectedEmotion, moodData.energyLevel]
    }
  ];

  const energyLevel = {
    overall: aura.intensity,
    description: `Your energy is ${moodData.energyLevel} with ${moodData.confidence * 100}% confidence`,
    emotional: `Detected emotion: ${moodData.detectedEmotion} (${Math.round(moodData.confidence * 100)}% confidence)`,
    mental: `Your mental clarity is enhanced by ${astrologicalData.moonPhase} moon phase`,
    physical: `Physical vitality influenced by ${astrologicalData.dominantPlanet} energy`
  };

  const spiritualInsights = {
    path: aura.interpretation,
    guidance: astrologicalData.cosmicGuidance || aura.cosmicGuidance,
    practices: aura.recommendations || [],
    affirmations: []
  };

  const overallReading = {
    summary: aura.interpretation,
    strengths: aura.recommendations?.slice(0, 2) || [],
    challenges: [],
  };

  const recommendations = aura.recommendations || [];

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
          <h1 className={styles.title}>Aura Analysis</h1>
          <button className={styles.downloadBtn} onClick={handleDownloadClick} disabled={isDownloading}>
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isDownloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </header>

      <div className={styles.content}>
        

        {overallReading.summary && (
          <div className={styles.summaryCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Your Aura Reading. ${overallReading.summary}`} />
            </span>
            {displayImage && (
              <div className={styles.imageSection}>
                <img src={displayImage} alt="Aura" className={styles.auraImage} />
              </div>
            )}
            <div>
              <h3 className={styles.summaryTitle}>Your Aura Reading</h3>
              <p className={styles.summaryText}>{overallReading.summary}</p>
            </div>
          </div>
        )}

        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overall' && (
            <div className={styles.section}>
              <div className={styles.cardsGrid}>
                {/* {dominantColor.color && (
                  <div className={styles.dominantCard}>
                    <button
                      className={styles.cardHeaderButton}
                      onClick={() => setExpandedDominant(!expandedDominant)}
                    >
                      <h3 className={styles.cardTitle}>🌟 Dominant Aura Color</h3>
                      <span className={styles.dropdownArrow}>
                        {expandedDominant ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cardDropdown} ${expandedDominant ? styles.expanded : ''}`}>
                      <div className={styles.dominantContent}>
                        <div 
                          className={styles.dominantColorCircle} 
                          style={{ backgroundColor: dominantColor.color }}
                        ></div>
                        <div className={styles.dominantInfo}>
                          <h4 className={styles.dominantColorName}>
                            {dominantColor.color}
                          </h4>
                          <p className={styles.dominantPercentage}>{dominantColor.percentage}%</p>
                        </div>
                      </div>
                      <p className={styles.dominantMeaning}>{dominantColor.meaning}</p>
                    </div>
                  </div>
                )} */}

                {astrologicalData.sunSign && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Astrological Profile. Sun: ${astrologicalData.sunSign}. Element: ${astrologicalData.element}. Planet: ${astrologicalData.dominantPlanet}. Moon: ${astrologicalData.moonPhase}`} />
                    </span>
                    <button
                      className={styles.cardHeaderButton}
                      onClick={() => setExpandedAstrological(!expandedAstrological)}
                    >
                      <h3 className={styles.cardTitle}>♈ Astrological Profile</h3>
                      <span className={styles.dropdownArrow}>
                        {expandedAstrological ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cardDropdown} ${expandedAstrological ? styles.expanded : ''}`}>
                      <div className={styles.chipContainer}>
                        <span className={styles.chip}>Sun: {astrologicalData.sunSign}</span>
                        <span className={styles.chip}>Element: {astrologicalData.element}</span>
                        <span className={styles.chip}>Planet: {astrologicalData.dominantPlanet}</span>
                        <span className={styles.chip}>Moon: {astrologicalData.moonPhase}</span>
                      </div>
                    </div>
                  </div>
                )}

                {moodData.detectedEmotion && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Mood Analysis. Detected Emotion: ${moodData.detectedEmotion}. Energy Level: ${moodData.energyLevel}. Confidence: ${Math.round((moodData.confidence || 0) * 100)} percent`} />
                    </span>
                    <button
                      className={styles.cardHeaderButton}
                      onClick={() => setExpandedMood(!expandedMood)}
                    >
                      <h3 className={styles.cardTitle}>🎭 Mood Analysis</h3>
                      <span className={styles.dropdownArrow}>
                        {expandedMood ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cardDropdown} ${expandedMood ? styles.expanded : ''}`}>
                      <div className={styles.chipContainer}>
                        <span className={styles.chip}>Emotion: {moodData.detectedEmotion}</span>
                        <span className={styles.chip}>Energy: {moodData.energyLevel}</span>
                        {moodData.confidence && (
                          <span className={styles.chip}>Confidence: {Math.round(moodData.confidence * 100)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {overallReading.challenges?.length > 0 && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`Areas for Growth. ${overallReading.challenges.join('. ')}`} />
                    </span>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>⚡ Areas for Growth</h3>
                      <ul className={styles.list}>
                        {overallReading.challenges.map((challenge, index) => (
                          <li key={index} className={styles.listItem}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {recommendations?.length > 0 && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Recommendations. ${recommendations.join('. ')}`} />
                    </span>
                    <button
                      className={styles.cardHeaderButton}
                      onClick={() => setExpandedRecommendations(!expandedRecommendations)}
                    >
                      <h3 className={styles.cardTitle}>💡 Recommendations</h3>
                      <span className={styles.dropdownArrow}>
                        {expandedRecommendations ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cardDropdown} ${expandedRecommendations ? styles.expanded : ''}`}>
                      <ul className={styles.list}>
                        {recommendations.map((rec, index) => (
                          <li key={index} className={styles.listItem}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className={styles.section}>
              <div className={styles.auraColorsGrid}>
                {auraColors?.length > 0 && auraColors.map((color, index) => (
                  <div key={index} className={styles.auraCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`${color.type}. ${getColorName(color.color)}. ${color.percentage} percent. ${color.meaning || ''}${color.traits?.filter(Boolean).length > 0 ? ', with traits ' + color.traits.filter(Boolean).join(' and ') : ''}`} />
                    </span>
                    <div className={styles.auraHeader}>
                      <div 
                        className={styles.colorCircle} 
                        style={{ backgroundColor: color.color }}
                      ></div>
                      <div className={styles.auraInfo}>
                        <h3 className={styles.auraColor}>
                          {getColorName(color.color)}
                        </h3>
                        <p className={styles.auraType}>{color.type}</p>
                      </div>
                      <div className={styles.auraPercentage}>{color.percentage}%</div>
                    </div>
                    <p className={styles.auraMeaning}>{color.meaning}</p>
                    {color.traits && (
                      <div className={styles.chipContainer}>
                        {color.traits.map((trait, idx) => (
                          <span key={idx} className={styles.chip}>{trait}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chakras' && (
            <div className={styles.section}>
              <div className={styles.card} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                  <TTSButton text={`Planetary Influences. Your aura is influenced by planetary energies. Dominant planet: ${astrologicalData.dominantPlanet}`} />
                </span>
                <div className={styles.cardStaticContent}>
                  <h3 className={styles.cardTitle}>🌟 Planetary Influences</h3>
                  <p className={styles.cardText}>
                    Your aura is influenced by planetary energies. Dominant planet: {astrologicalData.dominantPlanet}
                  </p>
                </div>
              </div>
              
              <div className={styles.planetaryGrid}>
                {astrologicalData.planetaryInfluences?.map((planet, index) => (
                  <div key={index} className={styles.planetCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`${planet.planet}. ${planet.aspect}. Influence: ${planet.influence} percent`} />
                    </span>
                    <h4 className={styles.planetName}>{planet.planet}</h4>
                    <p className={styles.planetAspect}>{planet.aspect}</p>
                    <div className={styles.planetInfluence}>{planet.influence}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* {activeTab === 'energy' && (
            <div className={styles.section}>
              {energyLevel.overall && (
                <div className={styles.energyCard}>
                  <h3 className={styles.cardTitle}>⚡ Overall Energy Level</h3>
                  <div className={styles.energyContent}>
                    <p className={styles.energyPercentage}>{energyLevel.overall}%</p>
                  </div>
                  <p className={styles.energyDescription}>{energyLevel.description}</p>
                </div>
              )}

              <div className={styles.energyGrid}>
                {energyLevel.emotional && (
                  <div className={styles.card}>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>💖 Emotional Energy</h3>
                      <p className={styles.cardText}>{energyLevel.emotional}</p>
                    </div>
                  </div>
                )}

                {energyLevel.mental && (
                  <div className={styles.card}>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>🧠 Mental Energy</h3>
                      <p className={styles.cardText}>{energyLevel.mental}</p>
                    </div>
                  </div>
                )}

                {energyLevel.physical && (
                  <div className={styles.card}>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>💪 Physical Energy</h3>
                      <p className={styles.cardText}>{energyLevel.physical}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )} */}

          {activeTab === 'spiritual' && (
            <div className={styles.section}>
              <div className={styles.spiritualGrid}>
                {/* 🕉️ Spiritual Path - commented out */}
                {/* {spiritualInsights.path && (
                  <div className={styles.card}>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>🕉️ Spiritual Path</h3>
                      <p className={styles.cardText}>{spiritualInsights.path}</p>
                    </div>
                  </div>
                )} */}

                {spiritualInsights.guidance && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`Spiritual Guidance. ${spiritualInsights.guidance}`} />
                    </span>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>🌟 Spiritual Guidance</h3>
                      <p className={styles.cardText}>{spiritualInsights.guidance}</p>
                    </div>
                  </div>
                )}

                {/* 🧘 Recommended Practices - commented out */}
                {/* {spiritualInsights.practices?.length > 0 && (
                  <div className={styles.card}>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>🧘 Recommended Practices</h3>
                      <ul className={styles.list}>
                        {spiritualInsights.practices.map((practice, index) => (
                          <li key={index} className={styles.listItem}>{practice}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )} */}

                {/* Astrological Data */}
                {astrologicalData && (astrologicalData.sunSign || astrologicalData.element || astrologicalData.dominantPlanet || astrologicalData.moonPhase) && (
                  <div className={`${styles.card} ${styles.astroDataCard}`} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`Astrological Data. ${astrologicalData.sunSign ? 'Sun Sign: ' + astrologicalData.sunSign + '. ' : ''}${astrologicalData.element ? 'Element: ' + astrologicalData.element + '. ' : ''}${astrologicalData.dominantPlanet ? 'Dominant Planet: ' + astrologicalData.dominantPlanet + '. ' : ''}${astrologicalData.moonPhase ? 'Moon Phase: ' + astrologicalData.moonPhase : ''}`} />
                    </span>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>🪐 Astrological Data</h3>
                      <div className={styles.astroDataGrid}>
                        {astrologicalData.sunSign && (
                          <div className={styles.astroDataItem}>
                            <span className={styles.astroDataLabel}>♈ Sun Sign</span>
                            <span className={styles.astroDataValue}>{astrologicalData.sunSign}</span>
                          </div>
                        )}
                        {astrologicalData.element && (
                          <div className={styles.astroDataItem}>
                            <span className={styles.astroDataLabel}>🔥 Element</span>
                            <span className={styles.astroDataValue}>{astrologicalData.element}</span>
                          </div>
                        )}
                        {astrologicalData.dominantPlanet && (
                          <div className={styles.astroDataItem}>
                            <span className={styles.astroDataLabel}>🪐 Dominant Planet</span>
                            <span className={styles.astroDataValue}>{astrologicalData.dominantPlanet}</span>
                          </div>
                        )}
                        {astrologicalData.moonPhase && (
                          <div className={styles.astroDataItem}>
                            <span className={styles.astroDataLabel}>🌙 Moon Phase</span>
                            <span className={styles.astroDataValue}>{astrologicalData.moonPhase}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {astrologicalData?.currentTransits?.length > 0 && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`Current Transits. ${astrologicalData.currentTransits.join('. ')}`} />
                    </span>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>🌌 Current Transits</h3>
                      <ul className={styles.list}>
                        {astrologicalData.currentTransits.map((transit, index) => (
                          <li key={index} className={styles.listItem}>{transit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {spiritualInsights.affirmations?.length > 0 && (
                  <div className={styles.card} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`Daily Affirmations. ${spiritualInsights.affirmations.join('. ')}`} />
                    </span>
                    <div className={styles.cardStaticContent}>
                      <h3 className={styles.cardTitle}>✨ Daily Affirmations</h3>
                      <ul className={styles.list}>
                        {spiritualInsights.affirmations.map((affirmation, index) => (
                          <li key={index} className={styles.listItem}>{affirmation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
        featureName="Aura Photography Report"
        downloadCost={downloadPrice}
        walletBalance={walletBalance ?? 0}
        isDownloading={isDownloading}
        showLanguageSelection={false}
      />
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        variant={subscriptionModalVariant}
      />
    </div>
    </>
  );
};

export default AuraResult;
