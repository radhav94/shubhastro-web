import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './KarmicDebtTracker.module.scss';
import { Toast } from '../../../../component';
import { analyzeKarmicDebt } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';

const KarmicDebtTracker = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  // Synchronous guard against a rapid double tap firing the API twice.
  const isSubmittingRef = useRef(false);

  const handleAnalyze = async () => {
    if (!profile) {
      Toast.error('Profile not found');
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setIsLoading(true);

      const data = {
        name: profile.name,
        gender: profile.identity?.toLowerCase() || 'male',
        day: profile.day,
        month: profile.month,
        year: profile.year,
        hour: profile.hour || 0,
        min: profile.minute || 0,
        second: 0,
        place: profile.place || '',
        lat: profile.lat || 0,
        lon: profile.lon || 0,
        tzone: profile.tzone || 5.5
      };

      const result = await analyzeKarmicDebt(data);

      if (result.success) {
        setAnalysis(result.data);
      } else {
        // Error already shown by interceptor
        console.error('Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to analyze karmic debt:', error);
      Toast.error('An unexpected error occurred. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (analysis) {
      setAnalysis(null);
    } else {
      navigate('/ai-wow');
    }
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
  };

  if (profileLoading) {
    return <PrimaryLoader isLoading={true} />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Karmic Debt Tracker</h1>
          {profile && (
            <p className={styles.subtitle}>{profile.name}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {!analysis ? (
          <div className={styles.introSection}>
            <div className={styles.introIcon}>🔮</div>
            <h2 className={styles.introTitle}>Discover Your Karmic Path</h2>
            <p className={styles.introText}>
              Understand your karmic debts and life lessons based on your birth date numerology
            </p>

            {profile && (
              <div className={styles.profileCard}>
                <h3 className={styles.profileTitle}>Profile Details</h3>
                <div className={styles.profileDetails}>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Name:</span>
                    <span className={styles.profileValue}>{profile.name}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Birth Date:</span>
                    <span className={styles.profileValue}>
                      {profile.day}/{profile.month}/{profile.year}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button 
              className={styles.analyzeButton}
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Analyzing Karmic Debt...
                </>
              ) : (
                'Analyze Karmic Debt'
              )}
            </button>
          </div>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              {/* <div className={styles.resultIcon}>✨</div> */}
              <h2 className={styles.resultTitle}>Your Karmic Analysis</h2>
            </div>

            {/* Overall Karmic Score */}
            {analysis.overallKarmicScore && (
              <div className={styles.scoreCard}>
                <h3 className={styles.cardTitle}>⭐ Overall Karmic Score</h3>
                <div className={styles.scoreCircle}>
                  <div className={styles.scoreValue}>{analysis.overallKarmicScore}</div>
                  <div className={styles.scoreLabel}>out of 100</div>
                </div>
              </div>
            )}

            {/* Core Numbers */}
            {analysis.coreNumbers && (
              <div className={styles.coreCard}>
                <h3 className={styles.cardTitle}>🔢 Core Numbers</h3>
                <div className={styles.coreGrid}>
                  {analysis.coreNumbers.lifePathNumber && (
                    <div className={styles.coreItem}>
                      <div className={styles.coreNumber}>{analysis.coreNumbers.lifePathNumber}</div>
                      <div className={styles.coreLabel}>Life Path</div>
                    </div>
                  )}
                  {analysis.coreNumbers.destinyNumber && (
                    <div className={styles.coreItem}>
                      <div className={styles.coreNumber}>{analysis.coreNumbers.destinyNumber}</div>
                      <div className={styles.coreLabel}>Destiny</div>
                    </div>
                  )}
                  {analysis.coreNumbers.soulUrgeNumber && (
                    <div className={styles.coreItem}>
                      <div className={styles.coreNumber}>{analysis.coreNumbers.soulUrgeNumber}</div>
                      <div className={styles.coreLabel}>Soul Urge</div>
                    </div>
                  )}
                  {analysis.coreNumbers.personalityNumber && (
                    <div className={styles.coreItem}>
                      <div className={styles.coreNumber}>{analysis.coreNumbers.personalityNumber}</div>
                      <div className={styles.coreLabel}>Personality</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Karmic Debt Numbers */}
            {analysis.karmicDebtNumbers && analysis.karmicDebtNumbers.length > 0 ? (
              <div className={styles.debtCard}>
                <h3 className={styles.cardTitle}>⚠️ Karmic Debt Numbers</h3>
                <div className={styles.debtNumbers}>
                  {analysis.karmicDebtNumbers.map((num, index) => (
                    <div key={index} className={styles.debtNumber}>
                      {num}
                    </div>
                  ))}
                </div>
                {analysis.karmicDebts && analysis.karmicDebts.length > 0 && (
                  <div className={styles.debtsList}>
                    {analysis.karmicDebts.map((debt, index) => (
                      <div key={index} className={styles.debtItem}>
                        <p className={styles.debtText}>{debt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noDebtCard}>
                <h3 className={styles.cardTitle}>✨ No Karmic Debt Numbers</h3>
                <p className={styles.cardText}>
                  You don't have any karmic debt numbers in your chart. This suggests a relatively clear karmic slate in this lifetime.
                </p>
              </div>
            )}

            {/* Soul Purpose */}
            {analysis.soulPurpose && (
              <div className={styles.purposeCard}>
                <h3 className={styles.cardTitle}>🌟 Soul Purpose</h3>
                <p className={styles.cardText}>{analysis.soulPurpose}</p>
              </div>
            )}

            {/* Karmic Lessons */}
            {analysis.karmicLessons && analysis.karmicLessons.length > 0 && (
              <div className={styles.lessonsCard}>
                <h3 className={styles.cardTitle}>📚 Karmic Lessons</h3>
                <div className={styles.lessonsList}>
                  {analysis.karmicLessons.map((lesson, index) => (
                    <div key={index} className={styles.lessonItem}>
                      {lesson.missingNumber && (
                        <div className={styles.lessonHeader}>
                          <div className={styles.lessonNumber}>Missing: {lesson.missingNumber}</div>
                        </div>
                      )}
                      {lesson.lesson && (
                        <div className={styles.lessonSection}>
                          <h4 className={styles.lessonSubtitle}>Lesson</h4>
                          <p className={styles.lessonText}>{lesson.lesson}</p>
                        </div>
                      )}
                      {lesson.howToResolve && (
                        <div className={styles.lessonSection}>
                          <h4 className={styles.lessonSubtitle}>How to Resolve</h4>
                          <p className={styles.lessonText}>{lesson.howToResolve}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Life Patterns */}
            {analysis.pastLifePatterns && analysis.pastLifePatterns.length > 0 && (
              <div className={styles.patternsCard}>
                <h3 className={styles.cardTitle}>🔄 Past Life Patterns</h3>
                <ul className={styles.patternsList}>
                  {analysis.pastLifePatterns.map((pattern, index) => (
                    <li key={index} className={styles.patternItem}>{pattern}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Current Life Challenges */}
            {analysis.currentLifeChallenges && analysis.currentLifeChallenges.length > 0 && (
              <div className={styles.challengesCard}>
                <h3 className={styles.cardTitle}>⚡ Current Life Challenges</h3>
                <ul className={styles.challengesList}>
                  {analysis.currentLifeChallenges.map((challenge, index) => (
                    <li key={index} className={styles.challengeItem}>{challenge}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Guidance */}
            {analysis.guidance && (
              <div className={styles.guidanceCard}>
                <div className={styles.guidanceIcon}>🧭</div>
                <div className={styles.guidanceContent}>
                  <h3 className={styles.guidanceTitle}>Spiritual Guidance</h3>
                  <p className={styles.guidanceText}>{analysis.guidance}</p>
                </div>
              </div>
            )}

            {/* Spiritual Remedies */}
            {analysis.spiritualRemedies && analysis.spiritualRemedies.length > 0 && (
              <div className={styles.remediesCard}>
                <h3 className={styles.cardTitle}>🌿 Spiritual Remedies</h3>
                <div className={styles.remediesList}>
                  {analysis.spiritualRemedies.map((remedy, index) => (
                    <div key={index} className={styles.remedyItem}>
                      <div className={styles.remedyHeader}>
                        <span className={styles.remedyFrequency}>{remedy.frequency}</span>
                      </div>
                      <p className={styles.remedyText}>{remedy.remedy}</p>
                      {remedy.benefit && (
                        <p className={styles.remedyBenefit}>
                          <strong>Benefit:</strong> {remedy.benefit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className={styles.newAnalysisButton} onClick={handleNewAnalysis}>
              Back to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KarmicDebtTracker;
