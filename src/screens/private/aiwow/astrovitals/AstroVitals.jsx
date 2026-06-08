import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AstroVitals.module.scss';
import { Toast } from '../../../../component';
import { syncAstroVitals } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';

const AstroVitals = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

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

    if (!profile) {
      Toast.error('Profile not available');
      return;
    }

    if (!heartRate || !stressLevel) {
      Toast.error('Please enter heart rate and stress level');
      return;
    }

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
      navigate('/aiwow');
    }
  };

  if (profileLoading) {
    return <PrimaryLoader isLoading={true} />;
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

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading || !heartRate || !stressLevel}
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
    </div>
  );
};

export default AstroVitals;
