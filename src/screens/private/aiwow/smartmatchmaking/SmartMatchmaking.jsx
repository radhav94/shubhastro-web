import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SmartMatchmaking.module.scss';
import { Toast } from '../../../../component';
import { analyzeSmartMatchmaking } from '../../../../services/appServices/aiWowService';

const SmartMatchmaking = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Form state for User B (Partner)
  const [partnerData, setPartnerData] = useState({
    name: '',
    gender: 'female',
    day: '',
    month: '',
    year: '',
    hour: '',
    min: '',
    place: '',
    lat: '',
    lon: '',
    tzone: '5.5'
  });

  // Relationship goals state
  const [relationshipGoals, setRelationshipGoals] = useState({
    emotionalBonding: 5,
    careerGrowth: 4,
    familyHarmony: 3,
    physicalCompatibility: 4,
    financialStability: 5
  });

  useEffect(() => {
    const profileData = localStorage.getItem('selectedKundliProfile');
    if (!profileData) {
      Toast.error('Please select a kundli profile first');
      navigate('/aiwow', { replace: true });
      return;
    }

    try {
      const profile = JSON.parse(profileData);
      setSelectedProfile(profile);
    } catch (error) {
      console.error('Invalid profile data:', error);
      Toast.error('Invalid profile data. Please select again.');
      localStorage.removeItem('selectedKundliProfile');
      navigate('/aiwow', { replace: true });
    }
  }, [navigate]);

  const handlePartnerChange = (field, value) => {
    setPartnerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoalChange = (goal, value) => {
    setRelationshipGoals(prev => ({
      ...prev,
      [goal]: parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!partnerData.name.trim()) {
      Toast.error('Please enter partner name');
      return;
    }
    if (!partnerData.day || !partnerData.month || !partnerData.year) {
      Toast.error('Please enter complete birth date');
      return;
    }
    if (!partnerData.place.trim()) {
      Toast.error('Please enter birth place');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare User A data from selected profile
      const userA = {
        name: selectedProfile.name || 'User A',
        gender: selectedProfile.identity?.toLowerCase() || 'male',
        day: parseInt(selectedProfile.day),
        month: parseInt(selectedProfile.month),
        year: parseInt(selectedProfile.year),
        hour: parseInt(selectedProfile.hour || 0),
        min: parseInt(selectedProfile.minute || 0),
        second: 0,
        place: selectedProfile.place || '',
        lat: String(selectedProfile.latitude || '0'),
        lon: String(selectedProfile.longitude || '0'),
        tzone: parseFloat(selectedProfile.timezone || 5.5)
      };

      // Prepare User B data from form
      const userB = {
        name: partnerData.name.trim(),
        gender: partnerData.gender,
        day: parseInt(partnerData.day),
        month: parseInt(partnerData.month),
        year: parseInt(partnerData.year),
        hour: parseInt(partnerData.hour || 0),
        min: parseInt(partnerData.min || 0),
        second: 0,
        place: partnerData.place.trim(),
        lat: String(partnerData.lat || '0'),
        lon: String(partnerData.lon || '0'),
        tzone: parseFloat(partnerData.tzone)
      };

      const apiResult = await analyzeSmartMatchmaking(userA, userB, relationshipGoals);

      if (apiResult.success) {
        setResult(apiResult.data);
      } else {
        setError(apiResult.error);
      }
    } catch (error) {
      console.error('Failed to analyze compatibility:', error);
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (result || error) {
      setResult(null);
      setError(null);
    } else {
      localStorage.removeItem('selectedKundliProfile');
      navigate(-1);
    }
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
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
          <h1 className={styles.title}>Smart Matchmaking</h1>
          {selectedProfile && (
            <p className={styles.subtitle}>{selectedProfile.name}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {!result && !error ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.introSection}>
              <div className={styles.introIcon}>💕</div>
              <h2 className={styles.introTitle}>Compatibility Analysis</h2>
              <p className={styles.introText}>
                Enter partner's birth details to analyze compatibility
              </p>
            </div>

            {/* Partner Birth Details */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Partner's Birth Details</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={partnerData.name}
                  onChange={(e) => handlePartnerChange('name', e.target.value)}
                  placeholder="Enter partner's name"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Gender <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={partnerData.gender}
                  onChange={(e) => handlePartnerChange('gender', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Day <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    className={styles.input}
                    value={partnerData.day}
                    onChange={(e) => handlePartnerChange('day', e.target.value)}
                    placeholder="12"
                    min="1"
                    max="31"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Month <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    className={styles.input}
                    value={partnerData.month}
                    onChange={(e) => handlePartnerChange('month', e.target.value)}
                    placeholder="5"
                    min="1"
                    max="12"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Year <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    className={styles.input}
                    value={partnerData.year}
                    onChange={(e) => handlePartnerChange('year', e.target.value)}
                    placeholder="1994"
                    min="1900"
                    max={new Date().getFullYear()}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Hour</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={partnerData.hour}
                    onChange={(e) => handlePartnerChange('hour', e.target.value)}
                    placeholder="10"
                    min="0"
                    max="23"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Minute</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={partnerData.min}
                    onChange={(e) => handlePartnerChange('min', e.target.value)}
                    placeholder="32"
                    min="0"
                    max="59"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Birth Place <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={partnerData.place}
                  onChange={(e) => handlePartnerChange('place', e.target.value)}
                  placeholder="Mumbai"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Latitude</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={partnerData.lat}
                    onChange={(e) => handlePartnerChange('lat', e.target.value)}
                    placeholder="19.0760"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Longitude</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={partnerData.lon}
                    onChange={(e) => handlePartnerChange('lon', e.target.value)}
                    placeholder="72.8777"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Timezone</label>
                <input
                  type="text"
                  className={styles.input}
                  value={partnerData.tzone}
                  onChange={(e) => handlePartnerChange('tzone', e.target.value)}
                  placeholder="5.5"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Relationship Goals */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Relationship Priorities</h3>
              <p className={styles.sectionDesc}>Rate each aspect from 1 (Low) to 5 (High)</p>
              
              {Object.entries(relationshipGoals).map(([key, value]) => (
                <div key={key} className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <label className={styles.sliderLabel}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <span className={styles.sliderValue}>{value}</span>
                  </div>
                  <input
                    type="range"
                    className={styles.slider}
                    min="1"
                    max="5"
                    value={value}
                    onChange={(e) => handleGoalChange(key, e.target.value)}
                    disabled={isLoading}
                  />
                  <div className={styles.sliderLabels}>
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Analyzing Compatibility...
                </>
              ) : (
                'Analyze Compatibility'
              )}
            </button>
          </form>
        ) : error ? (
          <div className={styles.errorSection}>
            <div className={styles.errorIcon}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#ef4444" strokeWidth="2" fill="none"/>
                <path d="M32 20V36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="32" cy="44" r="2" fill="#ef4444"/>
              </svg>
            </div>

            <div className={styles.errorDetails}>
              <h3 className={styles.errorMessage}>{error.message}</h3>
              
              {error.details && (
                <div className={styles.errorDetailsBox}>
                  {error.details.detectedIssue && (
                    <div className={styles.errorDetailItem}>
                      <strong>Issue Detected:</strong>
                      <p>{error.details.detectedIssue}</p>
                    </div>
                  )}
                  
                  {error.details.expected && (
                    <div className={styles.errorDetailItem}>
                      <strong>Expected:</strong>
                      <p>{error.details.expected}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              className={styles.retryButton}
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className={styles.resultSection}>
            {/* Overall Score Card */}
            <div className={styles.scoreCard}>
              <div className={styles.scoreCircle}>
                <div className={styles.scoreValue}>{result.overallScore}</div>
                <div className={styles.scoreMax}>/ 100</div>
              </div>
              <div className={styles.scoreInfo}>
                <h2 className={styles.compatibilityLevel}>{result.compatibilityLevel}</h2>
                <p className={styles.partnerNames}>
                  {selectedProfile?.name} & {partnerData.name}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className={styles.summaryCard}>
              <h3 className={styles.cardTitle}>Summary</h3>
              <p className={styles.summaryText}>{result.summary}</p>
            </div>

            {/* Category Scores */}
            <div className={styles.categoryCard}>
              <h3 className={styles.cardTitle}>Compatibility Breakdown</h3>
              <div className={styles.categoryList}>
                {Object.entries(result.categoryScores).map(([key, value]) => (
                  <div key={key} className={styles.categoryItem}>
                    <div className={styles.categoryHeader}>
                      <span className={styles.categoryLabel}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className={styles.categoryValue}>{value}%</span>
                    </div>
                    <div className={styles.categoryBar}>
                      <div 
                        className={styles.categoryBarFill} 
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Astrology Insights */}
            <div className={styles.insightsCard}>
              <h3 className={styles.cardTitle}>Astrological Insights</h3>
              <div className={styles.insightsGrid}>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>🌟</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Guna Milan</div>
                    <div className={styles.insightValue}>{result.astrologyInsights.gunaMilan}/36</div>
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>🔥</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Manglik Status</div>
                    <div className={styles.insightValue}>{result.astrologyInsights.manglikStatus}</div>
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>⏰</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Dasha Alignment</div>
                    <div className={styles.insightValue}>{result.astrologyInsights.dashaAlignment}</div>
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>🪐</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Dominant Planets</div>
                    <div className={styles.insightValue}>
                      {result.astrologyInsights.dominantPlanets.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personality Match */}
            <div className={styles.personalityCard}>
              <h3 className={styles.cardTitle}>Personality Match</h3>
              
              <div className={styles.personalityGrid}>
                <div className={styles.personalityBox}>
                  <div className={styles.personalityHeader}>
                    <div className={styles.personalityAvatar}>
                      {selectedProfile?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.personalityName}>{selectedProfile?.name}</div>
                  </div>
                  <div className={styles.traitsList}>
                    {result.personalityMatch.userA.traits.map((trait, idx) => (
                      <span key={idx} className={styles.traitTag}>{trait}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.personalityBox}>
                  <div className={styles.personalityHeader}>
                    <div className={styles.personalityAvatar}>
                      {partnerData.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.personalityName}>{partnerData.name}</div>
                  </div>
                  <div className={styles.traitsList}>
                    {result.personalityMatch.userB.traits.map((trait, idx) => (
                      <span key={idx} className={styles.traitTag}>{trait}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.dynamicBox}>
                <div className={styles.dynamicLabel}>Relationship Dynamic</div>
                <p className={styles.dynamicText}>{result.personalityMatch.dynamic}</p>
              </div>
            </div>

            {/* Conflict Prediction */}
            <div className={styles.conflictCard}>
              <h3 className={styles.cardTitle}>Potential Challenges</h3>
              <div className={styles.conflictList}>
                {result.conflictPrediction.map((conflict, idx) => (
                  <div key={idx} className={styles.conflictItem}>
                    <div className={styles.conflictHeader}>
                      <span className={styles.conflictArea}>{conflict.area}</span>
                      <span className={`${styles.riskBadge} ${styles[`risk${conflict.riskLevel}`]}`}>
                        {conflict.riskLevel} Risk
                      </span>
                    </div>
                    <p className={styles.conflictReason}>{conflict.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Future Timeline */}
            <div className={styles.timelineCard}>
              <h3 className={styles.cardTitle}>Future Timeline</h3>
              <div className={styles.timelineList}>
                {result.futureTimeline.map((phase, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelinePeriod}>{phase.period}</span>
                        <span className={`${styles.riskBadge} ${styles[`risk${phase.riskLevel}`]}`}>
                          {phase.riskLevel} Risk
                        </span>
                      </div>
                      <p className={styles.timelineTheme}>{phase.theme}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Marriage Recommendation */}
            <div className={styles.marriageCard}>
              <h3 className={styles.cardTitle}>Marriage Recommendation</h3>
              <div className={styles.marriageContent}>
                <div className={styles.marriageStatus}>
                  <div className={styles.marriageIcon}>
                    {result.marriageRecommendation.suitable ? '✅' : '⚠️'}
                  </div>
                  <div className={styles.marriageText}>
                    <div className={styles.marriageLabel}>Suitable for Marriage</div>
                    <div className={styles.marriageValue}>
                      {result.marriageRecommendation.suitable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
                
                {result.marriageRecommendation.bestMarriageWindow && 
                 result.marriageRecommendation.bestMarriageWindow !== 'Not applicable due to age difference' && (
                  <div className={styles.marriageInfo}>
                    <div className={styles.marriageInfoLabel}>Best Marriage Window</div>
                    <div className={styles.marriageInfoValue}>
                      {result.marriageRecommendation.bestMarriageWindow}
                    </div>
                  </div>
                )}
                
                {result.marriageRecommendation.riskIfDelayed && 
                 result.marriageRecommendation.riskIfDelayed !== 'Not applicable due to age difference' && (
                  <div className={styles.marriageInfo}>
                    <div className={styles.marriageInfoLabel}>Risk if Delayed</div>
                    <div className={styles.marriageInfoValue}>
                      {result.marriageRecommendation.riskIfDelayed}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remedies */}
            <div className={styles.remediesCard}>
              <h3 className={styles.cardTitle}>Recommended Remedies</h3>
              <div className={styles.remediesList}>
                {result.remedies.map((remedy, idx) => (
                  <div key={idx} className={styles.remedyItem}>
                    <div className={styles.remedyHeader}>
                      <span className={styles.remedyWho}>
                        {remedy.who === 'userA' 
                          ? selectedProfile?.name 
                          : remedy.who === 'userB' 
                          ? partnerData.name 
                          : 'Both'}
                      </span>
                    </div>
                    <p className={styles.remedyText}>{remedy.remedy}</p>
                    <p className={styles.remedyPurpose}>
                      <strong>Purpose:</strong> {remedy.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button className={styles.newAnalysisButton} onClick={handleRetry}>
              New Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartMatchmaking;
