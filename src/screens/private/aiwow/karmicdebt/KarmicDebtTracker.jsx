import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './KarmicDebtTracker.module.scss';
import { Toast } from '../../../../component';
import { analyzeKarmicDebt } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import RouteLoader from '../../../../component/UI/RouteLoader';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import GuestKundliAuthModal from '../../../../component/UI/Profile/GuestKundliAuthModal';

const KarmicDebtTracker = () => {
  const navigate = useNavigate();
  /*
    Guests used to be ejected from this screen before it rendered.

    `useSelectedKundliProfile()` defaults to `required: true, showToast: true`. For
    a visitor with no token that is a closed loop: the profiles query is skipped
    (so it reports isLoading:false and the loading guard does not hold), the
    localStorage lookup is gated on the same token, and the hook falls straight
    through to Toast.error + navigate('/ai-wow', { replace: true }) on mount. The
    destination is the tool menu this visitor just tapped from, so the next tap
    does the same thing.

    Clarity session je5byb is that loop measured: a guest from Facebook, 10 page
    views from 8 clicks — more pages than clicks is only possible if navigation
    happened without one — 54 seconds, gone. The only explanation offered was a
    toast: top-right, off-screen in a Facebook WebView, and invisible to session
    replay, so the visitor saw the page simply refuse to open.

    `required: !isGuest` lets a guest see the tool, and the guest modal below
    collects birth details when they act on it. This is DreamInterpreter's shape
    (`required: !isGuest, showToast: !isGuest` plus GuestKundliAuthModal at
    submit), and it is how PalmistryCamera, AuraCamera and PanditAIBubble already
    treat guests. Safe to do here specifically because the analysis is behind an
    explicit button rather than an auto-run effect, so nothing fires without a
    profile.
  */
  const isGuest = !localStorage.getItem("shubhtalk_customer_token");
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({
    required: !isGuest,
    showToast: !isGuest,
  });
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'karmic-debt' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  // Synchronous guard against a rapid double tap firing the API twice.
  const isSubmittingRef = useRef(false);

  const handleAnalyze = async () => {
    // Guest: collect birth details instead of failing. Read the token here rather
    // than reusing `isGuest` so a login completed in this session (in another tab,
    // or via the modal) is picked up without a remount.
    if (!localStorage.getItem("shubhtalk_customer_token")) {
      setShowGuestAuthModal(true);
      return;
    }

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

      const result = await runWithEntitlement(() => analyzeKarmicDebt(data));

      // Entitlement block handled by the gate (plans popup / recharge toast).
      if (result.blocked) {
        setIsLoading(false);
        return;
      }

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

  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    // Deliberately does NOT auto-run the analysis. The modal has already selected
    // the newly created profile, and the user taps Analyse again — which routes
    // through runWithEntitlement so the subscription gate is always applied.
    // Auto-running here would fire the moment the welcome popup closes and skip
    // that gate. Same reasoning as DreamInterpreter's handleGuestAuthSuccess.
  };

  // `!isGuest &&` because a guest's profile query is skipped, so this would never
  // resolve for them — they would sit on a loader instead of seeing the tool.
  if (!isGuest && profileLoading) {
    // Reserves in-flow height while the profile loads — see RouteLoader.
    return <RouteLoader message="Loading your birth details…" />;
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

            {/*
              aria-disabled + aria-busy rather than a native `disabled`. The label
              already says "Analyzing Karmic Debt..." while the request is in
              flight, but a natively disabled button emits no click event at all,
              so a tap asking "is this actually running?" produced nothing and
              reads as a dead click in Clarity. Re-entry is already prevented by
              isSubmittingRef inside handleAnalyze, so keeping it clickable is
              safe.
            */}
            <button 
              className={styles.analyzeButton}
              onClick={handleAnalyze}
              aria-disabled={isLoading}
              aria-busy={isLoading || undefined}
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
      {subscriptionModal}
      {/* Birth details for a guest, collected in place instead of bouncing them
          back to /ai-wow. See the note on `isGuest` above. */}
      <GuestKundliAuthModal
        isOpen={showGuestAuthModal}
        onClose={() => setShowGuestAuthModal(false)}
        onSuccess={handleGuestAuthSuccess}
        title="Add Kundli Details"
      />
    </div>
  );
};

export default KarmicDebtTracker;
