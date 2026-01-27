import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuraResult.module.scss';
import { Toast } from '../../../../component';

const AuraResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResult = localStorage.getItem('auraResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        // Handle both nested data and direct response
        const data = parsedResult.data || parsedResult;
        if (data && (data.aura || data.astrologicalData)) {
          setAnalysisData(data);
        } else {
          Toast.error('Invalid analysis data format');
          navigate('/aiwow/aura/instructions');
          return;
        }
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/aura/instructions');
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/aura/instructions');
      return;
    }
    
    setLoading(false);
  }, [navigate]);

  const tabs = [
    { id: 'overall', label: 'Overall' },
    { id: 'colors', label: 'Aura Colors' },
    { id: 'chakras', label: 'Chakras' },
    { id: 'energy', label: 'Energy' },
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
          <button onClick={() => navigate('/aiwow/aura/instructions')}>
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
  const auraImage = imageUrl;
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
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Aura Analysis</h1>
      </header>

      <div className={styles.content}>
        {auraImage && (
          <div className={styles.imageSection}>
            <img src={auraImage} alt="Aura" className={styles.auraImage} />
          </div>
        )}

        {overallReading.summary && (
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Your Aura Reading</h3>
            <p className={styles.summaryText}>{overallReading.summary}</p>
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
              {dominantColor.color && (
                <div className={styles.dominantCard}>
                  <h3 className={styles.cardTitle}>🌟 Dominant Aura Color</h3>
                  <div className={styles.colorDisplay}>
                    <div 
                      className={styles.colorCircle} 
                      style={{ backgroundColor: dominantColor.color }}
                    ></div>
                    <div className={styles.colorInfo}>
                      <h4 className={styles.colorName}>
                        {dominantColor.color === '#FFD700' ? 'Gold' : 
                         dominantColor.color === '#FFA500' ? 'Orange' : 
                         dominantColor.color}
                      </h4>
                      <p className={styles.colorPercentage}>{dominantColor.percentage}%</p>
                    </div>
                  </div>
                  <p className={styles.colorMeaning}>{dominantColor.meaning}</p>
                </div>
              )}

              {astrologicalData.sunSign && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>♈ Astrological Profile</h3>
                  <div className={styles.chipContainer}>
                    <span className={styles.chip}>Sun: {astrologicalData.sunSign}</span>
                    <span className={styles.chip}>Element: {astrologicalData.element}</span>
                    <span className={styles.chip}>Planet: {astrologicalData.dominantPlanet}</span>
                    <span className={styles.chip}>Moon: {astrologicalData.moonPhase}</span>
                  </div>
                </div>
              )}

              {overallReading.strengths?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>✨ Strengths</h3>
                  <ul className={styles.list}>
                    {overallReading.strengths.map((strength, index) => (
                      <li key={index} className={styles.listItem}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {overallReading.challenges?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>⚡ Areas for Growth</h3>
                  <ul className={styles.list}>
                    {overallReading.challenges.map((challenge, index) => (
                      <li key={index} className={styles.listItem}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>💡 Recommendations</h3>
                  <ul className={styles.list}>
                    {recommendations.map((rec, index) => (
                      <li key={index} className={styles.listItem}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className={styles.section}>
              {auraColors?.length > 0 && auraColors.map((color, index) => (
                <div key={index} className={styles.auraCard}>
                  <div className={styles.auraHeader}>
                    <div 
                      className={styles.colorCircle} 
                      style={{ backgroundColor: color.color }}
                    ></div>
                    <div className={styles.auraInfo}>
                      <h3 className={styles.auraColor}>
                        {color.color === '#FFD700' ? 'Gold' : 
                         color.color === '#FFA500' ? 'Orange' : 
                         color.color}
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
          )}

          {activeTab === 'chakras' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>🌟 Planetary Influences</h3>
                <p className={styles.cardText}>
                  Your aura is influenced by planetary energies. Dominant planet: {astrologicalData.dominantPlanet}
                </p>
              </div>
              
              {astrologicalData.planetaryInfluences?.map((planet, index) => (
                <div key={index} className={styles.chakraCard}>
                  <div className={styles.chakraHeader}>
                    <div>
                      <h3 className={styles.chakraName}>{planet.planet}</h3>
                      <p className={styles.chakraLocation}>{planet.aspect}</p>
                    </div>
                    <div className={styles.chakraStatus}>
                      <span className={styles.statusBadge}>
                        {planet.influence}%
                      </span>
                    </div>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${planet.influence}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'energy' && (
            <div className={styles.section}>
              {energyLevel.overall && (
                <div className={styles.energyCard}>
                  <h3 className={styles.cardTitle}>⚡ Overall Energy Level</h3>
                  <div className={styles.energyMeter}>
                    <div className={styles.meterBar}>
                      <div 
                        className={styles.meterFill} 
                        style={{ width: `${energyLevel.overall}%` }}
                      ></div>
                    </div>
                    <p className={styles.energyValue}>{energyLevel.overall}%</p>
                  </div>
                  <p className={styles.energyDescription}>{energyLevel.description}</p>
                </div>
              )}

              {energyLevel.emotional && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>💖 Emotional Energy</h3>
                  <p className={styles.cardText}>{energyLevel.emotional}</p>
                </div>
              )}

              {energyLevel.mental && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>🧠 Mental Energy</h3>
                  <p className={styles.cardText}>{energyLevel.mental}</p>
                </div>
              )}

              {energyLevel.physical && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>💪 Physical Energy</h3>
                  <p className={styles.cardText}>{energyLevel.physical}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'spiritual' && (
            <div className={styles.section}>
              {spiritualInsights.path && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>🕉️ Spiritual Path</h3>
                  <p className={styles.cardText}>{spiritualInsights.path}</p>
                </div>
              )}

              {spiritualInsights.guidance && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>🌟 Spiritual Guidance</h3>
                  <p className={styles.cardText}>{spiritualInsights.guidance}</p>
                </div>
              )}

              {spiritualInsights.practices?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>🧘 Recommended Practices</h3>
                  <ul className={styles.list}>
                    {spiritualInsights.practices.map((practice, index) => (
                      <li key={index} className={styles.listItem}>{practice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {spiritualInsights.affirmations?.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>✨ Daily Affirmations</h3>
                  <ul className={styles.list}>
                    {spiritualInsights.affirmations.map((affirmation, index) => (
                      <li key={index} className={styles.listItem}>{affirmation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

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

export default AuraResult;
