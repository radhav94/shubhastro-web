import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './DailyCosmicBriefing.module.scss';
import { getDailyCosmicBriefing } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import { getSubscriptionErrorReason } from '../../../../utils/subscription/featureGating';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import { useLazyGetSunSignQuery } from '../../../../redux/api/calculator/calcApi';
import { setSelectedKundliProfile } from '../../../../redux/aiwow/aiwowSlice';
import { setSelectedKundli } from '../../../../redux/kundli/kundliSlice';

const pad = (n) => String(n ?? 0).padStart(2, '0');

const DailyCosmicBriefing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  const [fetchSunSign] = useLazyGetSunSignQuery();
  // The briefing is gated by subscription/quota on the backend. Wrap the fetch
  // so an entitlement block opens the plans popup instead of silently bouncing
  // the user back to the suite.
  const { runWithEntitlement, subscriptionModal, showSubscriptionModal } = useAIWowSubscriptionGate({ featureName: 'daily-cosmic-briefing' });

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/aiwow/daily-cosmic-briefing");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  const [briefing, setBriefing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Tracks the profile id we've already fetched for, so a re-render that
  // changes the profile object reference (same profile) doesn't re-hit the API.
  const fetchedProfileIdRef = useRef(null);

  useEffect(() => {
    if (profile && !profileLoading) {
      const profileId = profile._id || profile.id;
      if (fetchedProfileIdRef.current === profileId) return;
      fetchedProfileIdRef.current = profileId;
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

      // Resolves a valid western sun sign from the astrology API
      // (find-sun-sign) and stores it back on the selected profile for reuse.
      const resolveSunSignFromApi = async () => {
        try {
          const res = await fetchSunSign({
            dob: `${profile.year}-${pad(profile.month)}-${pad(profile.day)}`,
            tob: `${pad(profile.hour)}:${pad(profile.min ?? profile.minute)}`,
            lat: profile.latitude || profile.lat,
            lng: profile.longitude || profile.lon,
          }).unwrap();
          const sign = res?.response?.sun_sign || null;
          if (sign && sign !== profile.sunSign) {
            const updatedProfile = { ...profile, sunSign: sign };
            dispatch(setSelectedKundliProfile(updatedProfile));
            dispatch(setSelectedKundli(updatedProfile));
            localStorage.setItem('selectedKundliProfile', JSON.stringify(updatedProfile));
          }
          return sign;
        } catch (err) {
          console.error('Failed to resolve sun sign from API:', err);
          return null;
        }
      };

      // Runs the briefing fetch with a sun-sign fallback. Wrapped by the
      // entitlement gate so a subscription block opens the plans popup (and
      // retries on purchase). If the first call is blocked on entitlement we
      // return immediately — no point resolving the sun sign for a paid call.
      const generateBriefing = async () => {
        let zodiacSign = profile.sunSign || profile.sign;
        let result = zodiacSign
          ? await getDailyCosmicBriefing(zodiacSign, params)
          : null;

        if (result && !result.success && getSubscriptionErrorReason(result)) {
          return result;
        }

        // Only call find-sun-sign if the briefing failed (or we had no sign),
        // then recall the briefing once with the corrected sign.
        if (!result || !result.success) {
          const apiSign = await resolveSunSignFromApi();
          if (apiSign && apiSign !== zodiacSign) {
            zodiacSign = apiSign;
            result = await getDailyCosmicBriefing(zodiacSign, params);
          }
        }
        return result;
      };

      const result = await runWithEntitlement(generateBriefing);

      // User closed the plans popup without purchasing — go back to the suite.
      // If the gate already routed to /recharge, don't override that redirect.
      if (result?.blocked) {
        if (!result.redirectedToRecharge) navigate('/ai-wow', { replace: true });
        return;
      }

      if (result && result.success) {
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

  // Guests are redirected to login by the effect above; render nothing until
  // then. Placed after all hooks so hook order stays consistent.
  if (!localStorage.getItem("shubhtalk_customer_token")) return null;

  if (profileLoading || isLoading) {
    // Keep the subscription modal mounted here: the entitlement block happens
    // while isLoading is still true, so the popup must be able to render.
    // Hide the loader while the modal is open so the spinner doesn't overlay it.
    return (
      <>
        {subscriptionModal}
        {!showSubscriptionModal && <PrimaryLoader isLoading={true} />}
      </>
    );
  }

  if (!briefing) {
    return <>{subscriptionModal}</>;
  }

  return (
    <>
    {subscriptionModal}
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
          <div className={styles.infoCard}>
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
            <span className={styles.infoTts}>
              <TTSButton text={`Mood. ${briefing.mood?.label}`} />
            </span>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🎨</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Lucky Color</span>
              <span className={styles.infoValue}>{briefing.luckyColor}</span>
            </div>
            <span className={styles.infoTts}>
              <TTSButton text={`Lucky Color. ${briefing.luckyColor}`} />
            </span>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🔢</div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Lucky Number</span>
              <span className={styles.infoValue}>{briefing.luckyNumber}</span>
            </div>
            <span className={styles.infoTts}>
              <TTSButton text={`Lucky Number. ${briefing.luckyNumber}`} />
            </span>
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
