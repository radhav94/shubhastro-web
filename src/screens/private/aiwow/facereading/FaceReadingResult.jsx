import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './FaceReadingResult.module.scss';
import { Toast, PieChart } from '../../../../component';
import Footer from '../../../../layouts/Footer';

const FaceReadingResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedGuidance, setExpandedGuidance] = useState(null);
  
  // Get data from Redux
  const reduxResult = useSelector((state) => state.aiwow.faceReading.result);
  const reduxImage = useSelector((state) => state.aiwow.faceReading.image);

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
        navigate('/aiwow/face-reading/instructions');
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/face-reading/instructions');
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
          <button onClick={() => navigate('/aiwow/face-reading/instructions')}>
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
        <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Face Reading Analysis</h1>
        </div>
      </header>

      <div className={styles.content}>
        {/* Face Image */}
        

        {/* Overall Summary */}
        {overallReading.summary && (
          <div className={styles.summaryCard}>

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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                    <div className={styles.insightCard}>
                      <h3 className={styles.insightTitle}>💕 Relationship Insights</h3>
                      <p className={styles.insightText}>{overallReading.relationshipInsights}</p>
                    </div>
                  )}

                  {overallReading.spiritualGuidance && (
                    <div className={styles.insightCard}>
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
                    <div key={key} className={styles.guidanceCard}>
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
                        <div key={key} className={styles.auraColorCard}>
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
                    <div key={key} className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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
                  <div className={styles.guidanceCard}>
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

                {/* Remedies */}
                {personalizedInsights.remedies && personalizedInsights.remedies.length > 0 && (
                  <div className={styles.guidanceCard}>
                    <button
                      onClick={() => setExpandedGuidance(expandedGuidance === 'cosmic-remedies' ? null : 'cosmic-remedies')}
                      className={styles.cosmicHeader}
                    >
                      <h3 className={styles.cardTitle}>🔮 Astrological Remedies</h3>
                      <span className={styles.cosmicArrow}>
                        {expandedGuidance === 'cosmic-remedies' ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.cosmicDropdown} ${expandedGuidance === 'cosmic-remedies' ? styles.expanded : ''}`}>
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
            onClick={() => navigate('/chat-with-astrologers')}
          >
            Consult with Expert Astrologer
          </button>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default FaceReadingResult;
