import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AstroVitals.module.scss';
import { Toast } from '../../../../component';
import { syncAstroVitals } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import RouteLoader from '../../../../component/UI/RouteLoader';
import GuestKundliAuthModal from '../../../../component/UI/Profile/GuestKundliAuthModal';

const AstroVitals = () => {
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

    `required: !isGuest` lets a guest see and fill the form, and the guest modal
    below collects birth details on submit. This is DreamInterpreter's shape
    (`required: !isGuest, showToast: !isGuest` plus GuestKundliAuthModal at
    submit), and it is how PalmistryCamera, AuraCamera and PanditAIBubble already
    treat guests. Safe here specifically because the analysis is behind an explicit
    form submit rather than an auto-run effect, so nothing fires without a profile.
  */
  const isGuest = !localStorage.getItem("shubhtalk_customer_token");
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({
    required: !isGuest,
    showToast: !isGuest,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  /*
    Inline reason for a blocked submit.

    The two states the submit button used to be natively disabled for — a request
    already in flight, and the required readings not filled in — are answered here
    instead of in a toast. react-hot-toast renders top-right while this form's
    button is at the bottom of a scrolling page, and Clarity cannot see toasts at
    all, so a blocked tap read as dead in both the session and the report.

    `seq` is bumped per announcement so repeating the same reason still remounts
    the node: replay sees a DOM mutation and screen readers re-announce.
  */
  const [submitNotice, setSubmitNotice] = useState(null);
  const submitNoticeSeqRef = useRef(0);

  const announceSubmitNotice = (text) => {
    submitNoticeSeqRef.current += 1;
    setSubmitNotice({ seq: submitNoticeSeqRef.current, text });
  };
  // Synchronous guard against a rapid double tap firing the API twice.
  const isSubmittingRef = useRef(false);

  // Form state
  const [heartRate, setHeartRate] = useState('');
  const [stressLevel, setStressLevel] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');

  const validateAndSetValue = (value, setter, min, max) => {
    // Remove non-numeric characters except for leading digits
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setter('');
      return;
    }

    const num = parseInt(numericValue);
    
    // Prevent values outside range
    if (num > max) {
      setter(String(max));
    } else if (num < min && numericValue.length >= String(min).length) {
      setter(String(min));
    } else {
      setter(numericValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guest: collect birth details instead of failing. Read the token here rather
    // than reusing `isGuest` so a login completed in this session (in another tab,
    // or via the modal) is picked up without a remount.
    if (!localStorage.getItem("shubhtalk_customer_token")) {
      setShowGuestAuthModal(true);
      return;
    }

    if (!profile) {
      Toast.error('Profile not available');
      return;
    }

    if (isLoading) {
      announceSubmitNotice('Already analysing your vitals — one moment.');
      return;
    }

    if (!heartRate || !stressLevel) {
      // Inline rather than a toast: this is the state the button was disabled for,
      // so the answer belongs beside the button and above the fields it names.
      announceSubmitNotice('Enter your heart rate and stress level to continue.');
      return;
    }

    setSubmitNotice(null);

    const hr = parseInt(heartRate);
    const stress = parseInt(stressLevel);

    if (isNaN(hr) || hr < 40 || hr > 200) {
      Toast.error('Heart rate should be between 40-200 bpm');
      return;
    }

    if (isNaN(stress) || stress < 0 || stress > 100) {
      Toast.error('Stress level should be between 0-100');
      return;
    }

    // Validate optional fields if provided
    if (systolic) {
      const sys = parseInt(systolic);
      if (isNaN(sys) || sys < 70 || sys > 200) {
        Toast.error('Systolic BP should be between 70-200 mmHg');
        return;
      }
    }

    if (diastolic) {
      const dia = parseInt(diastolic);
      if (isNaN(dia) || dia < 40 || dia > 130) {
        Toast.error('Diastolic BP should be between 40-130 mmHg');
        return;
      }
    }

    if (sleepQuality) {
      const sleep = parseInt(sleepQuality);
      if (isNaN(sleep) || sleep < 1 || sleep > 10) {
        Toast.error('Sleep quality should be between 1-10');
        return;
      }
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setIsLoading(true);

      const vitalsData = {
        userId: profile._id || '10',
        heartRate: hr,
        stressLevel: stress,
        timestamp: new Date().toISOString(),
        deviceId: 'web-app',
        name: profile.name,
        gender: profile.identity?.toLowerCase() || 'male',
        day: String(profile.day),
        month: String(profile.month),
        year: String(profile.year),
        hour: String(profile.hour || 0),
        min: String(profile.minute || 0),
        second: '0',
        place: profile.place,
        lat: String(profile.latitude || 0),
        lon: String(profile.longitude || 0),
        tzone: String(profile.tzone || 5.5)
      };

      // Add optional metrics
      const additionalMetrics = {};
      
      if (systolic && diastolic) {
        additionalMetrics.bloodPressure = {
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic)
        };
      }

      if (sleepQuality) {
        additionalMetrics.sleepQuality = parseInt(sleepQuality);
      }

      if (Object.keys(additionalMetrics).length > 0) {
        vitalsData.additionalMetrics = additionalMetrics;
      }

      const result = await syncAstroVitals(vitalsData);

      if (result.success) {
        setAnalysis(result.data);
      } else {
        console.error('Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to sync vitals:', error);
      Toast.error('An unexpected error occurred. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (analysis) {
      setAnalysis(null);
      setHeartRate('');
      setStressLevel('');
      setSystolic('');
      setDiastolic('');
      setSleepQuality('');
    } else {
      navigate('/ai-wow');
    }
  };

  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    // Deliberately does NOT auto-submit. The modal has already selected the newly
    // created profile; the user taps Analyse again with the readings they entered
    // still in the form. Auto-submitting would fire the moment the welcome popup
    // closes. Same reasoning as DreamInterpreter's handleGuestAuthSuccess.
  };

  // `!isGuest &&` because a guest's profile query is skipped, so this would never
  // resolve for them — they would sit on a loader instead of seeing the form.
  if (!isGuest && profileLoading) {
    // Reserves in-flow height while the profile loads — see RouteLoader.
    return <RouteLoader message="Loading your birth details…" />;
  }

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setHeartRate('');
    setStressLevel('');
    setSystolic('');
    setDiastolic('');
    setSleepQuality('');
  };

  const getHeartRateStatus = (hr) => {
    if (hr < 60) return { status: 'Low', color: '#3b82f6' };
    if (hr <= 100) return { status: 'Normal', color: '#10b981' };
    return { status: 'High', color: '#ef4444' };
  };

  const getStressStatus = (stress) => {
    if (stress < 30) return { status: 'Low', color: '#10b981' };
    if (stress <= 60) return { status: 'Moderate', color: '#f59e0b' };
    return { status: 'High', color: '#ef4444' };
  };

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
          <h1 className={styles.title}>AstroVitals</h1>
          {profile && (
            <p className={styles.subtitle}>{profile.name}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {!analysis ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.introSection}>
              <div className={styles.introIcon}>💓</div>
              <h2 className={styles.introTitle}>Health Meets Astrology</h2>
              <p className={styles.introText}>
                Sync your health vitals with astrological insights for personalized wellness guidance
              </p>
            </div>

            {/* Required Metrics */}
            <div className={styles.sectionTitle}>Required Metrics</div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Heart Rate (bpm) <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles.input}
                placeholder="e.g., 75"
                value={heartRate}
                onChange={(e) => validateAndSetValue(e.target.value, setHeartRate, 40, 200)}
                disabled={isLoading}
                maxLength="3"
              />
              <span className={styles.hint}>Normal range: 60-100 bpm</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Stress Level (0-100) <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles.input}
                placeholder="e.g., 45"
                value={stressLevel}
                onChange={(e) => validateAndSetValue(e.target.value, setStressLevel, 0, 100)}
                disabled={isLoading}
                maxLength="3"
              />
              <div className={styles.stressScale}>
                <span>Low (0-30)</span>
                <span>Moderate (31-60)</span>
                <span>High (61-100)</span>
              </div>
            </div>

            {/* Optional Metrics */}
            <div className={styles.sectionTitle}>
              Optional Metrics <span className={styles.optional}>(for deeper insights)</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Systolic BP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={styles.input}
                  placeholder="e.g., 120"
                  value={systolic}
                  onChange={(e) => validateAndSetValue(e.target.value, setSystolic, 70, 200)}
                  disabled={isLoading}
                  maxLength="3"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Diastolic BP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={styles.input}
                  placeholder="e.g., 80"
                  value={diastolic}
                  onChange={(e) => validateAndSetValue(e.target.value, setDiastolic, 40, 130)}
                  disabled={isLoading}
                  maxLength="3"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Sleep Quality (1-10)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles.input}
                placeholder="e.g., 7"
                value={sleepQuality}
                onChange={(e) => validateAndSetValue(e.target.value, setSleepQuality, 1, 10)}
                disabled={isLoading}
                maxLength="2"
              />
              <span className={styles.hint}>1 = Poor, 10 = Excellent</span>
            </div>

            {/* Reason for a blocked submit, next to the button that was tapped.
                See announceSubmitNotice. */}
            {submitNotice && (
              <p
                key={submitNotice.seq}
                className={styles.submitNotice}
                role="status"
                aria-live="polite"
              >
                {submitNotice.text}
              </p>
            )}

            {/*
              aria-disabled + aria-busy rather than a native `disabled`. This was
              disabled until heart rate and stress level were both filled — so the
              button that a visitor taps to find out what is missing was the one
              control that could not tell them, because a disabled button emits no
              click at all. It now fires and handleSubmit names the gap. Re-entry
              while a request is in flight is already blocked by isSubmittingRef.
            */}
            <button 
              type="submit" 
              className={styles.submitButton}
              aria-disabled={isLoading || !heartRate || !stressLevel}
              aria-busy={isLoading || undefined}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Analyzing Vitals...
                </>
              ) : (
                'Sync & Analyze'
              )}
            </button>
          </form>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <div className={styles.resultIcon}>✨</div>
              <h2 className={styles.resultTitle}>Your AstroVitals Report</h2>
              <p className={styles.resultDate}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Current Vitals Summary */}
            <div className={styles.vitalsCard}>
              <h3 className={styles.cardTitle}>📊 Current Vitals</h3>
              <div className={styles.vitalsGrid}>
                <div className={styles.vitalItem}>
                  <div className={styles.vitalIcon}>💓</div>
                  <div className={styles.vitalInfo}>
                    <div className={styles.vitalValue}>{analysis.heartRate || heartRate}</div>
                    <div className={styles.vitalLabel}>Heart Rate (bpm)</div>
                    <div 
                      className={styles.vitalStatus}
                      style={{ color: getHeartRateStatus(parseInt(heartRate)).color }}
                    >
                      {getHeartRateStatus(parseInt(heartRate)).status}
                    </div>
                  </div>
                </div>

                <div className={styles.vitalItem}>
                  <div className={styles.vitalIcon}>😰</div>
                  <div className={styles.vitalInfo}>
                    <div className={styles.vitalValue}>{analysis.stressLevel || stressLevel}</div>
                    <div className={styles.vitalLabel}>Stress Level</div>
                    <div 
                      className={styles.vitalStatus}
                      style={{ color: getStressStatus(parseInt(stressLevel)).color }}
                    >
                      {getStressStatus(parseInt(stressLevel)).status}
                    </div>
                  </div>
                </div>

                {systolic && diastolic && (
                  <div className={styles.vitalItem}>
                    <div className={styles.vitalIcon}>🩺</div>
                    <div className={styles.vitalInfo}>
                      <div className={styles.vitalValue}>{systolic}/{diastolic}</div>
                      <div className={styles.vitalLabel}>Blood Pressure</div>
                    </div>
                  </div>
                )}

                {sleepQuality && (
                  <div className={styles.vitalItem}>
                    <div className={styles.vitalIcon}>😴</div>
                    <div className={styles.vitalInfo}>
                      <div className={styles.vitalValue}>{sleepQuality}/10</div>
                      <div className={styles.vitalLabel}>Sleep Quality</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Astrological Insights */}
            {analysis.astrologicalInsights && (
              <div className={styles.insightsCard}>
                <h3 className={styles.cardTitle}>⭐ Astrological Insights</h3>
                {typeof analysis.astrologicalInsights === 'string' ? (
                  <p className={styles.cardText}>{analysis.astrologicalInsights}</p>
                ) : (
                  <>
                    {analysis.astrologicalInsights.planetaryInfluence && (
                      <div className={styles.insightSection}>
                        <h4 className={styles.insightSubtitle}>Planetary Influence</h4>
                        <p className={styles.cardText}>{analysis.astrologicalInsights.planetaryInfluence}</p>
                      </div>
                    )}
                    {analysis.astrologicalInsights.currentTransits && (
                      <div className={styles.insightSection}>
                        <h4 className={styles.insightSubtitle}>Current Transits</h4>
                        <p className={styles.cardText}>{analysis.astrologicalInsights.currentTransits}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Health Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className={styles.recommendationsCard}>
                <h3 className={styles.cardTitle}>💡 Personalized Recommendations</h3>
                <div className={styles.recommendationsList}>
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className={styles.recommendationItem}>
                      {typeof rec === 'string' ? (
                        <p className={styles.recommendationText}>{rec}</p>
                      ) : (
                        <>
                          {rec.category && (
                            <div className={styles.recommendationCategory}>{rec.category}</div>
                          )}
                          {rec.suggestion && (
                            <p className={styles.recommendationText}>{rec.suggestion}</p>
                          )}
                          {rec.reason && (
                            <p className={styles.recommendationReason}>{rec.reason}</p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wellness Score */}
            {analysis.wellnessScore && (
              <div className={styles.scoreCard}>
                <h3 className={styles.cardTitle}>🎯 Overall Wellness Score</h3>
                <div className={styles.scoreCircle}>
                  <div className={styles.scoreValue}>{analysis.wellnessScore}</div>
                  <div className={styles.scoreLabel}>out of 100</div>
                </div>
                {analysis.wellnessMessage && (
                  <p className={styles.scoreMessage}>{analysis.wellnessMessage}</p>
                )}
              </div>
            )}

            {/* Remedies */}
            {analysis.remedies && analysis.remedies.length > 0 && (
              <div className={styles.remediesCard}>
                <h3 className={styles.cardTitle}>🌿 Astrological Remedies</h3>
                <ul className={styles.remediesList}>
                  {analysis.remedies.map((remedy, index) => (
                    <li key={index}>{remedy}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <button className={styles.newAnalysisButton} onClick={handleNewAnalysis}>
              Sync New Vitals
            </button>
          </div>
        )}
      </div>
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

export default AstroVitals;
