import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './PalmistryResult.module.scss';
import { getPalmistryResult } from '../../../../services/appServices/aiWowService';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { Toast } from '../../../../component';

const PalmistryResult = () => {
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get data from Redux
  const reduxResult = useSelector((state) => state.aiwow.palmistry.result);
  const reduxResultId = useSelector((state) => state.aiwow.palmistry.resultId);
  const palmImage = useSelector((state) => state.aiwow.palmistry.image);

  useEffect(() => {
    const loadResult = async () => {
      console.log('PalmistryResult - Loading result:', {
        hasReduxResult: !!reduxResult,
        reduxResultType: typeof reduxResult,
        reduxResultKeys: reduxResult ? Object.keys(reduxResult) : [],
        resultId,
        reduxResultId
      });
      
      // First, try Redux state
      if (reduxResult) {
        // Handle different data structures
        // API returns: { success: true, data: { lines, overallReading, ... } }
        // Redux stores: result.data (which is the palmistry data)
        const palmData = reduxResult.data || reduxResult;
        
        console.log('PalmistryResult - Processing palm data:', {
          hasPalmData: !!palmData,
          palmDataType: typeof palmData,
          palmDataKeys: palmData ? Object.keys(palmData) : [],
          hasLines: !!(palmData?.lines),
          hasOverallReading: !!(palmData?.overallReading)
        });
        
        // Validate that we have the required fields
        if (palmData && (palmData.lines || palmData.overallReading)) {
          setResultData(palmData);
        } else {
          console.error('Invalid palmistry data structure:', palmData);
          Toast.error('Invalid analysis data. Please try again.');
          navigate('/aiwow/palmistry/hand-selection');
          return;
        }
        
        // If we have resultId in URL but not in Redux, fetch from backend
        if (resultId && resultId !== reduxResultId) {
          await fetchFromBackend(resultId);
        }
        return;
      }
      
      // If no Redux data and we have resultId, fetch from backend
      if (resultId) {
        setIsLoading(true);
        await fetchFromBackend(resultId);
      } else {
        // No data available
        Toast.error('No analysis results found');
        navigate('/aiwow/palmistry/hand-selection');
      }
    };

    loadResult();
  }, [resultId, reduxResult, reduxResultId, navigate]);
  
  const fetchFromBackend = async (id) => {
    try {
      const result = await getPalmistryResult(id);
      
      if (result.success) {
        const data = result.data?.data || result.data;
        setResultData(data);
      } else {
        setError(result.error || 'Failed to load result');
        Toast.error('Failed to load result');
      }
    } catch (err) {
      console.error('Error fetching result:', err);
      setError('Failed to load result from server');
      Toast.error('Failed to load result from server');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'lines', label: 'Palm Lines' },
    { id: 'personality', label: 'Personality' },
    { id: 'career', label: 'Career & Life' },
    { id: 'insights', label: 'Insights' },
  ];

  // Show loader while fetching
  if (isLoading && !resultData) {
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
        <PrimaryLoader />
      </div>
    );
  }

  // Show error state
  if (error || !resultData) {
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
          <p className={styles.errorText}>
            {error || 'Unable to load analysis results. Please try again.'}
          </p>
          <button className={styles.retryButton} onClick={() => navigate('/aiwow/palmistry')}>
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  const { hand, lines, overallReading, astroCorrelation } = resultData || {};

  // Debug logging to see actual data structure
  console.log('PalmistryResult - Data structure:', {
    hasResultData: !!resultData,
    resultDataKeys: resultData ? Object.keys(resultData) : [],
    overallReadingType: typeof overallReading,
    overallReadingKeys: overallReading ? Object.keys(overallReading) : [],
    astroCorrelationType: typeof astroCorrelation,
    astroCorrelationKeys: astroCorrelation ? Object.keys(astroCorrelation) : [],
    astroCorrelationValue: astroCorrelation
  });

  // Safety checks for nested data with detailed logging
  if (!lines && !overallReading) {
    console.error('Missing required palmistry data:', {
      hasResultData: !!resultData,
      resultDataKeys: resultData ? Object.keys(resultData) : [],
      lines: lines,
      overallReading: overallReading
    });
    
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
          <p className={styles.errorText}>
            Incomplete analysis data. Please try analyzing your palm again.
          </p>
          <button className={styles.retryButton} onClick={() => navigate('/aiwow/palmistry')}>
            Start New Analysis
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

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personality Type</h3>
              <p className={styles.text}>
                {typeof overallReading?.personalityType === 'string' 
                  ? overallReading.personalityType 
                  : 'No data available'}
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Life Path</h3>
              <p className={styles.text}>
                {typeof overallReading?.lifePath === 'string' 
                  ? overallReading.lifePath 
                  : 'No data available'}
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personalized Insights</h3>
              <p className={styles.text}>
                {typeof overallReading?.personalizedInsights === 'string' 
                  ? overallReading.personalizedInsights 
                  : 'No data available'}
              </p>
            </div>

            {/* Astro Correlation in Overview */}
            {astroCorrelation && typeof astroCorrelation === 'object' && (
              <>
                {astroCorrelation.zodiacSign && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Zodiac Sign</h3>
                    <p className={styles.text}>{String(astroCorrelation.zodiacSign)}</p>
                  </div>
                )}

                {astroCorrelation.elementalHandType && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Hand Type</h3>
                    <p className={styles.text}>{String(astroCorrelation.elementalHandType)}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'lines' && (
          <>
            {/* Fate Line - Always show if interpretation exists */}
            {lines?.fate?.interpretation && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Fate Line</h3>
                </div>
                <p className={styles.lineSummary}>{lines.fate.interpretation.summary}</p>
                
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Career Path</h4>
                  <p className={styles.text}>{lines.fate.interpretation.careerPath}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Life Purpose</h4>
                  <p className={styles.text}>{lines.fate.interpretation.lifePurpose}</p>
                </div>

                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Success Timing</h4>
                  <p className={styles.text}>{lines.fate.interpretation.successTiming}</p>
                </div>

                {lines.fate.interpretation.strengths?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Strengths</h4>
                    <ul className={styles.list}>
                      {lines.fate.interpretation.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.fate.interpretation.challenges?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Challenges</h4>
                    <ul className={styles.list}>
                      {lines.fate.interpretation.challenges.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lines.fate.interpretation.remedies?.length > 0 && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Remedies</h4>
                    <ul className={styles.list}>
                      {lines.fate.interpretation.remedies.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Heart Line */}
            {(lines?.heart?.detected || lines?.heart?.interpretation) && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Heart Line</h3>
                </div>
                {lines.heart.interpretation?.summary && (
                  <p className={styles.lineSummary}>{lines.heart.interpretation.summary}</p>
                )}
                
                {lines.heart.interpretation?.emotionalNature && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Emotional Nature</h4>
                    <p className={styles.text}>{lines.heart.interpretation.emotionalNature}</p>
                  </div>
                )}

                {lines.heart.interpretation?.relationshipPattern && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Relationship Pattern</h4>
                    <p className={styles.text}>{lines.heart.interpretation.relationshipPattern}</p>
                  </div>
                )}

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

            {/* Head Line */}
            {(lines?.head?.detected || lines?.head?.interpretation) && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Head Line</h3>
                </div>
                {lines.head.interpretation?.summary && (
                  <p className={styles.lineSummary}>{lines.head.interpretation.summary}</p>
                )}
                
                {lines.head.interpretation?.thinkingStyle && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Thinking Style</h4>
                    <p className={styles.text}>{lines.head.interpretation.thinkingStyle}</p>
                  </div>
                )}

                {lines.head.interpretation?.intellectualDepth && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Intellectual Depth</h4>
                    <p className={styles.text}>{lines.head.interpretation.intellectualDepth}</p>
                  </div>
                )}

                {lines.head.interpretation?.careerAptitude && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Career Aptitude</h4>
                    <p className={styles.text}>{lines.head.interpretation.careerAptitude}</p>
                  </div>
                )}

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

            {/* Life Line */}
            {(lines?.life?.detected || lines?.life?.interpretation) && (
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <h3 className={styles.lineTitle}>Life Line</h3>
                </div>
                {lines.life.interpretation?.summary && (
                  <p className={styles.lineSummary}>{lines.life.interpretation.summary}</p>
                )}
                
                {lines.life.interpretation?.vitalityLevel && (
                  <div className={styles.subsection}>
                    <h4 className={styles.subsectionTitle}>Vitality Level</h4>
                    <p className={styles.text}>{lines.life.interpretation.vitalityLevel}</p>
                  </div>
                )}

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

            {/* Secondary Lines */}
            {resultData.secondaryLines && (
              <>
                {resultData.secondaryLines.sunLine?.interpretation && (
                  <div className={styles.lineCard}>
                    <div className={styles.lineHeader}>
                      <h3 className={styles.lineTitle}>Sun Line</h3>
                    </div>
                    <p className={styles.text}>{resultData.secondaryLines.sunLine.interpretation}</p>
                  </div>
                )}

                {resultData.secondaryLines.mercuryLine?.interpretation && (
                  <div className={styles.lineCard}>
                    <div className={styles.lineHeader}>
                      <h3 className={styles.lineTitle}>Mercury Line</h3>
                    </div>
                    <p className={styles.text}>{resultData.secondaryLines.mercuryLine.interpretation}</p>
                  </div>
                )}

                {resultData.secondaryLines.marriageLines?.count > 0 && (
                  <div className={styles.lineCard}>
                    <div className={styles.lineHeader}>
                      <h3 className={styles.lineTitle}>Marriage Lines</h3>
                      <div className={styles.lineScore}>{resultData.secondaryLines.marriageLines.count}</div>
                    </div>
                    <p className={styles.text}>{resultData.secondaryLines.marriageLines.interpretation}</p>
                  </div>
                )}

                {resultData.secondaryLines.travelLines?.count > 0 && (
                  <div className={styles.lineCard}>
                    <div className={styles.lineHeader}>
                      <h3 className={styles.lineTitle}>Travel Lines</h3>
                      <div className={styles.lineScore}>{resultData.secondaryLines.travelLines.count}</div>
                    </div>
                    <p className={styles.text}>{resultData.secondaryLines.travelLines.interpretation}</p>
                  </div>
                )}
              </>
            )}

            {/* Show message if no lines detected */}
            {!lines?.fate?.interpretation && 
             !lines?.heart?.detected && 
             !lines?.head?.detected && 
             !lines?.life?.detected && 
             !resultData.secondaryLines && (
              <div className={styles.noDataCard}>
                <p className={styles.noDataText}>No palm line data available. Please try capturing your palm again with better lighting.</p>
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
                {astroCorrelation.zodiacSign && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Zodiac Sign</h3>
                    <p className={styles.text}>{astroCorrelation.zodiacSign}</p>
                  </div>
                )}

                {astroCorrelation.rulingPlanet && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Ruling Planet</h3>
                    <p className={styles.text}>{astroCorrelation.rulingPlanet}</p>
                  </div>
                )}

                {astroCorrelation.elementalHandType && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Elemental Hand Type</h3>
                    <p className={styles.text}>{astroCorrelation.elementalHandType}</p>
                  </div>
                )}

                {astroCorrelation.dominantMounts?.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Dominant Mounts</h3>
                    <ul className={styles.list}>
                      {astroCorrelation.dominantMounts.map((item, idx) => (
                        <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {astroCorrelation.astrologyCorrelation && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Astrology Correlation</h3>
                    <p className={styles.text}>{astroCorrelation.astrologyCorrelation}</p>
                  </div>
                )}

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
