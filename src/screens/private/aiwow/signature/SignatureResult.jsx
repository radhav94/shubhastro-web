import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './SignatureResult.module.scss';
import { Toast } from '../../../../component';

const SignatureResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get data from Redux
  const reduxResult = useSelector((state) => state.aiwow.signature.result);
  const reduxImage = useSelector((state) => state.aiwow.signature.image);

  useEffect(() => {
    console.log('SignatureResult - Loading result:', {
      hasReduxResult: !!reduxResult,
      reduxResultType: typeof reduxResult,
      reduxResultKeys: reduxResult ? Object.keys(reduxResult) : [],
      hasReduxImage: !!reduxImage
    });

    if (reduxResult) {
      try {
        // Handle nested data structure
        const apiData = reduxResult.data || reduxResult;
        
        console.log('SignatureResult - Processing data:', {
          hasApiData: !!apiData,
          apiDataKeys: apiData ? Object.keys(apiData) : [],
          hasQualityMetrics: !!(apiData.qualityMetrics),
          hasStrokeAnalysis: !!(apiData.strokeAnalysis)
        });
        
        setResultData({
          image: apiData.signatureImage || reduxImage,
          quality: apiData.qualityMetrics || {},
          stroke: apiData.strokeAnalysis || {},
          letter: apiData.letterAnalysis || {},
          baseline: apiData.baselineAnalysis || {},
          style: apiData.overallStyle || {},
          personality: apiData.personalityInsights || {},
          detailed: apiData.detailedAnalysis || {},
          confidenceScore: apiData.confidenceScore || 95,
          metadata: apiData.metadata || {},
        });
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/signature/instructions');
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/signature/instructions');
      return;
    }
    
    setLoading(false);
  }, [reduxResult, reduxImage, navigate]);

  const renderOverview = () => (
    <div className={styles.tabContent}>
      <div className={styles.overviewGrid}>
        <div className={styles.signatureImageWrapper}>
          <img src={resultData.image} alt="Signature" className={styles.signatureImage} />
          <div className={styles.cornerTopLeft}></div>
          <div className={styles.cornerTopRight}></div>
          <div className={styles.cornerBottomLeft}></div>
          <div className={styles.cornerBottomRight}></div>
        </div>

        <div className={styles.qualityCard}>
          <h3 className={styles.cardTitle}>Quality Metrics</h3>
          <div className={styles.scoreGrid}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Overall Quality</span>
              <span className={styles.scoreValue}>{resultData.quality.overallQuality}%</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Clarity</span>
              <span className={styles.scoreValue}>{resultData.quality.clarity}%</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Contrast</span>
              <span className={styles.scoreValue}>{resultData.quality.contrast}%</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Completeness</span>
              <span className={styles.scoreValue}>{resultData.quality.completeness}%</span>
            </div>
          </div>
          <div className={styles.acceptableStatus}>
            <span className={styles.statusLabel}>Status:</span>
            <span className={`${styles.statusValue} ${resultData.quality.isAcceptable ? styles.acceptable : styles.notAcceptable}`}>
              {resultData.quality.isAcceptable ? 'Acceptable' : 'Not Acceptable'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.styleCard}>
        <h3 className={styles.cardTitle}>Overall Style</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>Legibility Score:</span>
          <span className={styles.value}>{resultData.style.legibility?.score}%</span>
        </div>
        <p className={styles.description}>{resultData.style.legibility?.description}</p>
        
        <div className={styles.infoRow}>
          <span className={styles.label}>Uniqueness Score:</span>
          <span className={styles.value}>{resultData.style.uniqueness?.score}%</span>
        </div>
        <p className={styles.description}>{resultData.style.uniqueness?.description}</p>
        
        <div className={styles.infoRow}>
          <span className={styles.label}>Formality:</span>
          <span className={styles.value}>{resultData.style.formality}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Complexity:</span>
          <span className={styles.value}>{resultData.style.complexity}</span>
        </div>
        
        {resultData.style.characteristics && resultData.style.characteristics.length > 0 && (
          <>
            <h4 className={styles.subTitle}>Key Characteristics</h4>
            <div className={styles.characteristicsTags}>
              {resultData.style.characteristics.map((char, index) => (
                <span key={index} className={styles.tag}>{char}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStrokeAnalysis = () => (
    <div className={styles.tabContent}>
      <div className={styles.analysisCard}>
        <h3 className={styles.cardTitle}>Stroke Analysis</h3>
        
        <div className={styles.analysisGrid}>
          {resultData.stroke.direction && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Direction</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type:</span>
                <span className={styles.value}>{resultData.stroke.direction.type}</span>
              </div>
              <p className={styles.description}>{resultData.stroke.direction.description}</p>
            </div>
          )}

          {resultData.stroke.slant && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Slant</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type:</span>
                <span className={styles.value}>{resultData.stroke.slant.type}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Angle:</span>
                <span className={styles.value}>{resultData.stroke.slant.angle}°</span>
              </div>
              <p className={styles.description}>{resultData.stroke.slant.description}</p>
            </div>
          )}

          {resultData.stroke.pressure && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Pressure</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Level:</span>
                <span className={styles.value}>{resultData.stroke.pressure.level}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Consistency:</span>
                <span className={styles.value}>{resultData.stroke.pressure.consistency}</span>
              </div>
              <p className={styles.description}>{resultData.stroke.pressure.description}</p>
            </div>
          )}

          {resultData.stroke.speed && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Speed</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type:</span>
                <span className={styles.value}>{resultData.stroke.speed.type}</span>
              </div>
              <p className={styles.description}>{resultData.stroke.speed.description}</p>
            </div>
          )}

          {resultData.stroke.fluidity && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Fluidity</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type:</span>
                <span className={styles.value}>{resultData.stroke.fluidity.type}</span>
              </div>
              <p className={styles.description}>{resultData.stroke.fluidity.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.analysisCard}>
        <h3 className={styles.cardTitle}>Letter Analysis</h3>
        
        <div className={styles.analysisGrid}>
          {resultData.letter.size && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Size</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Overall:</span>
                <span className={styles.value}>{resultData.letter.size.overall}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Consistency:</span>
                <span className={styles.value}>{resultData.letter.size.consistency}</span>
              </div>
              <p className={styles.description}>{resultData.letter.size.description}</p>
            </div>
          )}

          {resultData.letter.spacing && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Spacing</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Letter Spacing:</span>
                <span className={styles.value}>{resultData.letter.spacing.letterSpacing}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Word Spacing:</span>
                <span className={styles.value}>{resultData.letter.spacing.wordSpacing}</span>
              </div>
              <p className={styles.description}>{resultData.letter.spacing.description}</p>
            </div>
          )}

          {resultData.letter.style && (
            <div className={styles.analysisItem}>
              <h4 className={styles.analysisItemTitle}>Style</h4>
              <div className={styles.infoRow}>
                <span className={styles.label}>Legibility:</span>
                <span className={styles.value}>{resultData.letter.style.legibility}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Embellishments:</span>
                <span className={styles.value}>{resultData.letter.style.embellishments ? 'Yes' : 'No'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Simplicity:</span>
                <span className={styles.value}>{resultData.letter.style.simplicity}</span>
              </div>
              <p className={styles.description}>{resultData.letter.style.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.analysisCard}>
        <h3 className={styles.cardTitle}>Baseline Analysis</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>Alignment:</span>
          <span className={styles.value}>{resultData.baseline.alignment}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Consistency:</span>
          <span className={styles.value}>{resultData.baseline.consistency}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Angle:</span>
          <span className={styles.value}>{resultData.baseline.angle}°</span>
        </div>
        <p className={styles.description}>{resultData.baseline.description}</p>
      </div>
    </div>
  );

  const renderPersonality = () => (
    <div className={styles.tabContent}>
      {resultData.personality.personalityTraits && resultData.personality.personalityTraits.length > 0 && (
        <div className={styles.traitsCard}>
          <h3 className={styles.cardTitle}>Personality Traits</h3>
          <div className={styles.traitsGrid}>
            {resultData.personality.personalityTraits.map((trait, index) => (
              <div key={index} className={styles.traitItem}>
                <div className={styles.traitHeader}>
                  <h4 className={styles.traitName}>{trait.trait}</h4>
                  <span className={styles.traitScore}>{trait.score}%</span>
                </div>
                <p className={styles.traitDescription}>{trait.description}</p>
                {trait.indicators && trait.indicators.length > 0 && (
                  <div className={styles.indicators}>
                    <span className={styles.indicatorLabel}>Indicators:</span>
                    <span className={styles.indicatorValue}>{trait.indicators.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.personalityCardsGrid}>
        {resultData.personality.leadershipQualities && (
          <div className={styles.leadershipCard}>
            <h3 className={styles.cardTitle}>Leadership Qualities</h3>
            <div className={styles.scoreHeader}>
              <span className={styles.scoreLabel}>Leadership Score</span>
              <span className={styles.scoreValue}>{resultData.personality.leadershipQualities.score}%</span>
            </div>
            <p className={styles.description}>{resultData.personality.leadershipQualities.description}</p>
            
            {resultData.personality.leadershipQualities.strengths && resultData.personality.leadershipQualities.strengths.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Strengths</h4>
                <div className={styles.strengthsTags}>
                  {resultData.personality.leadershipQualities.strengths.map((strength, index) => (
                    <span key={index} className={styles.tag}>{strength}</span>
                  ))}
                </div>
              </>
            )}
            
            {resultData.personality.leadershipQualities.areas && resultData.personality.leadershipQualities.areas.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Areas for Development</h4>
                <ul className={styles.areasList}>
                  {resultData.personality.leadershipQualities.areas.map((area, index) => (
                    <li key={index} className={styles.areaItem}>{area}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {resultData.personality.communicationStyle && (
          <div className={styles.communicationCard}>
            <h3 className={styles.cardTitle}>Communication Style</h3>
            <div className={styles.infoRow}>
              <span className={styles.label}>Type:</span>
              <span className={styles.value}>{resultData.personality.communicationStyle.type}</span>
            </div>
            <p className={styles.description}>{resultData.personality.communicationStyle.description}</p>
            
            {resultData.personality.communicationStyle.characteristics && resultData.personality.communicationStyle.characteristics.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Characteristics</h4>
                <div className={styles.characteristicsTags}>
                  {resultData.personality.communicationStyle.characteristics.map((char, index) => (
                    <span key={index} className={styles.tag}>{char}</span>
                  ))}
                </div>
              </>
            )}
            
            {resultData.personality.communicationStyle.strengths && resultData.personality.communicationStyle.strengths.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Strengths</h4>
                <div className={styles.strengthsTags}>
                  {resultData.personality.communicationStyle.strengths.map((strength, index) => (
                    <span key={index} className={styles.tag}>{strength}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {resultData.personality.emotionalPatterns && (
          <div className={styles.emotionalCard}>
            <h3 className={styles.cardTitle}>Emotional Patterns</h3>
            <div className={styles.infoRow}>
              <span className={styles.label}>Stability:</span>
              <span className={styles.value}>{resultData.personality.emotionalPatterns.stability}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Expression:</span>
              <span className={styles.value}>{resultData.personality.emotionalPatterns.expression}</span>
            </div>
            <p className={styles.description}>{resultData.personality.emotionalPatterns.description}</p>
            
            {resultData.personality.emotionalPatterns.characteristics && resultData.personality.emotionalPatterns.characteristics.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Characteristics</h4>
                <div className={styles.characteristicsTags}>
                  {resultData.personality.emotionalPatterns.characteristics.map((char, index) => (
                    <span key={index} className={styles.tag}>{char}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {resultData.personality.socialConfidence && (
          <div className={styles.socialCard}>
            <h3 className={styles.cardTitle}>Social Confidence</h3>
            <div className={styles.scoreHeader}>
              <span className={styles.scoreLabel}>Confidence Score</span>
              <span className={styles.scoreValue}>{resultData.personality.socialConfidence.score}%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Level:</span>
              <span className={styles.value}>{resultData.personality.socialConfidence.level}</span>
            </div>
            <p className={styles.description}>{resultData.personality.socialConfidence.description}</p>
            
            {resultData.personality.socialConfidence.characteristics && resultData.personality.socialConfidence.characteristics.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Characteristics</h4>
                <div className={styles.characteristicsTags}>
                  {resultData.personality.socialConfidence.characteristics.map((char, index) => (
                    <span key={index} className={styles.tag}>{char}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className={styles.tabContent}>
      <div className={styles.insightsGrid}>
        {resultData.detailed.strengths && resultData.detailed.strengths.length > 0 && (
          <div className={styles.insightsCard}>
            <h3 className={styles.cardTitle}>Strengths</h3>
            <ul className={styles.insightsList}>
              {resultData.detailed.strengths.map((strength, index) => (
                <li key={index} className={styles.insightItem}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {resultData.detailed.challenges && resultData.detailed.challenges.length > 0 && (
          <div className={styles.insightsCard}>
            <h3 className={styles.cardTitle}>Challenges</h3>
            <ul className={styles.challengesList}>
              {resultData.detailed.challenges.map((challenge, index) => (
                <li key={index} className={styles.challengeItem}>{challenge}</li>
              ))}
            </ul>
          </div>
        )}

        {resultData.detailed.recommendations && resultData.detailed.recommendations.length > 0 && (
          <div className={styles.insightsCard}>
            <h3 className={styles.cardTitle}>Recommendations</h3>
            <ul className={styles.recommendationsList}>
              {resultData.detailed.recommendations.map((recommendation, index) => (
                <li key={index} className={styles.recommendationItem}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}

        {resultData.detailed.careerSuggestions && resultData.detailed.careerSuggestions.length > 0 && (
          <div className={styles.insightsCard}>
            <h3 className={styles.cardTitle}>Career Suggestions</h3>
            <ul className={styles.careerList}>
              {resultData.detailed.careerSuggestions.map((career, index) => (
                <li key={index} className={styles.careerItem}>{career}</li>
              ))}
            </ul>
          </div>
        )}

        {resultData.detailed.relationshipInsights && resultData.detailed.relationshipInsights.length > 0 && (
          <div className={styles.insightsCard}>
            <h3 className={styles.cardTitle}>Relationship Insights</h3>
            <ul className={styles.relationshipList}>
              {resultData.detailed.relationshipInsights.map((insight, index) => (
                <li key={index} className={styles.relationshipItem}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Signature Analysis</h1>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stroke' ? styles.active : ''}`}
            onClick={() => setActiveTab('stroke')}
          >
            Stroke & Letter
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'personality' ? styles.active : ''}`}
            onClick={() => setActiveTab('personality')}
          >
            Personality
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'insights' ? styles.active : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'stroke' && renderStrokeAnalysis()}
        {activeTab === 'personality' && renderPersonality()}
        {activeTab === 'insights' && renderInsights()}

        {/* <button className={styles.doneButton} onClick={() => navigate('/aiwow')}>
          Done
        </button> */}
      </div>
    </div>
  );
};

export default SignatureResult;
