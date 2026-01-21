import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PalmistryResult.module.scss';

const PalmistryResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [resultData, setResultData] = useState(null);
  const [palmImage, setPalmImage] = useState(null);

  useEffect(() => {
    // Get result data from localStorage
    const storedResult = localStorage.getItem('palmistryResult');
    const storedImage = localStorage.getItem('palmistryImage');
    
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        // Extract data from API response structure
        const data = parsed.data || parsed;
        setResultData(data);
      } catch (error) {
        console.error('Error parsing palmistry result:', error);
      }
    }
    if (storedImage) {
      setPalmImage(storedImage);
    }
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'lines', label: 'Palm Lines' },
    { id: 'personality', label: 'Personality' },
    { id: 'career', label: 'Career & Life' },
    { id: 'insights', label: 'Insights' },
  ];

  if (!resultData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading results...</div>
      </div>
    );
  }

  const { hand, qualityScore, lines, overallReading, astroCorrelation } = resultData;

  // Safety checks for nested data
  if (!lines || !overallReading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Palmistry Analysis</h1>
        </header>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>Unable to load analysis results. Please try again.</p>
          <button className={styles.retryButton} onClick={() => navigate('/aiwow/palmistry')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Palmistry Analysis</h1>
      </header>

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

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <>
            <div className={styles.imageSection}>
              {palmImage && (
                <div className={styles.palmImageWrapper}>
                  <img src={palmImage} alt="Palm" className={styles.palmImage} />
                  <div className={styles.handBadge}>{hand === 'left' ? 'Left Hand' : 'Right Hand'}</div>
                </div>
              )}
            </div>

            <div className={styles.scoreCard}>
              <div className={styles.scoreHeader}>
                <h3 className={styles.scoreTitle}>Quality Score</h3>
                <div className={styles.scoreValue}>{qualityScore || 0}%</div>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${qualityScore || 0}%` }}></div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personality Type</h3>
              <p className={styles.text}>{overallReading?.personalityType || 'No data available'}</p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Life Path</h3>
              <p className={styles.text}>{overallReading?.lifePath || 'No data available'}</p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personalized Insights</h3>
              <p className={styles.text}>{overallReading?.personalizedInsights || 'No data available'}</p>
            </div>
          </>
        )}

        {activeTab === 'lines' && (
          <>
            {lines?.heart?.detected && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Heart Line</h3>
                  <div className={styles.lineScore}>{lines.heart.score || 0}%</div>
                </div>
                <p className={styles.lineSummary}>{lines.heart.interpretation?.summary || ''}</p>
                
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Emotional Nature</h4>
                  <p className={styles.text}>{lines.heart.interpretation?.emotionalNature || 'No data available'}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Relationship Pattern</h4>
                  <p className={styles.text}>{lines.heart.interpretation?.relationshipPattern || 'No data available'}</p>
                </div>

                {lines.heart.interpretation?.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.heart.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.heart.interpretation?.challenges?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Challenges</h4>
                    <ul className={styles.list}>
                      {lines.heart.interpretation.challenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.heart.interpretation?.remedies?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Remedies</h4>
                    <ul className={styles.list}>
                      {lines.heart.interpretation.remedies.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {lines?.head?.detected && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Head Line</h3>
                  <div className={styles.lineScore}>{lines.head.score || 0}%</div>
                </div>
                <p className={styles.lineSummary}>{lines.head.interpretation?.summary || ''}</p>
                
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Thinking Style</h4>
                  <p className={styles.text}>{lines.head.interpretation?.thinkingStyle || 'No data available'}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Intellectual Depth</h4>
                  <p className={styles.text}>{lines.head.interpretation?.intellectualDepth || 'No data available'}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Career Aptitude</h4>
                  <p className={styles.text}>{lines.head.interpretation?.careerAptitude || 'No data available'}</p>
                </div>

                {lines.head.interpretation?.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.head.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.head.interpretation?.challenges?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Challenges</h4>
                    <ul className={styles.list}>
                      {lines.head.interpretation.challenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {lines?.life?.detected && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Life Line</h3>
                  <div className={styles.lineScore}>{lines.life.score || 0}%</div>
                </div>
                <p className={styles.lineSummary}>{lines.life.interpretation?.summary || ''}</p>
                
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Vitality Level</h4>
                  <p className={styles.text}>{lines.life.interpretation?.vitalityLevel || 'No data available'}</p>
                </div>

                {lines.life.interpretation?.healthIndicators?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Health Indicators</h4>
                    <ul className={styles.list}>
                      {lines.life.interpretation.healthIndicators.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.life.interpretation?.lifeEvents?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Life Events</h4>
                    <ul className={styles.list}>
                      {lines.life.interpretation.lifeEvents.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.life.interpretation?.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.life.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.life.interpretation?.challenges?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Challenges</h4>
                    <ul className={styles.list}>
                      {lines.life.interpretation.challenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {lines?.fate?.detected && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Fate Line</h3>
                  <div className={styles.lineScore}>{lines.fate.score || 0}%</div>
                </div>
                <p className={styles.lineSummary}>{lines.fate.interpretation?.summary || ''}</p>
                
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Career Path</h4>
                  <p className={styles.text}>{lines.fate.interpretation?.careerPath || 'No data available'}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Life Purpose</h4>
                  <p className={styles.text}>{lines.fate.interpretation?.lifePurpose || 'No data available'}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Success Timing</h4>
                  <p className={styles.text}>{lines.fate.interpretation?.successTiming || 'No data available'}</p>
                </div>

                {lines.fate.interpretation?.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.fate.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.fate.interpretation?.challenges?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Challenges</h4>
                    <ul className={styles.list}>
                      {lines.fate.interpretation.challenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'personality' && (
          <>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personality Type</h3>
              <p className={styles.text}>{overallReading?.personalityType || 'No data available'}</p>
            </div>

            {lines?.heart?.detected && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Emotional Nature</h3>
                <p className={styles.text}>{lines.heart.interpretation?.emotionalNature || 'No data available'}</p>
                
                {lines.heart.interpretation?.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.heart.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.heart.interpretation?.challenges?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Challenges</h4>
                    <ul className={styles.list}>
                      {lines.heart.interpretation.challenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {lines?.head?.detected && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Thinking Style</h3>
                <p className={styles.text}>{lines.head.interpretation?.thinkingStyle || 'No data available'}</p>
                
                {lines.head.interpretation?.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.head.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'career' && (
          <>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Career Guidance</h3>
              <p className={styles.text}>{overallReading?.careerGuidance || 'No data available'}</p>
            </div>

            {lines?.head?.detected && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Career Aptitude</h3>
                <p className={styles.text}>{lines.head.interpretation?.careerAptitude || 'No data available'}</p>
              </div>
            )}

            {lines?.fate?.detected && (
              <>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Career Path</h3>
                  <p className={styles.text}>{lines.fate.interpretation?.careerPath || 'No data available'}</p>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Life Purpose</h3>
                  <p className={styles.text}>{lines.fate.interpretation?.lifePurpose || 'No data available'}</p>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Success Timing</h3>
                  <p className={styles.text}>{lines.fate.interpretation?.successTiming || 'No data available'}</p>
                </div>
              </>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Life Path</h3>
              <p className={styles.text}>{overallReading?.lifePath || 'No data available'}</p>
            </div>
          </>
        )}

        {activeTab === 'insights' && (
          <>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Relationship Advice</h3>
              <p className={styles.text}>{overallReading?.relationshipAdvice || 'No data available'}</p>
            </div>

            {overallReading?.healthIndicators?.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Health Indicators</h3>
                <ul className={styles.list}>
                  {overallReading.healthIndicators.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {overallReading?.luckyPeriods?.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Lucky Periods</h3>
                <ul className={styles.list}>
                  {overallReading.luckyPeriods.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {overallReading?.warnings?.length > 0 && (
              <div className={styles.warningCard}>
                <h3 className={styles.cardTitle}>Important Warnings</h3>
                <ul className={styles.list}>
                  {overallReading.warnings.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {astroCorrelation && (
              <>
                {astroCorrelation.planetaryInfluences?.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Planetary Influences</h3>
                    <ul className={styles.list}>
                      {astroCorrelation.planetaryInfluences.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {astroCorrelation.dashaAlignment && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Dasha Alignment</h3>
                    <p className={styles.text}>{astroCorrelation.dashaAlignment}</p>
                  </div>
                )}

                {astroCorrelation.recommendations?.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Recommendations</h3>
                    <ul className={styles.list}>
                      {astroCorrelation.recommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PalmistryResult;
