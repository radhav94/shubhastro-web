import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import styles from './PalmistryResult.module.scss';
import { getPalmistryResult } from '../../../../services/appServices/aiWowService';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import DownloadReportModal from '../components/DownloadReportModal';
import { useAIWowDownload } from '../hooks/useAIWowDownload';

const LineDropdown = ({ title, subtitle, children, isOpen, onToggle, ttsText }) => (
  <div className={styles.lineDropdown} style={{ position: 'relative' }}>
    <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
      <TTSButton text={ttsText} />
    </span>
    <button className={styles.lineDropdownHeader} onClick={onToggle}>
      <div>
        <h3 className={styles.lineTitle}>{title}</h3>
        {subtitle && <p className={styles.lineSubtitle}>{subtitle}</p>}
      </div>
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none"
        className={`${styles.dropdownIcon} ${isOpen ? styles.dropdownIconOpen : ''}`}
      >
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
    {isOpen && <div className={styles.lineDropdownContent}>{children}</div>}
  </div>
);

const PalmistryResult = () => {
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openLines, setOpenLines] = useState({
    fate: false,
    heart: false,
    head: false,
    life: false,
    sun: false,
    mercury: false,
    marriage: false,
    travel: false
  });
  
  // Get data from Redux
  const reduxResult = useSelector((state) => state.aiwow.palmistry.result);
  const reduxResultId = useSelector((state) => state.aiwow.palmistry.resultId);
  const palmImage = useSelector((state) => state.aiwow.palmistry.image);

  console.log(reduxResult,"4567897654")

  const downloadResultData = useMemo(() => {
    if (!reduxResult) return null;
    if (reduxResult.featureName) return reduxResult;
    return { ...reduxResult, featureName: 'Palmistry Analysis' };
  }, [reduxResult]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    isAlreadyDownloaded, downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload, handleDirectDownload,
  } = useAIWowDownload({ resultData: downloadResultData });

  const toggleLine = (lineName) => {
    setOpenLines(prev => ({ ...prev, [lineName]: !prev[lineName] }));
  };

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
        const palmData = reduxResult.data || reduxResult;
        
        // Validate that we have the required fields
        if (palmData && (palmData.lines || palmData.overallReading)) {
          setResultData(palmData);
        } else {
          console.error('Invalid palmistry data structure:', palmData);
          Toast.error('Invalid analysis data. Please try again.');
          navigate('/ai-wow/ai-palmistry-scanner/hand-selection');
          return;
        }
        
        // Always fetch from backend if we have resultId to get latest pdfPath status
        const idToFetch = resultId || reduxResultId;
        if (idToFetch) {
          await fetchFromBackend(idToFetch);
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
        navigate('/ai-wow/ai-palmistry-scanner/hand-selection');
      }
    };

    loadResult();
  }, [resultId, reduxResult, reduxResultId, navigate]);
  
  const fetchFromBackend = async (id) => {
    try {
      const result = await getPalmistryResult(id);
      
      if (result.success) {
        const data = result.data?.data || result.data;
        // Preserve pdfPath from the response even if nested differently
        if (result.data?.pdfPath && !data?.pdfPath) {
          data.pdfPath = result.data.pdfPath;
        }
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
        <header className={styles.headerWrap}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate('/ai-wow')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className={styles.title}>Palmistry Analysis</h1>
          </div>
        </header>
        <PrimaryLoader />
      </div>
    );
  }

  // Show error state
  if (error || !resultData) {
    return (
      <div className={styles.container}>
        <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/ai-wow')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Palmistry Analysis</h1>
          </div>
        </header>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>
            {error || 'Unable to load analysis results. Please try again.'}
          </p>
          <button className={styles.retryButton} onClick={() => navigate('/ai-wow/ai-palmistry-scanner')}>
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
        <header className={styles.headerWrap}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate('/ai-wow')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className={styles.title}>Palmistry Analysis</h1>
          </div>
        </header>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>
            Incomplete analysis data. Please try analyzing your palm again.
          </p>
          <button className={styles.retryButton} onClick={() => navigate('/ai-wow/ai-palmistry-scanner')}>
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/ai-wow')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Palmistry Analysis</h1>
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

      <div className={styles.tabsContainerWrap}>
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
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <>
            <div className={styles.overviewLayout}>
              <div className={styles.imageSection}>
                {palmImage && (
                  <div className={styles.palmImageWrapper}>
                    <img src={palmImage} alt="Palm" className={styles.palmImage} />
                    <div className={styles.handBadge}>{hand === 'left' ? 'Left Hand' : 'Right Hand'}</div>
                  </div>
                )}
              </div>

              <div className={styles.contentSection}>
                <div className={styles.twoColumnGrid}>
                  <div className={styles.section} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Personality Type. ${typeof overallReading?.personalityType === 'string' ? overallReading.personalityType : 'No data available'}`} />
                    </span>
                    <h3 className={styles.sectionTitle}>Personality Type</h3>
                    <p className={styles.text}>
                      {typeof overallReading?.personalityType === 'string' 
                        ? overallReading.personalityType 
                        : 'No data available'}
                    </p>
                  </div>

                  <div className={styles.section} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Life Path. ${typeof overallReading?.lifePath === 'string' ? overallReading.lifePath : 'No data available'}`} />
                    </span>
                    <h3 className={styles.sectionTitle}>Life Path</h3>
                    <p className={styles.text}>
                      {typeof overallReading?.lifePath === 'string' 
                        ? overallReading.lifePath 
                        : 'No data available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.insightsWrapper}>
              <div className={styles.insightsCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Personalized Insights. ${overallReading?.personalizedInsights?.zodiacSign ? 'Zodiac Sign: ' + overallReading.personalizedInsights.zodiacSign + '. ' : ''}${overallReading?.personalizedInsights?.rulingPlanet ? 'Ruling Planet: ' + overallReading.personalizedInsights.rulingPlanet + '. ' : ''}${overallReading?.personalizedInsights?.elementalHandType ? 'Hand Type: ' + overallReading.personalizedInsights.elementalHandType + '. ' : ''}${overallReading?.personalizedInsights?.dominantMounts?.length > 0 ? 'Dominant Mounts: ' + overallReading.personalizedInsights.dominantMounts.join(', ') : ''}`} />
                </span>
                <h3 className={styles.insightsMainTitle}>Personalized Insights</h3>
                {overallReading?.personalizedInsights && typeof overallReading.personalizedInsights === 'object' ? (
                  <>
                    <div className={styles.insightsGrid}>
                      {overallReading.personalizedInsights.zodiacSign && (
                        <div className={styles.insightCard}>
                          <h4 className={styles.insightTitle}>Zodiac Sign</h4>
                          <p className={styles.insightText}>{overallReading.personalizedInsights.zodiacSign}</p>
                        </div>
                      )}
                      
                      {overallReading.personalizedInsights.rulingPlanet && (
                        <div className={styles.insightCard}>
                          <h4 className={styles.insightTitle}>Ruling Planet</h4>
                          <p className={styles.insightText}>{overallReading.personalizedInsights.rulingPlanet}</p>
                        </div>
                      )}
                      
                      {overallReading.personalizedInsights.elementalHandType && (
                        <div className={styles.insightCard}>
                          <h4 className={styles.insightTitle}>Hand Type</h4>
                          <p className={styles.insightText}>{overallReading.personalizedInsights.elementalHandType}</p>
                        </div>
                      )}
                      
                      {overallReading.personalizedInsights.dominantMounts?.length > 0 && (
                        <div className={styles.insightCard}>
                          <h4 className={styles.insightTitle}>Dominant Mounts</h4>
                          <ul className={styles.insightList}>
                            {overallReading.personalizedInsights.dominantMounts.map((mount, idx) => (
                              <li key={idx}>{mount}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={styles.section}>
                    <p className={styles.text}>
                      {typeof overallReading?.personalizedInsights === 'string' 
                        ? overallReading.personalizedInsights 
                        : 'No data available'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {overallReading?.personalizedInsights?.astrologyCorrelation && (
              <div className={styles.section} style={{ marginTop: '1rem', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Astrology Correlation. ${overallReading.personalizedInsights.astrologyCorrelation}`} />
                </span>
                <h4 className={styles.subsectionTitle}>Astrology Correlation</h4>
                <p className={styles.text}>{overallReading.personalizedInsights.astrologyCorrelation}</p>
              </div>
            )}

            {/* Astro Correlation in Overview */}
            {astroCorrelation && typeof astroCorrelation === 'object' && (
              <div className={styles.astroCorrelationSection}>
                {astroCorrelation.zodiacSign && (
                  <div className={styles.section} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Zodiac Sign. ${String(astroCorrelation.zodiacSign)}`} />
                    </span>
                    <h3 className={styles.sectionTitle}>Zodiac Sign</h3>
                    <p className={styles.text}>{String(astroCorrelation.zodiacSign)}</p>
                  </div>
                )}

                {astroCorrelation.elementalHandType && (
                  <div className={styles.section} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Hand Type. ${String(astroCorrelation.elementalHandType)}`} />
                    </span>
                    <h3 className={styles.sectionTitle}>Hand Type</h3>
                    <p className={styles.text}>{String(astroCorrelation.elementalHandType)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'lines' && (
          <>
            {/* Fate Line */}
            {lines?.fate?.interpretation && (
              <LineDropdown
                title="Fate Line"
                subtitle={lines.fate.interpretation.summary}
                isOpen={openLines.fate}
                onToggle={() => toggleLine('fate')}
                ttsText={`Fate Line. ${[lines.fate.interpretation.summary, lines.fate.interpretation.careerPath ? 'Career Path: ' + lines.fate.interpretation.careerPath : '', lines.fate.interpretation.lifePurpose ? 'Life Purpose: ' + lines.fate.interpretation.lifePurpose : '', lines.fate.interpretation.successTiming ? 'Success Timing: ' + lines.fate.interpretation.successTiming : '', lines.fate.interpretation.strengths?.length > 0 ? 'Strengths: ' + lines.fate.interpretation.strengths.join(', ') : '', lines.fate.interpretation.challenges?.length > 0 ? 'Challenges: ' + lines.fate.interpretation.challenges.join(', ') : ''].filter(Boolean).join('. ')}`}
              >
                <div className={styles.lineDetailsGrid}>
                  <div className={styles.lineDetailCard}>
                    <h4 className={styles.lineDetailTitle}>Career Path</h4>
                    <p className={styles.lineDetailText}>{lines.fate.interpretation.careerPath}</p>
                  </div>

                  <div className={styles.lineDetailCard}>
                    <h4 className={styles.lineDetailTitle}>Life Purpose</h4>
                    <p className={styles.lineDetailText}>{lines.fate.interpretation.lifePurpose}</p>
                  </div>

                  <div className={styles.lineDetailCard}>
                    <h4 className={styles.lineDetailTitle}>Success Timing</h4>
                    <p className={styles.lineDetailText}>{lines.fate.interpretation.successTiming}</p>
                  </div>

                  {lines.fate.interpretation.strengths?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Strengths</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.fate.interpretation.strengths.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.fate.interpretation.challenges?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Challenges</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.fate.interpretation.challenges.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {lines.fate.interpretation.remedies?.length > 0 && (
                  <div className={styles.remediesSection}>
                    <h4 className={styles.subsectionTitle}>Remedies</h4>
                    <ul className={styles.list}>
                      {lines.fate.interpretation.remedies.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </LineDropdown>
            )}

            {/* Heart Line */}
            {(lines?.heart?.detected || lines?.heart?.interpretation) && (
              <LineDropdown
                title="Heart Line"
                subtitle={lines.heart.interpretation?.summary}
                isOpen={openLines.heart}
                onToggle={() => toggleLine('heart')}
                ttsText={`Heart Line. ${[lines.heart.interpretation?.summary, lines.heart.interpretation?.emotionalNature ? 'Emotional Nature: ' + lines.heart.interpretation.emotionalNature : '', lines.heart.interpretation?.relationshipPattern ? 'Relationship Pattern: ' + lines.heart.interpretation.relationshipPattern : '', lines.heart.interpretation?.strengths?.length > 0 ? 'Strengths: ' + lines.heart.interpretation.strengths.join(', ') : '', lines.heart.interpretation?.challenges?.length > 0 ? 'Challenges: ' + lines.heart.interpretation.challenges.join(', ') : '', lines.heart.interpretation?.remedies?.length > 0 ? 'Remedies: ' + lines.heart.interpretation.remedies.join(', ') : ''].filter(Boolean).join('. ')}`}
              >
                <div className={styles.lineDetailsGrid}>
                  {lines.heart.interpretation?.emotionalNature && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Emotional Nature</h4>
                      <p className={styles.lineDetailText}>{lines.heart.interpretation.emotionalNature}</p>
                    </div>
                  )}

                  {lines.heart.interpretation?.relationshipPattern && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Relationship Pattern</h4>
                      <p className={styles.lineDetailText}>{lines.heart.interpretation.relationshipPattern}</p>
                    </div>
                  )}

                  {lines.heart.interpretation?.strengths?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Strengths</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.heart.interpretation.strengths.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.heart.interpretation?.challenges?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Challenges</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.heart.interpretation.challenges.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.heart.interpretation?.remedies?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Remedies</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.heart.interpretation.remedies.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </LineDropdown>
            )}

            {/* Head Line */}
            {(lines?.head?.detected || lines?.head?.interpretation) && (
              <LineDropdown
                title="Head Line"
                subtitle={lines.head.interpretation?.summary}
                isOpen={openLines.head}
                onToggle={() => toggleLine('head')}
                ttsText={`Head Line. ${[lines.head.interpretation?.summary, lines.head.interpretation?.thinkingStyle ? 'Thinking Style: ' + lines.head.interpretation.thinkingStyle : '', lines.head.interpretation?.intellectualDepth ? 'Intellectual Depth: ' + lines.head.interpretation.intellectualDepth : '', lines.head.interpretation?.careerAptitude ? 'Career Aptitude: ' + lines.head.interpretation.careerAptitude : '', lines.head.interpretation?.strengths?.length > 0 ? 'Strengths: ' + lines.head.interpretation.strengths.join(', ') : '', lines.head.interpretation?.challenges?.length > 0 ? 'Challenges: ' + lines.head.interpretation.challenges.join(', ') : ''].filter(Boolean).join('. ')}`}
              >
                <div className={styles.lineDetailsGrid}>
                  {lines.head.interpretation?.thinkingStyle && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Thinking Style</h4>
                      <p className={styles.lineDetailText}>{lines.head.interpretation.thinkingStyle}</p>
                    </div>
                  )}

                  {lines.head.interpretation?.intellectualDepth && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Intellectual Depth</h4>
                      <p className={styles.lineDetailText}>{lines.head.interpretation.intellectualDepth}</p>
                    </div>
                  )}

                  {lines.head.interpretation?.careerAptitude && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Career Aptitude</h4>
                      <p className={styles.lineDetailText}>{lines.head.interpretation.careerAptitude}</p>
                    </div>
                  )}

                  {lines.head.interpretation?.strengths?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Strengths</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.head.interpretation.strengths.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.head.interpretation?.challenges?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Challenges</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.head.interpretation.challenges.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </LineDropdown>
            )}

            {/* Life Line */}
            {(lines?.life?.detected || lines?.life?.interpretation) && (
              <LineDropdown
                title="Life Line"
                subtitle={lines.life.interpretation?.summary}
                isOpen={openLines.life}
                onToggle={() => toggleLine('life')}
                ttsText={`Life Line. ${[lines.life.interpretation?.summary, lines.life.interpretation?.vitalityLevel ? 'Vitality Level: ' + lines.life.interpretation.vitalityLevel : '', lines.life.interpretation?.healthIndicators?.length > 0 ? 'Health Indicators: ' + lines.life.interpretation.healthIndicators.join(', ') : '', lines.life.interpretation?.lifeEvents?.length > 0 ? 'Life Events: ' + lines.life.interpretation.lifeEvents.join(', ') : '', lines.life.interpretation?.strengths?.length > 0 ? 'Strengths: ' + lines.life.interpretation.strengths.join(', ') : '', lines.life.interpretation?.challenges?.length > 0 ? 'Challenges: ' + lines.life.interpretation.challenges.join(', ') : ''].filter(Boolean).join('. ')}`}
              >
                <div className={styles.lineDetailsGrid}>
                  {lines.life.interpretation?.vitalityLevel && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Vitality Level</h4>
                      <p className={styles.lineDetailText}>{lines.life.interpretation.vitalityLevel}</p>
                    </div>
                  )}

                  {lines.life.interpretation?.healthIndicators?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Health Indicators</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.life.interpretation.healthIndicators.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.life.interpretation?.lifeEvents?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Life Events</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.life.interpretation.lifeEvents.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.life.interpretation?.strengths?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Strengths</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.life.interpretation.strengths.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lines.life.interpretation?.challenges?.length > 0 && (
                    <div className={styles.lineDetailCard}>
                      <h4 className={styles.lineDetailTitle}>Challenges</h4>
                      <ul className={styles.lineDetailList}>
                        {lines.life.interpretation.challenges.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </LineDropdown>
            )}

            {/* Secondary Lines - 2 Column Grid (auto-binds any new keys from API) */}
            {resultData.secondaryLines && (
              <div className={styles.secondaryLinesGrid}>
                {Object.entries(resultData.secondaryLines).map(([key, lineData]) => {
                  if (!lineData || typeof lineData !== 'object') return null;
                  // Show if there's an interpretation or count
                  if (!lineData.interpretation && lineData.count == null) return null;

                  // Format key to readable title: "sunLine" -> "Sun Line", "marriageLines" -> "Marriage Lines"
                  const title = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, s => s.toUpperCase())
                    .trim();

                  return (
                    <div className={styles.lineCard} key={key} style={{ position: 'relative' }}>
                      
                      <div className={styles.lineHeader}>
                        <h3 className={styles.lineTitle}>{title}
                          <span style={{marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle'}}>
                            <TTSButton text={`${title}. ${lineData.interpretation || ''}`} />
                          </span>
                        </h3>
                        {lineData.count != null && (
                          <div className={styles.lineScore}>{lineData.count}</div>
                        )}
                      </div>
                      {lineData.interpretation && (
                        <p className={styles.text}>{lineData.interpretation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
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
          <div className={styles.personalityGrid}>
            <div className={styles.personalityCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`Personality Type. ${overallReading?.personalityType || 'No data available'}`} />
              </span>
              <h3 className={styles.personalityCardTitle}>Personality Type</h3>
              <p className={styles.personalityCardText}>{overallReading?.personalityType || 'No data available'}</p>
            </div>

            {lines?.heart?.detected && (
              <div className={styles.personalityCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`Emotional Nature. ${lines.heart.interpretation?.emotionalNature || 'No data available'}${lines.heart.interpretation?.strengths?.length > 0 ? '. Strengths: ' + lines.heart.interpretation.strengths.join(', ') : ''}${lines.heart.interpretation?.challenges?.length > 0 ? '. Challenges: ' + lines.heart.interpretation.challenges.join(', ') : ''}`} />
                </span>
                <h3 className={styles.personalityCardTitle}>Emotional Nature</h3>
                <p className={styles.personalityCardText}>{lines.heart.interpretation?.emotionalNature || 'No data available'}</p>
                
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
              <div className={styles.personalityCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Thinking Style. ${lines.head.interpretation?.thinkingStyle || 'No data available'}${lines.head.interpretation?.strengths?.length > 0 ? '. Strengths: ' + lines.head.interpretation.strengths.join(', ') : ''}`} />
                </span>
                <h3 className={styles.personalityCardTitle}>Thinking Style</h3>
                <p className={styles.personalityCardText}>{lines.head.interpretation?.thinkingStyle || 'No data available'}</p>
                
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
          </div>
        )}

        {activeTab === 'career' && (
          <div className={styles.careerGrid}>
            <div className={styles.careerCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`Career Guidance. ${overallReading?.careerGuidance || 'No data available'}`} />
              </span>
              <h3 className={styles.careerCardTitle}>Career Guidance</h3>
              <p className={styles.careerCardText}>{overallReading?.careerGuidance || 'No data available'}</p>
            </div>

            {lines?.head?.detected && (
              <div className={styles.careerCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Career Aptitude. ${lines.head.interpretation?.careerAptitude || 'No data available'}`} />
                </span>
                <h3 className={styles.careerCardTitle}>Career Aptitude</h3>
                <p className={styles.careerCardText}>{lines.head.interpretation?.careerAptitude || 'No data available'}</p>
              </div>
            )}

            {lines?.fate?.detected && (
              <>
                <div className={styles.careerCard} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                    <TTSButton text={`Career Path. ${lines.fate.interpretation?.careerPath || 'No data available'}`} />
                  </span>
                  <h3 className={styles.careerCardTitle}>Career Path</h3>
                  <p className={styles.careerCardText}>{lines.fate.interpretation?.careerPath || 'No data available'}</p>
                </div>

                <div className={styles.careerCard} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                    <TTSButton text={`Life Purpose. ${lines.fate.interpretation?.lifePurpose || 'No data available'}`} />
                  </span>
                  <h3 className={styles.careerCardTitle}>Life Purpose</h3>
                  <p className={styles.careerCardText}>{lines.fate.interpretation?.lifePurpose || 'No data available'}</p>
                </div>

                <div className={styles.careerCard} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                    <TTSButton text={`Success Timing. ${lines.fate.interpretation?.successTiming || 'No data available'}`} />
                  </span>
                  <h3 className={styles.careerCardTitle}>Success Timing</h3>
                  <p className={styles.careerCardText}>{lines.fate.interpretation?.successTiming || 'No data available'}</p>
                </div>
              </>
            )}

            <div className={styles.careerCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`Life Path. ${overallReading?.lifePath || 'No data available'}`} />
              </span>
              <h3 className={styles.careerCardTitle}>Life Path</h3>
              <p className={styles.careerCardText}>{overallReading?.lifePath || 'No data available'}</p>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className={styles.insightsTabGrid}>
            <div className={styles.insightTabCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`Relationship Advice. ${overallReading?.relationshipAdvice || 'No data available'}`} />
              </span>
              <h3 className={styles.insightTabCardTitle}>Relationship Advice</h3>
              <p className={styles.insightTabCardText}>{overallReading?.relationshipAdvice || 'No data available'}</p>
            </div>

            {overallReading?.healthIndicators?.length > 0 && (
              <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Health Indicators. ${overallReading.healthIndicators.join('. ')}`} />
                </span>
                <h3 className={styles.insightTabCardTitle}>Health Indicators</h3>
                <ul className={styles.list}>
                  {overallReading.healthIndicators.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {overallReading?.luckyPeriods?.length > 0 && (
              <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Lucky Periods. ${overallReading.luckyPeriods.join('. ')}`} />
                </span>
                <h3 className={styles.insightTabCardTitle}>Lucky Periods</h3>
                <ul className={styles.list}>
                  {overallReading.luckyPeriods.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {overallReading?.warnings?.length > 0 && (
              <div className={styles.warningCard} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                  <TTSButton text={`Important Warnings. ${overallReading.warnings.join('. ')}`} />
                </span>
                <h3 className={styles.insightTabCardTitle}>Important Warnings</h3>
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
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Zodiac Sign. ${astroCorrelation.zodiacSign}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Zodiac Sign</h3>
                    <p className={styles.insightTabCardText}>{astroCorrelation.zodiacSign}</p>
                  </div>
                )}

                {astroCorrelation.rulingPlanet && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Ruling Planet. ${astroCorrelation.rulingPlanet}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Ruling Planet</h3>
                    <p className={styles.insightTabCardText}>{astroCorrelation.rulingPlanet}</p>
                  </div>
                )}

                {astroCorrelation.elementalHandType && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Elemental Hand Type. ${astroCorrelation.elementalHandType}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Elemental Hand Type</h3>
                    <p className={styles.insightTabCardText}>{astroCorrelation.elementalHandType}</p>
                  </div>
                )}

                {astroCorrelation.dominantMounts?.length > 0 && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Dominant Mounts. ${astroCorrelation.dominantMounts.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ')}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Dominant Mounts</h3>
                    <ul className={styles.list}>
                      {astroCorrelation.dominantMounts.map((item, idx) => (
                        <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {astroCorrelation.astrologyCorrelation && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Astrology Correlation. ${astroCorrelation.astrologyCorrelation}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Astrology Correlation</h3>
                    <p className={styles.insightTabCardText}>{astroCorrelation.astrologyCorrelation}</p>
                  </div>
                )}

                {astroCorrelation.planetaryInfluences?.length > 0 && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Planetary Influences. ${astroCorrelation.planetaryInfluences.join('. ')}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Planetary Influences</h3>
                    <ul className={styles.list}>
                      {astroCorrelation.planetaryInfluences.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {astroCorrelation.dashaAlignment && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Dasha Alignment. ${astroCorrelation.dashaAlignment}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Dasha Alignment</h3>
                    <p className={styles.insightTabCardText}>{astroCorrelation.dashaAlignment}</p>
                  </div>
                )}

                {astroCorrelation.recommendations?.length > 0 && (
                  <div className={styles.insightTabCard} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                      <TTSButton text={`Recommendations. ${astroCorrelation.recommendations.join('. ')}`} />
                    </span>
                    <h3 className={styles.insightTabCardTitle}>Recommendations</h3>
                    <ul className={styles.list}>
                      {astroCorrelation.recommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <button 
          className={styles.consultButton}
          onClick={() => navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path)}
        >
          Consult with Expert Astrologer
        </button>
      </div>

      <DownloadReportModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleConfirmDownload}
        featureName="Palmistry Analysis Report"
        downloadCost={downloadPrice}
        walletBalance={walletBalance ?? 0}
        isDownloading={isDownloading}
        showLanguageSelection={false}
      />
    </div>
    </>
  );
};

export default PalmistryResult;
