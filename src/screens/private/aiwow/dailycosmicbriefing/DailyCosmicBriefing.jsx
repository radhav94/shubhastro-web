import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DailyCosmicBriefing.module.scss';
import { getDailyCosmicBriefing } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';

const DailyCosmicBriefing = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/aiwow/daily-cosmic-briefing");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  if (!localStorage.getItem("shubhtalk_customer_token")) return null;
  
  const [briefing, setBriefing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile && !profileLoading) {
      fetchBriefing(profile);
    }
  }, [profile, profileLoading]);

  const fetchBriefing = async (profile) => {
    try {
      setIsLoading(true);

      const params = {
        kundliId: profile._id,
        name: profile.name,
        gender: profile.identity?.toLowerCase() || 'male',
        day: profile.day,
        month: profile.month,
        year: profile.year,
        hour: profile.hour || 0,
        min: profile.min || profile.minute || 0,
        second: 0,
        place: profile.place,
        lat: profile.latitude || profile.lat || 0,
        lon: profile.longitude || profile.lon || 0,
        tzone: profile.tzone || 5.5
      };

      // Determine zodiac sign from profile or calculate
      const zodiacSign = profile.sunSign || profile.sign || 'Aries';

      const result = await getDailyCosmicBriefing(zodiacSign, params);

      if (result.success) {
        setBriefing(result.data);
      } else {
        setTimeout(() => {
          navigate('/ai-wow', { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
      setTimeout(() => {
        navigate('/ai-wow', { replace: true });
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/ai-wow');
  };

  const getMoodColor = (level) => {
    if (level >= 80) return '#10b981'; // green
    if (level >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  if (profileLoading || isLoading) {
    return <PrimaryLoader isLoading={true} />;
  }

  if (!briefing) {
    return null;
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
            <h1 className={styles.title}>Daily Cosmic Briefing</h1>
            {profile && (
              <p className={styles.subtitle}>{profile.name}</p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Date & Zodiac */}
        <div className={styles.dateSection}>
          <div className={styles.zodiacBadge}>
            <span className={styles.zodiacSymbol}>{briefing.zodiacInfo?.symbol}</span>
            <span className={styles.zodiacName}>{briefing.zodiacInfo?.name}</span>
          </div>
          <p className={styles.date}>{briefing.formattedDate}</p>
        </div>

        {/* Main Prediction */}
        <div className={styles.predictionCard} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`Today's Cosmic Energy. ${briefing.prediction}`} />
          </span>
          <h2 className={styles.sectionTitle}>Today's Cosmic Energy</h2>
          <p className={styles.prediction}>{briefing.prediction}</p>
        </div>

        {/* Mood & Lucky Items */}
        <div className={styles.quickInfo}>
          <div className={styles.infoCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '4px', right: '4px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Mood. ${briefing.mood?.label}`} />
            </span>
            <div className={styles.infoIcon}>😊</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Mood</span>
              <span 
                className={styles.infoValue}
                style={{ color: getMoodColor(briefing.mood?.level) }}
              >
                {briefing.mood?.label}
              </span>
            </div>
          </div>

          <div className={styles.infoCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '4px', right: '4px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Lucky Color. ${briefing.luckyColor}`} />
            </span>
            <div className={styles.infoIcon}>🎨</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Lucky Color</span>
              <span className={styles.infoValue}>{briefing.luckyColor}</span>
            </div>
          </div>

          <div className={styles.infoCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '4px', right: '4px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Lucky Number. ${briefing.luckyNumber}`} />
            </span>
            <div className={styles.infoIcon}>🔢</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Lucky Number</span>
              <span className={styles.infoValue}>{briefing.luckyNumber}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className={styles.categoriesSection}>
          <h2 className={styles.sectionTitle}>Life Aspects</h2>
          <div className={styles.categories}>
            {Object.entries(briefing.categories || {}).map(([key, value]) => (
              <div key={key} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>
                    {key === 'love' && '❤️'}
                    {key === 'career' && '💼'}
                    {key === 'health' && '🏥'}
                    {key === 'finance' && '💰'}
                  </span>
                  <h3 className={styles.categoryTitle}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </h3>
                  <span style={{ display: 'inline-flex', marginLeft: 'auto' }}>
                    <TTSButton text={`${key.charAt(0).toUpperCase() + key.slice(1)}. Score: ${value.score}. ${value.description}`} />
                  </span>
                  <div className={styles.scoreCircle}>
                    <span>{value.score}</span>
                  </div>
                </div>
                <p className={styles.categoryDescription}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Advice */}
        {briefing.advice && (
          <div className={styles.adviceCard} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Cosmic Advice. ${briefing.advice}`} />
            </span>
            <div className={styles.adviceIcon}>💡</div>
            <div className={styles.adviceContent}>
              <h3 className={styles.adviceTitle}>Cosmic Advice</h3>
              <p className={styles.adviceText}>{briefing.advice}</p>
            </div>
          </div>
        )}

        {/* Compatible Signs */}
        {briefing.compatibleSigns && briefing.compatibleSigns.length > 0 && (
          <div className={styles.compatibleSection} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
              <TTSButton text={`Compatible Signs Today. ${briefing.compatibleSigns.join(', ')}`} />
            </span>
            <h3 className={styles.compatibleTitle}>Compatible Signs Today</h3>
            <div className={styles.compatibleSigns}>
              {briefing.compatibleSigns.map((sign, index) => (
                <div key={index} className={styles.compatibleSign}>
                  {sign}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={styles.dailyBriefButton}
          onClick={() => navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path)}
        >
          Consult with Expert Astrologer
        </button>
      </div>
    </div>
    </>
  );
};

export default DailyCosmicBriefing;
