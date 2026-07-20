import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './FaceReadingResult.module.scss';
import { Toast, PieChart } from '../../../../component';
import TTSButton from '../../../../component/UI/TTSButton';
import DownloadReportModal from '../components/DownloadReportModal';
import { useAIWowDownload } from '../hooks/useAIWowDownload';
import { PATH } from '../../../../utils/routes/Paths';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';

const FaceReadingResult = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate('/ai-wow/astro-face-reading', { replace: true });
  const [activeTab, setActiveTab] = useState('overall');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedGuidance, setExpandedGuidance] = useState(null);
  
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
    return { ...result, featureName: 'astro-face-reading' };
  }, [reduxResult]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    isAlreadyDownloaded, downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload,
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

  const tabs = [
    { id: 'overall', label: 'Overall' },
    { id: 'personality', label: 'Personality' },
    { id: 'aura', label: 'Aura' },
    { id: 'features', label: 'Features' },
    { id: 'cosmic', label: 'Cosmic' },
    { id: 'insights', label: 'Insights' },
  ];

  // Prepare pie chart data for aura colors
  const auraChartData = useMemo(() => {
    if (!analysisData?.auraColors) return [];
    
    return Object.entries(analysisData.auraColors)
      .filter(([_, value]) => value && value.percentage)
      .map(([key, value]) => ({
        label: value.color || key.charAt(0).toUpperCase() + key.slice(1), // Use actual color name
        value: value.percentage,
        color: value.color?.toLowerCase() || '#ccc'
      }));
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

  const { 
    faceImage,
    personalityAnalysis = {},
    auraColors = {},
    facialFeatures = {},
    cosmicConnections = {},
    overallReading = {},
    uniqueTraits = [],
    personalizedInsights = {}
  } = analysisData;

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

      <div className={styles.content}>
        {/* Face Image */}
        

        {/* Overall Summary */}
        {overallReading.summary && (
          <div className={styles.summaryCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Overall Reading. ${overallReading.summary}`} />
            </span>

            {faceImage && (
              <div className={styles.imageSection}>
                <img src={faceImage} alt="Face" className={styles.faceImage} />
              </div>
            )}
            
            <div>
            <h3 className={styles.summaryTitle}>Overall Reading</h3>
            <p className={styles.summaryText}>{overallReading.summary}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Overall Tab */}
          {activeTab === 'overall' && (
            <div className={styles.section}>
              <div className={styles.guidanceGrid}>
                {/* Strengths */}
                {overallReading?.strengths?.length > 0 && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Strengths. ${overallReading.strengths.join('. ')}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'overall-strengths' ? null : 'overall-strengths')}
                      className={styles.guidanceHeader}
                    >
                      <h3 className={styles.cardTitle}>✨ Strengths</h3>
                      <span className={styles.guidanceArrow}>
                        {expandedGuidance === 'overall-strengths' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'overall-strengths' ? styles.expanded : ''}`}>
                      <ul className={styles.list}>
                        {overallReading.strengths.map((strength, index) => (
                          <li key={index} className={styles.listItem}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {overallReading?.challenges?.length > 0 && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Challenges. ${overallReading.challenges.join('. ')}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'overall-challenges' ? null : 'overall-challenges')}
                      className={styles.guidanceHeader}
                    >
                      <h3 className={styles.cardTitle}>⚡ Challenges</h3>
                      <span className={styles.guidanceArrow}>
                        {expandedGuidance === 'overall-challenges' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'overall-challenges' ? styles.expanded : ''}`}>
                      <ul className={styles.list}>
                        {overallReading.challenges.map((challenge, index) => (
                          <li key={index} className={styles.listItem}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Life Advice */}
                {overallReading?.lifeAdvice && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Life Advice. ${overallReading.lifeAdvice}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'overall-lifeAdvice' ? null : 'overall-lifeAdvice')}
                      className={styles.guidanceHeader}
                    >
                      <h3 className={styles.cardTitle}>💡 Life Advice</h3>
                      <span className={styles.guidanceArrow}>
                        {expandedGuidance === 'overall-lifeAdvice' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'overall-lifeAdvice' ? styles.expanded : ''}`}>
                      <p className={styles.cardText}>{overallReading.lifeAdvice}</p>
                    </div>
                  </div>
                )}

                {/* Career Suggestions */}
                {overallReading?.careerSuggestions?.length > 0 && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Career Suggestions. ${overallReading.careerSuggestions.join(', ')}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'overall-career' ? null : 'overall-career')}
                      className={styles.guidanceHeader}
                    >
                      <h3 className={styles.cardTitle}>💼 Career Suggestions</h3>
                      <span className={styles.guidanceArrow}>
                        {expandedGuidance === 'overall-career' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'overall-career' ? styles.expanded : ''}`}>
                      <div className={styles.chipContainer}>
                        {overallReading.careerSuggestions.map((career, index) => (
                          <span key={index} className={styles.chip}>{career}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Unique Traits */}
                {uniqueTraits?.length > 0 && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Unique Traits. ${uniqueTraits.join('. ')}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'overall-traits' ? null : 'overall-traits')}
                      className={styles.guidanceHeader}
                    >
                      <h3 className={styles.cardTitle}>🌟 Unique Traits</h3>
                      <span className={styles.guidanceArrow}>
                        {expandedGuidance === 'overall-traits' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'overall-traits' ? styles.expanded : ''}`}>
                      <ul className={styles.list}>
                        {uniqueTraits.map((trait, index) => (
                          <li key={index} className={styles.listItem}>{trait}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Relationship Insights & Spiritual Guidance */}
              {(overallReading.relationshipInsights || overallReading.spiritualGuidance) && (
                <div className={styles.insightsContainer}>
                  {overallReading.relationshipInsights && (
                    <div className={styles.insightCard} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                        <TTSButton text={`Relationship Insights. ${overallReading.relationshipInsights}`} />
                      </span>
                      <h3 className={styles.insightTitle}>💕 Relationship Insights</h3>
                      <p className={styles.insightText}>{overallReading.relationshipInsights}</p>
                    </div>
                  )}

                  {overallReading.spiritualGuidance && (
                    <div className={styles.insightCard} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                        <TTSButton text={`Spiritual Guidance. ${overallReading.spiritualGuidance}`} />
                      </span>
                      <h3 className={styles.insightTitle}>🙏 Spiritual Guidance</h3>
                      <p className={styles.insightText}>{overallReading.spiritualGuidance}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Personality Tab */}
          {activeTab === 'personality' && (
            <div className={styles.section}>
              <div className={styles.guidanceGrid}>
                {personalityAnalysis && Object.entries(personalityAnalysis).map(([key, value]) => (
                  value && (
                    <div key={key} className={styles.guidanceCard} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <TTSButton text={`${key.replace(/([A-Z])/g, ' $1').trim()}. ${value.level || ''}. ${value.description || ''}`} />
                      </span>
                      <button
                        onClick={() => setExpandedGuidance(expandedGuidance === `personality-${key}` ? null : `personality-${key}`)}
                        className={styles.guidanceHeader}
                      >
                        <div>
                          <p className={styles.category}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <h3 className={styles.strength}>{value.level || 'N/A'}</h3>
                        </div>
                        <div className={styles.headerRight}>
                          {/* <div className={styles.percentage}>{value.score || 0}%</div> */}
                          <span className={styles.guidanceArrow}>
                            {expandedGuidance === `personality-${key}` ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>
                      <div className={`${styles.guidanceContent} ${expandedGuidance === `personality-${key}` ? styles.expanded : ''}`}>
                        <p className={styles.description}>{value.description || ''}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Aura Tab */}
          {activeTab === 'aura' && (
            <div className={styles.section}>
              <div className={styles.auraContainer}>
                {/* Aura Colors List */}
                <div className={styles.auraColorsList}>
                  {auraColors && Object.entries(auraColors)
                    .sort((a, b) => {
                      // Sort order: primary (indigo), secondary (blue), tertiary (gold), quaternary (green)
                      const order = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3 };
                      return order[a[0]] - order[b[0]];
                    })
                    .map(([key, value]) => (
                      value && (
                        <div key={key} className={styles.auraColorCard} style={{ position: 'relative' }}>
                          <button
                            onClick={() => setExpandedGuidance(expandedGuidance === `aura-${key}` ? null : `aura-${key}`)}
                            className={styles.auraColorHeader}
                          >
                            <div className={styles.auraHeaderContent}>
                              <div 
                                className={styles.colorCircle} 
                                style={{ backgroundColor: value.color?.toLowerCase() || '#ccc' }}
                              ></div>
                              <div className={styles.auraInfo}>
                                <h3 className={styles.auraColor}>{value.color || 'Unknown'}</h3>
                                <p className={styles.auraType}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                              </div>
                            </div>
                            <div className={styles.headerRight}>
                              <div className={styles.auraPercentage}>{value.percentage || 0}%</div>
                              <span className={styles.guidanceArrow}>
                                {expandedGuidance === `aura-${key}` ? '▲' : '▼'}
                              </span>
                            </div>
                          </button>
                          <span style={{ position: 'absolute', top: '12px', right: '100px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            <TTSButton text={`${key.charAt(0).toUpperCase() + key.slice(1)} Aura. ${value.color || 'Unknown'}. ${value.percentage || 0} percent. ${value.meaning || ''}`} />
                          </span>
                          <div className={`${styles.guidanceContent} ${expandedGuidance === `aura-${key}` ? styles.expanded : ''}`}>
                            <p className={styles.auraMeaning}>{value.meaning || ''}</p>
                          </div>
                        </div>
                      )
                    ))}
                </div>

                {/* Pie Chart */}
                {auraChartData.length > 0 && (
                  <div className={styles.auraPieChartContainer}>
                    <PieChart 
                      data={auraChartData}
                      title="Aura Distribution"
                      showLegend={false}
                      height={280}
                      className={styles.auraPieChart}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className={styles.section}>
              <div className={styles.guidanceGrid}>
                {facialFeatures && Object.entries(facialFeatures).map(([key, value]) => (
                  value && (
                    <div key={key} className={styles.guidanceCard} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <TTSButton text={`${key.replace(/([A-Z])/g, ' $1').trim()}. Shape: ${value.shape || value.shapeType || 'N/A'}. ${value.interpretation || ''}`} />
                      </span>
                      <button
                        onClick={() => setExpandedGuidance(expandedGuidance === `feature-${key}` ? null : `feature-${key}`)}
                        className={styles.guidanceHeader}
                      >
                        <h3 className={styles.cardTitle}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <span className={styles.guidanceArrow}>
                          {expandedGuidance === `feature-${key}` ? '▲' : '▼'}
                        </span>
                      </button>
                      <div className={`${styles.guidanceContent} ${expandedGuidance === `feature-${key}` ? styles.expanded : ''}`}>
                        <p className={styles.featureShape}>
                          <strong>Shape:</strong> {value.shape || value.shapeType || 'N/A'}
                        </p>
                        <p className={styles.featureInterpretation}>{value.interpretation || ''}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Cosmic Tab */}
          {activeTab === 'cosmic' && (
            <div className={styles.section}>
              <div className={styles.guidanceGrid}>
                {/* Dominant Planet */}
                {cosmicConnections.dominantPlanet && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Dominant Planet. ${cosmicConnections.dominantPlanet.planet}. ${cosmicConnections.dominantPlanet.influence}${cosmicConnections.dominantPlanet.traits ? '. Traits: ' + cosmicConnections.dominantPlanet.traits.join(', ') : ''}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'cosmic-planet' ? null : 'cosmic-planet')}
                      className={styles.cosmicHeader}
                    >
                      <h3 className={styles.cardTitle}>🪐 Dominant Planet</h3>
                      <span className={styles.cosmicArrow}>
                        {expandedGuidance === 'cosmic-planet' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cosmicDropdown} ${expandedGuidance === 'cosmic-planet' ? styles.expanded : ''}`}>
                      <p className={styles.cosmicPlanet}>{cosmicConnections.dominantPlanet.planet}</p>
                      <p className={styles.cosmicText}>{cosmicConnections.dominantPlanet.influence}</p>
                      {cosmicConnections.dominantPlanet.traits && (
                        <div className={styles.chipContainer}>
                          {cosmicConnections.dominantPlanet.traits.map((trait, index) => (
                            <span key={index} className={styles.chip}>{trait}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Zodiac Alignment */}
                {cosmicConnections.zodiacAlignment && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Zodiac Alignment. ${cosmicConnections.zodiacAlignment.sign}. ${cosmicConnections.zodiacAlignment.description}${cosmicConnections.zodiacAlignment.compatibility ? '. Compatible with: ' + cosmicConnections.zodiacAlignment.compatibility : ''}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'cosmic-zodiac' ? null : 'cosmic-zodiac')}
                      className={styles.cosmicHeader}
                    >
                      <h3 className={styles.cardTitle}>♈ Zodiac Alignment</h3>
                      <span className={styles.cosmicArrow}>
                        {expandedGuidance === 'cosmic-zodiac' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cosmicDropdown} ${expandedGuidance === 'cosmic-zodiac' ? styles.expanded : ''}`}>
                      <p className={styles.cosmicPlanet}>{cosmicConnections.zodiacAlignment.sign}</p>
                      <p className={styles.cosmicText}>{cosmicConnections.zodiacAlignment.description}</p>
                      {cosmicConnections.zodiacAlignment.compatibility && (
                        <p className={styles.compatibility}>
                          <strong>Compatible with:</strong> {cosmicConnections.zodiacAlignment.compatibility}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Elemental Energy */}
                {cosmicConnections.elementalEnergy && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Elemental Energy. ${cosmicConnections.elementalEnergy.element}${cosmicConnections.elementalEnergy.characteristics ? '. ' + cosmicConnections.elementalEnergy.characteristics.join(', ') : ''}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'cosmic-element' ? null : 'cosmic-element')}
                      className={styles.cosmicHeader}
                    >
                      <h3 className={styles.cardTitle}>🔥 Elemental Energy</h3>
                      <span className={styles.cosmicArrow}>
                        {expandedGuidance === 'cosmic-element' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cosmicDropdown} ${expandedGuidance === 'cosmic-element' ? styles.expanded : ''}`}>
                      <p className={styles.cosmicPlanet}>
                        {cosmicConnections.elementalEnergy.element}
                      </p>
                      {cosmicConnections.elementalEnergy.characteristics && (
                        <div className={styles.chipContainer}>
                          {cosmicConnections.elementalEnergy.characteristics.map((char, index) => (
                            <span key={index} className={styles.chip}>{char}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spiritual Path */}
                {cosmicConnections.spiritualPath && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Spiritual Path. ${cosmicConnections.spiritualPath.path}${cosmicConnections.spiritualPath.guidance ? '. Guidance: ' + cosmicConnections.spiritualPath.guidance : ''}${cosmicConnections.spiritualPath.practices ? '. Practices: ' + cosmicConnections.spiritualPath.practices.join(', ') : ''}`} />
                    </span>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'cosmic-spiritual' ? null : 'cosmic-spiritual')}
                      className={styles.cosmicHeader}
                    >
                      <h3 className={styles.cardTitle}>🕉️ Spiritual Path</h3>
                      <span className={styles.cosmicArrow}>
                        {expandedGuidance === 'cosmic-spiritual' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cosmicDropdown} ${expandedGuidance === 'cosmic-spiritual' ? styles.expanded : ''}`}>
                      <p className={styles.cosmicText}>{cosmicConnections.spiritualPath.path}</p>
                      {cosmicConnections.spiritualPath.guidance && (
                        <>
                          <p className={styles.cosmicSubtitle}>Guidance:</p>
                          <p className={styles.cosmicText}>{cosmicConnections.spiritualPath.guidance}</p>
                        </>
                      )}
                      {cosmicConnections.spiritualPath.practices && (
                        <>
                          <p className={styles.cosmicSubtitle}>Recommended Practices:</p>
                          <ul className={styles.list}>
                            {cosmicConnections.spiritualPath.practices.map((practice, index) => (
                              <li key={index} className={styles.listItem}>{practice}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className={styles.section}>
              <div className={styles.guidanceGrid}>
                {personalizedInsights.birthChartCorrelation && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Birth Chart Correlation. ${personalizedInsights.birthChartCorrelation}`} />
                    </span>
                    <button onClick={() => setExpandedGuidance(expandedGuidance === 'insight-birthchart' ? null : 'insight-birthchart')} className={styles.guidanceHeader}>
                      <h3 className={styles.cardTitle}>📜 Birth Chart Correlation</h3>
                      <span className={styles.guidanceArrow}>{expandedGuidance === 'insight-birthchart' ? '▲' : '▼'}</span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'insight-birthchart' ? styles.expanded : ''}`}>
                      <p className={styles.cardText}>{personalizedInsights.birthChartCorrelation}</p>
                    </div>
                  </div>
                )}
                {personalizedInsights.planetaryInfluenceOnFace && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Planetary Influence on Face. ${personalizedInsights.planetaryInfluenceOnFace}`} />
                    </span>
                    <button onClick={() => setExpandedGuidance(expandedGuidance === 'insight-planetary' ? null : 'insight-planetary')} className={styles.guidanceHeader}>
                      <h3 className={styles.cardTitle}>🌍 Planetary Influence on Face</h3>
                      <span className={styles.guidanceArrow}>{expandedGuidance === 'insight-planetary' ? '▲' : '▼'}</span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'insight-planetary' ? styles.expanded : ''}`}>
                      <p className={styles.cardText}>{personalizedInsights.planetaryInfluenceOnFace}</p>
                    </div>
                  </div>
                )}
                {personalizedInsights.karmaReflection && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Karma Reflection. ${personalizedInsights.karmaReflection}`} />
                    </span>
                    <button onClick={() => setExpandedGuidance(expandedGuidance === 'insight-karma' ? null : 'insight-karma')} className={styles.guidanceHeader}>
                      <h3 className={styles.cardTitle}>☸️ Karma Reflection</h3>
                      <span className={styles.guidanceArrow}>{expandedGuidance === 'insight-karma' ? '▲' : '▼'}</span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'insight-karma' ? styles.expanded : ''}`}>
                      <p className={styles.cardText}>{personalizedInsights.karmaReflection}</p>
                    </div>
                  </div>
                )}
                {personalizedInsights.lifePathAlignment && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Life Path Alignment. ${personalizedInsights.lifePathAlignment}`} />
                    </span>
                    <button onClick={() => setExpandedGuidance(expandedGuidance === 'insight-lifepath' ? null : 'insight-lifepath')} className={styles.guidanceHeader}>
                      <h3 className={styles.cardTitle}>🛤️ Life Path Alignment</h3>
                      <span className={styles.guidanceArrow}>{expandedGuidance === 'insight-lifepath' ? '▲' : '▼'}</span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'insight-lifepath' ? styles.expanded : ''}`}>
                      <p className={styles.cardText}>{personalizedInsights.lifePathAlignment}</p>
                    </div>
                  </div>
                )}
                {personalizedInsights.remedies?.length > 0 && (
                  <div className={styles.guidanceCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`Astrological Remedies. ${personalizedInsights.remedies.join('. ')}`} />
                    </span>
                    <button onClick={() => setExpandedGuidance(expandedGuidance === 'insight-remedies' ? null : 'insight-remedies')} className={styles.guidanceHeader}>
                      <h3 className={styles.cardTitle}>🔮 Astrological Remedies</h3>
                      <span className={styles.guidanceArrow}>{expandedGuidance === 'insight-remedies' ? '▲' : '▼'}</span>
                    </button>
                    <div className={`${styles.guidanceContent} ${expandedGuidance === 'insight-remedies' ? styles.expanded : ''}`}>
                      <ul className={styles.list}>
                        {personalizedInsights.remedies.map((remedy, index) => (
                          <li key={index} className={styles.listItem}>{remedy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='text-center'>
          <button 
            className={styles.consultButton}
            onClick={() => navigate(PATH.privateRoutes.ASTROLOGERS_LIST.path)}
          >
            Consult with Expert Astrologer
          </button>
        </div>
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
    </div>
    </>
  );
};

export default FaceReadingResult;
