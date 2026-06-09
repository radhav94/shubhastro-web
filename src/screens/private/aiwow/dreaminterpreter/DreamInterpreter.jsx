import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DreamInterpreter.module.scss';
import { Toast } from '../../../../component';
import { interpretDream } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';

const DreamInterpreter = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/aiwow/dream-interpreter");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  if (!localStorage.getItem("shubhtalk_customer_token")) return null;  
  const [dreamDescription, setDreamDescription] = useState('');
  const [tags, setTags] = useState('');
  const [lifePhase, setLifePhase] = useState('');
  const [challenges, setChallenges] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [error, setError] = useState(null);
  const [showMorePsych, setShowMorePsych] = useState(false);
  const [showMoreAstro, setShowMoreAstro] = useState(false);
  const [showMorePersonalized, setShowMorePersonalized] = useState(false);
  const [showMoreSymbols, setShowMoreSymbols] = useState(false);
  const [showMoreSpiritual, setShowMoreSpiritual] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile) {
      Toast.error('Profile not available');
      return;
    }

    if (!dreamDescription.trim()) {
      Toast.error('Please describe your dream');
      return;
    }

    if (dreamDescription.trim().length < 20) {
      Toast.error('Please provide more details about your dream (at least 20 characters)');
      return;
    }

    try {
      setIsLoading(true);

      const dreamData = {
        dreamDescription: dreamDescription.trim(),
        name: profile.name,
        gender: profile.identity?.toLowerCase() || 'male',
        day: profile.day,
        month: profile.month,
        year: profile.year,
        hour: profile.hour || 0,
        min: profile.minute || 0,
        second: 0,
        place: profile.place,
        lat: profile.lat || 0,
        lon: profile.lon || 0,
        tzone: profile.tzone || 5.5
      };

      console.log('dreamData :>> ', dreamData);

      // Add tags if provided
      if (tags.trim()) {
        dreamData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      // Add user context if provided
      if (lifePhase.trim() || challenges.trim()) {
        dreamData.userContext = {};
        if (lifePhase.trim()) {
          dreamData.userContext.lifePhase = lifePhase.trim();
        }
        if (challenges.trim()) {
          dreamData.userContext.currentChallenges = challenges.split(',').map(c => c.trim()).filter(c => c);
        }
      }

      const result = await interpretDream(dreamData);

      if (result.success) {
        // API returns data.dream object
        setInterpretation(result.data?.dream || result.data);
        setError(null);
      } else {
        // Set error state to show error UI
        setError(result.error || 'Failed to interpret dream');
        setInterpretation(null);
      }
    } catch (error) {
      console.error('Failed to interpret dream:', error);
      setError('An unexpected error occurred. Please try again.');
      setInterpretation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (interpretation || error) {
      setInterpretation(null);
      setError(null);
      setDreamDescription('');
      setTags('');
      setLifePhase('');
      setChallenges('');
    } else {
      navigate('/ai-wow');
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setInterpretation(null);
  };

  if (profileLoading) {
    return <PrimaryLoader isLoading={true} />;
  }

  return (
    <>
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Dream Interpreter</h1>
            {profile && (
              <p className={styles.subtitle}>{profile.name}</p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {error ? (
          <div className={styles.errorSection} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Analysis Failed. ${error}. Please provide a clear and detailed description of your actual dream.`} />
            </span>
            <div className={styles.errorIcon}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#ef4444" strokeWidth="2" fill="none"/>
                <path d="M32 20V36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="32" cy="44" r="2" fill="#ef4444"/>
              </svg>
            </div>
            <div className={styles.errorMessage}>
              <h3>{error}</h3>
              <p>Please provide a clear and detailed description of your actual dream.</p>
            </div>
            <button 
              className={styles.tryAgainButton}
              onClick={handleTryAgain}
            >
              Try Again
            </button>
          </div>
        ) : !interpretation ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.introSection}>
              <div className={styles.introIcon}>🌙</div>
              <h2 className={styles.introTitle}>Decode Your Dreams</h2>
              <p className={styles.introText}>
                Share your dream and receive insights combining psychological analysis with astrological wisdom
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Describe Your Dream <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="I was flying over an ocean and saw a house floating on water. I felt free but also anxious..."
                value={dreamDescription}
                onChange={(e) => setDreamDescription(e.target.value)}
                rows={6}
                disabled={isLoading}
              />
              <span className={styles.charCount}>
                {dreamDescription.length} characters (minimum 20)
              </span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Dream Tags <span className={styles.optional}>(Optional)</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="flying, ocean, house, anxiety (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isLoading}
              />
              <span className={styles.hint}>
                Add keywords to help identify dream symbols
              </span>
            </div>

            <div className={styles.contextSection}>
              <h3 className={styles.contextTitle}>Additional Context (Optional)</h3>
              <p className={styles.contextDesc}>
                Providing context helps generate more personalized insights
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Current Life Phase</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., Career transition, New relationship, Student life"
                  value={lifePhase}
                  onChange={(e) => setLifePhase(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Current Challenges</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., job change, relationship, health (comma separated)"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading || !dreamDescription.trim() || dreamDescription.trim().length < 20}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Interpreting Dream...
                </>
              ) : (
                'Interpret Dream'
              )}
            </button>
          </form>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <div className={styles.resultIcon}>✨</div>
              <h2 className={styles.resultTitle}>Dream Interpretation</h2>
            </div>

            <div className={styles.resultGrid}>
            {/* Dream Summary */}
            {interpretation.summary && (
              <div className={`${styles.resultCard} ${styles.fullWidth}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {interpretation.summary.title || 'Dream Summary'}
                  </h3>
                  <TTSButton text={`${interpretation.summary.title || 'Dream Summary'}. ${interpretation.summary.mainTheme || ''}${interpretation.summary.emotionalTone ? '. Emotional Tone: ' + interpretation.summary.emotionalTone : ''}${interpretation.summary.intensity ? '. Intensity: ' + interpretation.summary.intensity + ' percent' : ''}`} />
                </div>
                <div className={styles.contentWrapper}>
                  {interpretation.summary.mainTheme && (
                    <div className={styles.insightSection}>
                      <p className={styles.cardText}>{interpretation.summary.mainTheme}</p>
                    </div>
                  )}
                  {interpretation.summary.emotionalTone && (
                    <div className={styles.summaryMeta}>
                      <span className={styles.metaItem}>
                        Emotional Tone: <strong>{interpretation.summary.emotionalTone}</strong>
                      </span>
                      {interpretation.summary.intensity && (
                        <span className={styles.metaItem}>
                          Intensity: <strong>{interpretation.summary.intensity}%</strong>
                        </span>
                      )}
                      {interpretation.summary.lucidity && (
                        <span className={styles.metaItem}>
                          Lucidity: <strong>{interpretation.summary.lucidity}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Interpretation */}
            {interpretation.interpretation && (
              <div className={`${styles.resultCard} ${styles.fullWidth}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>💫 Interpretation</h3>
                  <TTSButton text={`Interpretation. ${interpretation.interpretation}`} />
                </div>
                <div className={styles.contentWrapper}>
                  <div className={styles.insightSection}>
                    <p className={styles.cardText}>{interpretation.interpretation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {interpretation.keyTakeaways && interpretation.keyTakeaways.length > 0 && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>🎯 Key Takeaways</h3>
                  <TTSButton text={`Key Takeaways. ${interpretation.keyTakeaways.join('. ')}`} />
                </div>
                <div className={styles.contentWrapper}>
                  <ul className={styles.takeawaysList}>
                    {interpretation.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className={styles.takeawayItem}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Psychological Insights */}
            {interpretation.psychologicalInsights && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>🧠 Psychological Insights</h3>
                  <TTSButton text={`Psychological Insights. ${interpretation.psychologicalInsights.consciousLevel ? 'Conscious Level: ' + interpretation.psychologicalInsights.consciousLevel + '. ' : ''}${interpretation.psychologicalInsights.subconsciousLevel ? 'Subconscious Level: ' + interpretation.psychologicalInsights.subconsciousLevel + '. ' : ''}${interpretation.psychologicalInsights.shadowAspects ? 'Shadow Aspects: ' + interpretation.psychologicalInsights.shadowAspects + '. ' : ''}${interpretation.psychologicalInsights.desires?.length > 0 ? 'Desires: ' + interpretation.psychologicalInsights.desires.join(', ') + '. ' : ''}${interpretation.psychologicalInsights.fears?.length > 0 ? 'Fears: ' + interpretation.psychologicalInsights.fears.join(', ') + '. ' : ''}${interpretation.psychologicalInsights.unresolved?.length > 0 ? 'Unresolved: ' + interpretation.psychologicalInsights.unresolved.join(', ') + '. ' : ''}${interpretation.psychologicalInsights.growthOpportunities?.length > 0 ? 'Growth Opportunities: ' + interpretation.psychologicalInsights.growthOpportunities.join(', ') : ''}`} />
                </div>
                <div className={`${styles.contentWrapper} ${!showMorePsych ? styles.collapsedContent : ''}`}>
                  {interpretation.psychologicalInsights.consciousLevel && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Conscious Level</h4>
                      <p className={styles.cardText}>{interpretation.psychologicalInsights.consciousLevel}</p>
                    </div>
                  )}
                  {interpretation.psychologicalInsights.subconsciousLevel && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Subconscious Level</h4>
                      <p className={styles.cardText}>{interpretation.psychologicalInsights.subconsciousLevel}</p>
                    </div>
                  )}
                  {interpretation.psychologicalInsights.shadowAspects && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Shadow Aspects</h4>
                      <p className={styles.cardText}>{interpretation.psychologicalInsights.shadowAspects}</p>
                    </div>
                  )}
                  {interpretation.psychologicalInsights.desires?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Desires</h4>
                      <div className={styles.tagList}>
                        {interpretation.psychologicalInsights.desires.map((d, i) => (
                          <span key={i} className={styles.tag}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {interpretation.psychologicalInsights.fears?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Fears</h4>
                      <div className={styles.tagList}>
                        {interpretation.psychologicalInsights.fears.map((f, i) => (
                          <span key={i} className={styles.tag}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {interpretation.psychologicalInsights.unresolved?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Unresolved</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.psychologicalInsights.unresolved.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interpretation.psychologicalInsights.growthOpportunities?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Growth Opportunities</h4>
                      <div className={styles.tagList}>
                        {interpretation.psychologicalInsights.growthOpportunities.map((g, i) => (
                          <span key={i} className={styles.tag}>{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.showMoreContainer}>
                  <button className={styles.showMoreBtn} onClick={() => setShowMorePsych(!showMorePsych)}>
                    {showMorePsych ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              </div>
            )}

            {/* Astrological Connection */}
            {interpretation.astrologicalConnection && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>⭐ Astrological Connection</h3>
                  <TTSButton text={`Astrological Connection. ${interpretation.astrologicalConnection.cosmicTiming ? 'Cosmic Timing: ' + interpretation.astrologicalConnection.cosmicTiming + '. ' : ''}${interpretation.astrologicalConnection.moonPhaseImpact ? 'Moon Phase: ' + interpretation.astrologicalConnection.moonPhaseImpact + '. ' : ''}${interpretation.astrologicalConnection.planetaryInfluences?.length > 0 ? 'Planetary Influences: ' + interpretation.astrologicalConnection.planetaryInfluences.map(p => p.planet + ' - ' + p.influence).join('. ') + '. ' : ''}${interpretation.astrologicalConnection.relevantHouses?.length > 0 ? 'Relevant Houses: ' + interpretation.astrologicalConnection.relevantHouses.map(h => h.house + ' ' + h.name + ' - ' + h.connection).join('. ') : ''}`} />
                </div>
                <div className={`${styles.contentWrapper} ${!showMoreAstro ? styles.collapsedContent : ''}`}>
                  {interpretation.astrologicalConnection.cosmicTiming && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Cosmic Timing</h4>
                      <p className={styles.cardText}>{interpretation.astrologicalConnection.cosmicTiming}</p>
                    </div>
                  )}
                  {interpretation.astrologicalConnection.moonPhaseImpact && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Moon Phase</h4>
                      <p className={styles.cardText}>{interpretation.astrologicalConnection.moonPhaseImpact}</p>
                    </div>
                  )}
                  {interpretation.astrologicalConnection.planetaryInfluences?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Planetary Influences</h4>
                      <div className={styles.planetaryList}>
                        {interpretation.astrologicalConnection.planetaryInfluences.map((planet, index) => (
                          <div key={index} className={styles.planetaryItem}>
                            <span className={styles.planetName}>{planet.planet}</span>
                            <span className={styles.planetInfluence}>{planet.influence}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {interpretation.astrologicalConnection.relevantHouses?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Relevant Houses</h4>
                      <div className={styles.planetaryList}>
                        {interpretation.astrologicalConnection.relevantHouses.map((h, i) => (
                          <div key={i} className={styles.houseItem}>
                            <span className={styles.houseName}>{h.house} - {h.name}</span>
                            <span className={styles.houseConnection}>{h.connection}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.showMoreContainer}>
                  <button className={styles.showMoreBtn} onClick={() => setShowMoreAstro(!showMoreAstro)}>
                    {showMoreAstro ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              </div>
            )}

            {/* Symbols & Spiritual Meaning - Row Layout */}
            {(interpretation.symbols?.length > 0 || interpretation.spiritualMeaning) && (
              <div className={`${styles.rowCards} ${styles.fullWidth}`}>
                {/* Symbols */}
                {interpretation.symbols && interpretation.symbols.length > 0 && (
                  <div className={styles.resultCard} style={{ flex: 1 }}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>🔮 Dream Symbols</h3>
                      <TTSButton text={`Dream Symbols. ${interpretation.symbols.map(s => s.symbol + ': ' + s.meaning + (s.personalSignificance ? '. Personal: ' + s.personalSignificance : '')).join('. ')}`} />
                    </div>
                    <div className={`${styles.contentWrapper} ${!showMoreSymbols ? styles.collapsedContent : ''}`}>
                      {interpretation.symbols.map((symbol, index) => (
                        <div key={index} className={styles.insightSection}>
                          <h4 className={styles.insightSubtitle}>{symbol.symbol} {symbol.category && <span className={styles.symbolCategory}>{symbol.category}</span>}</h4>
                          <p className={styles.cardText}>{symbol.meaning}</p>
                          {symbol.personalSignificance && (
                            <p className={styles.cardText} style={{ marginTop: '0.5rem', borderLeftColor: '#8b5cf6' }}>
                              <strong>Personal:</strong> {symbol.personalSignificance}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {interpretation.symbols.length > 2 && (
                      <div className={styles.showMoreContainer}>
                        <button className={styles.showMoreBtn} onClick={() => setShowMoreSymbols(!showMoreSymbols)}>
                          {showMoreSymbols ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Spiritual Meaning */}
                {interpretation.spiritualMeaning && (
                  <div className={styles.resultCard} style={{ flex: 1 }}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>🕉️ Spiritual Meaning</h3>
                      <TTSButton text={`Spiritual Meaning. ${interpretation.spiritualMeaning.soulMessage ? 'Soul Message: ' + interpretation.spiritualMeaning.soulMessage + '. ' : ''}${interpretation.spiritualMeaning.spiritualGuidance ? 'Spiritual Guidance: ' + interpretation.spiritualMeaning.spiritualGuidance + '. ' : ''}${interpretation.spiritualMeaning.karmaConnection ? 'Karma Connection: ' + interpretation.spiritualMeaning.karmaConnection + '. ' : ''}${interpretation.spiritualMeaning.pastLifeEchoes ? 'Past Life Echoes: ' + interpretation.spiritualMeaning.pastLifeEchoes + '. ' : ''}${interpretation.spiritualMeaning.divineGuidance ? 'Divine Guidance: ' + interpretation.spiritualMeaning.divineGuidance : ''}`} />
                    </div>
                    <div className={`${styles.contentWrapper} ${!showMoreSpiritual ? styles.collapsedContent : ''}`}>
                      {interpretation.spiritualMeaning.soulMessage && (
                        <div className={styles.insightSection}>
                          <h4 className={styles.insightSubtitle}>Soul Message</h4>
                          <p className={styles.cardText}>{interpretation.spiritualMeaning.soulMessage}</p>
                        </div>
                      )}
                      {interpretation.spiritualMeaning.spiritualGuidance && (
                        <div className={styles.insightSection}>
                          <h4 className={styles.insightSubtitle}>Spiritual Guidance</h4>
                          <p className={styles.cardText}>{interpretation.spiritualMeaning.spiritualGuidance}</p>
                        </div>
                      )}
                      {interpretation.spiritualMeaning.karmaConnection && (
                        <div className={styles.insightSection}>
                          <h4 className={styles.insightSubtitle}>Karma Connection</h4>
                          <p className={styles.cardText}>{interpretation.spiritualMeaning.karmaConnection}</p>
                        </div>
                      )}
                      {interpretation.spiritualMeaning.pastLifeEchoes && (
                        <div className={styles.insightSection}>
                          <h4 className={styles.insightSubtitle}>Past Life Echoes</h4>
                          <p className={styles.cardText}>{interpretation.spiritualMeaning.pastLifeEchoes}</p>
                        </div>
                      )}
                      {interpretation.spiritualMeaning.divineGuidance && (
                        <div className={styles.insightSection}>
                          <h4 className={styles.insightSubtitle}>Divine Guidance</h4>
                          <p className={styles.cardText}>{interpretation.spiritualMeaning.divineGuidance}</p>
                        </div>
                      )}
                    </div>
                    <div className={styles.showMoreContainer}>
                      <button className={styles.showMoreBtn} onClick={() => setShowMoreSpiritual(!showMoreSpiritual)}>
                        {showMoreSpiritual ? 'Show Less' : 'Show More'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guidance */}
            {interpretation.guidance && (
              <div className={`${styles.resultCard} ${styles.fullWidth}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>💡 Actionable Guidance</h3>
                  <TTSButton text={`Actionable Guidance. ${interpretation.guidance.immediateActions?.length > 0 ? 'Immediate Actions: ' + interpretation.guidance.immediateActions.join('. ') + '. ' : ''}${interpretation.guidance.reflectionQuestions?.length > 0 ? 'Reflection Questions: ' + interpretation.guidance.reflectionQuestions.join('. ') + '. ' : ''}${interpretation.guidance.journalingPrompts?.length > 0 ? 'Journaling Prompts: ' + interpretation.guidance.journalingPrompts.join('. ') + '. ' : ''}${interpretation.guidance.rituals?.length > 0 ? 'Rituals: ' + interpretation.guidance.rituals.join('. ') : ''}`} />
                </div>
                <div className={styles.contentWrapper}>
                  {interpretation.guidance.immediateActions?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Immediate Actions</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.guidance.immediateActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interpretation.guidance.reflectionQuestions?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Reflection Questions</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.guidance.reflectionQuestions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interpretation.guidance.journalingPrompts?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Journaling Prompts</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.guidance.journalingPrompts.map((prompt, index) => (
                          <li key={index}>{prompt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interpretation.guidance.rituals?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Rituals</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.guidance.rituals.map((ritual, index) => (
                          <li key={index}>{ritual}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emotional Analysis */}
            {interpretation.emotionalAnalysis && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>💜 Emotional Analysis</h3>
                  <TTSButton text={`Emotional Analysis. ${interpretation.emotionalAnalysis.primaryEmotions?.length > 0 ? 'Primary Emotions: ' + interpretation.emotionalAnalysis.primaryEmotions.map(e => e.emotion + ' ' + e.intensity + ' percent').join(', ') + '. ' : ''}${interpretation.emotionalAnalysis.emotionalBalance ? 'Emotional Balance: ' + interpretation.emotionalAnalysis.emotionalBalance + '. ' : ''}${interpretation.emotionalAnalysis.healingNeeded ? 'Healing Needed: ' + interpretation.emotionalAnalysis.healingNeeded : ''}`} />
                </div>
                <div className={styles.contentWrapper}>
                  {interpretation.emotionalAnalysis.primaryEmotions?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Primary Emotions</h4>
                      <div className={styles.emotionList}>
                        {interpretation.emotionalAnalysis.primaryEmotions.map((e, i) => (
                          <div key={i} className={styles.emotionItem}>
                            <span className={styles.emotionName}>{e.emotion}</span>
                            <span className={styles.emotionIntensity}>{e.intensity}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {interpretation.emotionalAnalysis.emotionalBalance && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Emotional Balance</h4>
                      <p className={styles.cardText}>{interpretation.emotionalAnalysis.emotionalBalance}</p>
                    </div>
                  )}
                  {interpretation.emotionalAnalysis.healingNeeded && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Healing Needed</h4>
                      <p className={styles.cardText}>{interpretation.emotionalAnalysis.healingNeeded}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {interpretation.opportunities && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>🌱 Growth Opportunities</h3>
                  <TTSButton text={`Growth Opportunities. ${interpretation.opportunities.growthAreas?.length > 0 ? 'Growth Areas: ' + interpretation.opportunities.growthAreas.join('. ') + '. ' : ''}${interpretation.opportunities.manifestationPotential ? 'Manifestation Potential: ' + interpretation.opportunities.manifestationPotential + '. ' : ''}${interpretation.opportunities.timingAdvice ? 'Timing Advice: ' + interpretation.opportunities.timingAdvice : ''}`} />
                </div>
                <div className={styles.contentWrapper}>
                  {interpretation.opportunities.growthAreas?.length > 0 && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Growth Areas</h4>
                      <ul className={styles.takeawaysList}>
                        {interpretation.opportunities.growthAreas.map((area, index) => (
                          <li key={index} className={styles.takeawayItem}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interpretation.opportunities.manifestationPotential && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Manifestation Potential</h4>
                      <p className={styles.cardText}>{interpretation.opportunities.manifestationPotential}</p>
                    </div>
                  )}
                  {interpretation.opportunities.timingAdvice && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Timing Advice</h4>
                      <p className={styles.cardText}>{interpretation.opportunities.timingAdvice}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Personalized Insights */}
            {interpretation.personalizedInsights && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>🪐 Personalized Insights</h3>
                  <TTSButton text={`Personalized Insights. ${interpretation.personalizedInsights.birthChartConnection ? 'Birth Chart Connection: ' + interpretation.personalizedInsights.birthChartConnection + '. ' : ''}${interpretation.personalizedInsights.zodiacInfluence ? 'Zodiac Influence: ' + interpretation.personalizedInsights.zodiacInfluence + '. ' : ''}${interpretation.personalizedInsights.lifePathAlignment ? 'Life Path Alignment: ' + interpretation.personalizedInsights.lifePathAlignment + '. ' : ''}${interpretation.personalizedInsights.karmaReflection ? 'Karma Reflection: ' + interpretation.personalizedInsights.karmaReflection + '. ' : ''}${interpretation.personalizedInsights.planetaryMessage ? 'Planetary Message: ' + interpretation.personalizedInsights.planetaryMessage : ''}`} />
                </div>
                <div className={`${styles.contentWrapper} ${!showMorePersonalized ? styles.collapsedContent : ''}`}>
                  {interpretation.personalizedInsights.birthChartConnection && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Birth Chart Connection</h4>
                      <p className={styles.cardText}>{interpretation.personalizedInsights.birthChartConnection}</p>
                    </div>
                  )}
                  {interpretation.personalizedInsights.zodiacInfluence && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Zodiac Influence</h4>
                      <p className={styles.cardText}>{interpretation.personalizedInsights.zodiacInfluence}</p>
                    </div>
                  )}
                  {interpretation.personalizedInsights.lifePathAlignment && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Life Path Alignment</h4>
                      <p className={styles.cardText}>{interpretation.personalizedInsights.lifePathAlignment}</p>
                    </div>
                  )}
                  {interpretation.personalizedInsights.karmaReflection && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Karma Reflection</h4>
                      <p className={styles.cardText}>{interpretation.personalizedInsights.karmaReflection}</p>
                    </div>
                  )}
                  {interpretation.personalizedInsights.planetaryMessage && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Planetary Message</h4>
                      <p className={styles.cardText}>{interpretation.personalizedInsights.planetaryMessage}</p>
                    </div>
                  )}
                </div>
                <div className={styles.showMoreContainer}>
                  <button className={styles.showMoreBtn} onClick={() => setShowMorePersonalized(!showMorePersonalized)}>
                    {showMorePersonalized ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              </div>
            )}

            {/* Remedies */}
            {interpretation.personalizedInsights?.remedies?.length > 0 && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>💎 Remedies</h3>
                  <TTSButton text={`Remedies. ${interpretation.personalizedInsights.remedies.join('. ')}`} />
                </div>
                <div className={styles.contentWrapper}>
                  {interpretation.personalizedInsights.remedies.map((remedy, index) => (
                    <div key={index} className={styles.insightSection}>
                      <p className={styles.cardText}>{remedy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {interpretation.warnings?.hasWarnings && interpretation.warnings.cautionAreas?.length > 0 && (
              <div className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>⚠️ Caution Areas</h3>
                  <TTSButton text={`Warnings. ${interpretation.warnings.cautionAreas.join('. ')}`} />
                </div>
                <div className={styles.contentWrapper}>
                  <div className={styles.insightSection}>
                    <ul className={styles.takeawaysList}>
                      {interpretation.warnings.cautionAreas.map((area, index) => (
                        <li key={index} className={styles.takeawayItem}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  {interpretation.warnings.preventiveAdvice && (
                    <div className={styles.insightSection}>
                      <h4 className={styles.insightSubtitle}>Preventive Advice</h4>
                      <p className={styles.cardText}>{interpretation.warnings.preventiveAdvice}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Action Button */}
            <button className={styles.newDreamButton} onClick={() => navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path)}>
              Consult with Expert Astrologer
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default DreamInterpreter;
