import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FaceReadingResult.module.scss';
import { Toast } from '../../../../component';

const FaceReadingResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResult = localStorage.getItem('faceReadingResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        if (parsedResult.data) {
          setAnalysisData(parsedResult.data);
        } else {
          Toast.error('Invalid analysis data format');
          navigate('/aiwow/face-reading/instructions');
          return;
        }
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
  }, [navigate]);

  const tabs = [
    { id: 'overall', label: 'Overall' },
    { id: 'personality', label: 'Personality' },
    { id: 'aura', label: 'Aura' },
    { id: 'features', label: 'Features' },
    { id: 'cosmic', label: 'Cosmic' },
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
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Face Reading Analysis</h1>
      </header>

      <div className={styles.content}>
        {/* Face Image */}
        {faceImage && (
          <div className={styles.imageSection}>
            <img src={faceImage} alt="Face" className={styles.faceImage} />
          </div>
        )}

        {/* Overall Summary */}
        {overallReading.summary && (
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Overall Reading</h3>
            <p className={styles.summaryText}>{overallReading.summary}</p>
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
              {/* Strengths */}
              {overallReading?.strengths?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>✨ Strengths</h3>
                  <ul className={styles.list}>
                    {overallReading.strengths.map((strength, index) => (
                      <li key={index} className={styles.listItem}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Challenges */}
              {overallReading?.challenges?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>⚡ Challenges</h3>
                  <ul className={styles.list}>
                    {overallReading.challenges.map((challenge, index) => (
                      <li key={index} className={styles.listItem}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Life Advice */}
              {overallReading?.lifeAdvice && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>💡 Life Advice</h3>
                  <p className={styles.cardText}>{overallReading.lifeAdvice}</p>
                </div>
              )}

              {/* Career Suggestions */}
              {overallReading?.careerSuggestions?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>💼 Career Suggestions</h3>
                  <div className={styles.chipContainer}>
                    {overallReading.careerSuggestions.map((career, index) => (
                      <span key={index} className={styles.chip}>{career}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unique Traits */}
              {uniqueTraits?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>🌟 Unique Traits</h3>
                  <ul className={styles.list}>
                    {uniqueTraits.map((trait, index) => (
                      <li key={index} className={styles.listItem}>{trait}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Personality Tab */}
          {activeTab === 'personality' && (
            <div className={styles.section}>
              {personalityAnalysis && Object.entries(personalityAnalysis).map(([key, value]) => (
                value && (
                  <div key={key} className={styles.analysisCard}>
                    <div className={styles.cardHeader}>
                      <div>
                        <p className={styles.category}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <h3 className={styles.strength}>{value.level || 'N/A'}</h3>
                      </div>
                      <div className={styles.percentage}>{value.score || 0}%</div>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${value.score || 0}%` }}
                      ></div>
                    </div>
                    <p className={styles.description}>{value.description || ''}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Aura Tab */}
          {activeTab === 'aura' && (
            <div className={styles.section}>
              {auraColors && Object.entries(auraColors).map(([key, value]) => (
                value && (
                  <div key={key} className={styles.auraCard}>
                    <div className={styles.auraHeader}>
                      <div 
                        className={styles.colorCircle} 
                        style={{ backgroundColor: value.color?.toLowerCase() || '#ccc' }}
                      ></div>
                      <div className={styles.auraInfo}>
                        <h3 className={styles.auraColor}>{value.color || 'Unknown'}</h3>
                        <p className={styles.auraType}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                      </div>
                      <div className={styles.auraPercentage}>{value.percentage || 0}%</div>
                    </div>
                    <p className={styles.auraMeaning}>{value.meaning || ''}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className={styles.section}>
              {facialFeatures && Object.entries(facialFeatures).map(([key, value]) => (
                value && (
                  <div key={key} className={styles.featureCard}>
                    <h3 className={styles.featureTitle}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className={styles.featureShape}>
                      <strong>Shape:</strong> {value.shape || value.shapeType || 'N/A'}
                    </p>
                    <p className={styles.featureInterpretation}>{value.interpretation || ''}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Cosmic Tab */}
          {activeTab === 'cosmic' && (
            <div className={styles.section}>
              {/* Dominant Planet */}
              {cosmicConnections.dominantPlanet && (
                <div className={styles.cosmicCard}>
                  <h3 className={styles.cosmicTitle}>🪐 Dominant Planet</h3>
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
              )}

              {/* Zodiac Alignment */}
              {cosmicConnections.zodiacAlignment && (
                <div className={styles.cosmicCard}>
                  <h3 className={styles.cosmicTitle}>♈ Zodiac Alignment</h3>
                  <p className={styles.cosmicPlanet}>{cosmicConnections.zodiacAlignment.sign}</p>
                  <p className={styles.cosmicText}>{cosmicConnections.zodiacAlignment.description}</p>
                  {cosmicConnections.zodiacAlignment.compatibility && (
                    <p className={styles.compatibility}>
                      <strong>Compatible with:</strong> {cosmicConnections.zodiacAlignment.compatibility}
                    </p>
                  )}
                </div>
              )}

              {/* Elemental Energy */}
              {cosmicConnections.elementalEnergy && (
                <div className={styles.cosmicCard}>
                  <h3 className={styles.cosmicTitle}>🔥 Elemental Energy</h3>
                  <p className={styles.cosmicPlanet}>
                    {cosmicConnections.elementalEnergy.element} - {cosmicConnections.elementalEnergy.percentage}%
                  </p>
                  {cosmicConnections.elementalEnergy.characteristics && (
                    <div className={styles.chipContainer}>
                      {cosmicConnections.elementalEnergy.characteristics.map((char, index) => (
                        <span key={index} className={styles.chip}>{char}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spiritual Path */}
              {cosmicConnections.spiritualPath && (
                <div className={styles.cosmicCard}>
                  <h3 className={styles.cosmicTitle}>🕉️ Spiritual Path</h3>
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
              )}

              {/* Remedies */}
              {personalizedInsights.remedies && personalizedInsights.remedies.length > 0 && (
                <div className={styles.cosmicCard}>
                  <h3 className={styles.cosmicTitle}>🔮 Astrological Remedies</h3>
                  <ul className={styles.list}>
                    {personalizedInsights.remedies.map((remedy, index) => (
                      <li key={index} className={styles.listItem}>{remedy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Relationship Insights */}
        {overallReading.relationshipInsights && (
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>💕 Relationship Insights</h3>
            <p className={styles.insightText}>{overallReading.relationshipInsights}</p>
          </div>
        )}

        {/* Spiritual Guidance */}
        {overallReading.spiritualGuidance && (
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>🙏 Spiritual Guidance</h3>
            <p className={styles.insightText}>{overallReading.spiritualGuidance}</p>
          </div>
        )}

        <button 
          className={styles.consultButton}
          onClick={() => navigate('/talk-to-astrologer')}
        >
          Consult with Expert Astrologer
        </button>
      </div>
    </div>
  );
};

export default FaceReadingResult;
