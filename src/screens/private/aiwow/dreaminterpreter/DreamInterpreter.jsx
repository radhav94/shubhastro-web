import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DreamInterpreter.module.scss';
import { Toast } from '../../../../component';
import { interpretDream } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import Footer from '../../../../layouts/Footer';

const DreamInterpreter = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  
  const [dreamDescription, setDreamDescription] = useState('');
  const [tags, setTags] = useState('');
  const [lifePhase, setLifePhase] = useState('');
  const [challenges, setChallenges] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [error, setError] = useState(null);

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
        tzone: profile.timezone || 5.5
      };

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
      navigate(-1);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setInterpretation(null);
  };

  const handleNewDream = () => {
    setInterpretation(null);
    setDreamDescription('');
    setTags('');
    setLifePhase('');
    setChallenges('');
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
          <div className={styles.errorSection}>
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

            {/* Dream Summary */}
            {interpretation.summary && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>
                  {interpretation.summary.title || 'Dream Summary'}
                </h3>
                {interpretation.summary.mainTheme && (
                  <p className={styles.cardText}>{interpretation.summary.mainTheme}</p>
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
                  </div>
                )}
              </div>
            )}

            {/* Main Interpretation */}
            {interpretation.interpretation && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>💫 Interpretation</h3>
                <p className={styles.cardText}>{interpretation.interpretation}</p>
              </div>
            )}

            {/* Key Takeaways */}
            {interpretation.keyTakeaways && interpretation.keyTakeaways.length > 0 && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>🎯 Key Takeaways</h3>
                <ul className={styles.takeawaysList}>
                  {interpretation.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className={styles.takeawayItem}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Psychological Insights */}
            {interpretation.psychologicalInsights && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>🧠 Psychological Insights</h3>
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
              </div>
            )}

            {/* Astrological Connection */}
            {interpretation.astrologicalConnection && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>⭐ Astrological Connection</h3>
                {interpretation.astrologicalConnection.cosmicTiming && (
                  <p className={styles.cardText}>{interpretation.astrologicalConnection.cosmicTiming}</p>
                )}
                {interpretation.astrologicalConnection.planetaryInfluences && 
                 interpretation.astrologicalConnection.planetaryInfluences.length > 0 && (
                  <div className={styles.planetaryList}>
                    {interpretation.astrologicalConnection.planetaryInfluences.slice(0, 3).map((planet, index) => (
                      <div key={index} className={styles.planetaryItem}>
                        <span className={styles.planetName}>{planet.planet}</span>
                        <span className={styles.planetInfluence}>{planet.influence}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Symbols */}
            {interpretation.symbols && interpretation.symbols.length > 0 && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>🔮 Dream Symbols</h3>
                <div className={styles.symbolsList}>
                  {interpretation.symbols.map((symbol, index) => (
                    <div key={index} className={styles.symbolItem}>
                      <div className={styles.symbolHeader}>
                        <span className={styles.symbolName}>{symbol.symbol}</span>
                        {symbol.category && (
                          <span className={styles.symbolCategory}>{symbol.category}</span>
                        )}
                      </div>
                      <p className={styles.symbolMeaning}>{symbol.meaning}</p>
                      {symbol.personalSignificance && (
                        <p className={styles.symbolPersonal}>
                          <strong>Personal:</strong> {symbol.personalSignificance}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spiritual Meaning */}
            {interpretation.spiritualMeaning && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>🕉️ Spiritual Meaning</h3>
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
              </div>
            )}

            {/* Guidance */}
            {interpretation.guidance && (
              <div className={styles.guidanceCard}>
                <div className={styles.guidanceIcon}>💡</div>
                <div className={styles.guidanceContent}>
                  <h3 className={styles.guidanceTitle}>Actionable Guidance</h3>
                  {interpretation.guidance.immediateActions && interpretation.guidance.immediateActions.length > 0 && (
                    <div className={styles.guidanceSection}>
                      <h4 className={styles.guidanceSubtitle}>Immediate Actions</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.guidance.immediateActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interpretation.guidance.reflectionQuestions && interpretation.guidance.reflectionQuestions.length > 0 && (
                    <div className={styles.guidanceSection}>
                      <h4 className={styles.guidanceSubtitle}>Reflection Questions</h4>
                      <ul className={styles.guidanceList}>
                        {interpretation.guidance.reflectionQuestions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {interpretation.opportunities && interpretation.opportunities.growthAreas && 
             interpretation.opportunities.growthAreas.length > 0 && (
              <div className={styles.resultCard}>
                <h3 className={styles.cardTitle}>🌱 Growth Opportunities</h3>
                <ul className={styles.takeawaysList}>
                  {interpretation.opportunities.growthAreas.map((area, index) => (
                    <li key={index} className={styles.takeawayItem}>{area}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Button */}
            <button className={styles.newDreamButton} onClick={handleNewDream}>
              Interpret Another Dream
            </button>
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
};

export default DreamInterpreter;
