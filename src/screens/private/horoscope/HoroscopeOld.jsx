import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  useFetchWesternDailyQuery, 
  useFetchWesternTomorrowQuery,
  useFetchWeeklyQuery, 
  useFetchWesternYearlyQuery
} from '../../../redux/api/horoscope/zodiacApi';
import { signToNumber, zodiacDateRanges } from './utils';
import PrimaryLoader from '../../../component/UI/PrimaryLoader';
import TTSButton from '../../../component/UI/TTSButton';
import { formatted } from '../../../utils/dateFormat/date';
import { zodiac, zodiacSignImages } from './zodiac';
import './HoroscopeOld.css';
import { useGetAllKundlisQuery } from '../../../services/appServices/kundliServicesNew';
import { useSelector, useDispatch } from 'react-redux';
import { useGetAstroDetailsQuery } from '../../../redux/api/kundli/kundliApi';
import { buildVedicParam } from '../../../utils/VedicParams.js/vedicParams';
import { trackEvent } from '../../../utils/analytics';
import { ProfileManager } from '../../../component/UI/Profile';
import { setSelectedKundli } from '../../../redux/kundli/kundliSlice';
import { getJSONCookie, GUEST_KUNDLI_COOKIE } from '../../../utils/helper/cookies';
const overViewImg = "https://assets.shubhastro.ai/images/horoscope/overview.png";
const financeImg = "https://assets.shubhastro.ai/images/horoscope/finances.png";
const scoreImg = "https://assets.shubhastro.ai/images/horoscope/total-score.png";
const healthImg = "https://assets.shubhastro.ai/images/horoscope/health.png";
const friendsImg = "https://assets.shubhastro.ai/images/horoscope/friends.png";
const familyImg = "https://assets.shubhastro.ai/images/horoscope/family.png";
const travelImg = "https://assets.shubhastro.ai/images/horoscope/travel.png";
const careerImg = "https://assets.shubhastro.ai/images/horoscope/career.png";
const relationImg = "https://assets.shubhastro.ai/images/horoscope/relationship.png";
const statusImg = "https://assets.shubhastro.ai/images/horoscope/status.png";
const physiqueImg = "https://assets.shubhastro.ai/images/horoscope/physique.png";

// Helper to determine if text on a colored background should be dark
const isLightColor = (color) => {
  if (!color) return false;
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return true; // fallback: treat named colors as light to be safe
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

const HoroscopeOld = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sign } = useParams();
  const location = useLocation();
  const { pathname } = location;
  
  // Category image mapping
  const categoryImages = {
    overview: overViewImg,
    finances: financeImg,
    relationship: relationImg,
    total_score: scoreImg,
    health: healthImg,
    friends: friendsImg,
    family: familyImg,
    travel: travelImg,
    career: careerImg,
    status: statusImg,
    physique: physiqueImg,

    // Names are Not coming from the API So commented
    // totalscore: scoreImg,
    // relation: relationImg,
    // finance: financeImg,
    // score: scoreImg,
    // carrer: careerImg,
    // Add alternative spellings/variations
    // emotions: scoreImg,
    // personal_life: relationImg,
    // profession: careerImg,
    // luck: scoreImg,
    // travel_and_health: travelImg
  };

  // Function to get category image
  const getCategoryImage = (categoryId) => {
    const id = categoryId.toLowerCase().replace(/\s+/g, '_');
    // Try exact match first
    if (categoryImages[categoryId.toLowerCase()]) {
      return categoryImages[categoryId.toLowerCase()];
    }
    // Try with underscores
    if (categoryImages[id]) {
      return categoryImages[id];
    }
    // Try without spaces
    const noSpaces = categoryId.toLowerCase().replace(/\s+/g, '');
    if (categoryImages[noSpaces]) {
      return categoryImages[noSpaces];
    }
    return overViewImg; // Default to overview image
  };
  
  // Get zodiac signs from zodiac.js (same as old implementation)
  const [zodiacData] = zodiac();
  const zodiacSigns = zodiacData.signs.map(sign => ({
    id: sign.id,
    name: sign.name,
    dateRange: sign.range
  }));
  
  // Determine initial tab based on URL path
  const getInitialTab = () => {
    if (pathname.includes('tomorrow-horoscope')) {
      return 'Tomorrow';
    } else if (pathname.includes('daily-horoscope') || pathname.includes('todays-horoscope')) {
      return 'Today';
    } else if (pathname.includes('weekly-horoscope')) {
      return 'This Week';
    } else if (pathname.includes('yearly-horoscope')) {
      return 'This Year';
    }
    return 'Today';
  };
  
  // Get header-selected Kundli from Redux (top priority)
  const headerSelectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  // Fetch user's Kundli profiles for default zodiac selection
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const { data: kundliProfilesData } = useGetAllKundlisQuery(undefined, {
    skip: !isLoggedIn,
  });
  const kundliProfiles = kundliProfilesData?.data || [];

  // Determine the active profile: header-selected > Self > first profile.
  // For guests (not logged in): if a guest Kundli profile exists (selected in
  // redux or stored in the cookie), use it; otherwise fall back to the
  // "Select Zodiac" flow.
  const guestProfile = useMemo(() => {
    if (isLoggedIn) return null;
    if (headerSelectedKundli?._id || headerSelectedKundli?.name) return headerSelectedKundli;
    const stored = getJSONCookie(GUEST_KUNDLI_COOKIE, []);
    return Array.isArray(stored) && stored.length > 0 ? stored[0] : null;
  }, [isLoggedIn, headerSelectedKundli]);

  const activeProfile = !isLoggedIn
    ? guestProfile
    : headerSelectedKundli?._id
      ? headerSelectedKundli
      : kundliProfiles.find((p) => p.relation?.toLowerCase() === 'self') || kundliProfiles[0] || null;

  // Build vedic params from active profile to fetch sun sign
  const vedicParams = activeProfile
    ? buildVedicParam({
        day: activeProfile.day,
        month: activeProfile.month,
        year: activeProfile.year,
        hour: activeProfile.hour > 12 ? activeProfile.hour - 12 : activeProfile.hour === 0 ? 12 : activeProfile.hour,
        min: activeProfile.min,
        meridiem: activeProfile.hour >= 12 ? 'PM' : 'AM',
        lat: activeProfile.lat,
        lon: activeProfile.lon,
        tzone: 5.5,
      })
    : null;

  // Fetch astro details to get the actual sun sign
  const { data: astroData, isFetching: isAstroFetching } = useGetAstroDetailsQuery(vedicParams, {
    skip: !vedicParams,
  });
  // For Western horoscope page, prefer westernSign from kundli profile over Vedic sun_sign
  const profileSunSign = activeProfile?.westernSign?.toLowerCase() || astroData?.response?.sun_sign?.toLowerCase() || null;
  
  // Default to first sign if no sign in URL
  const [selectedZodiac, setSelectedZodiac] = useState(sign?.toLowerCase() || 'aries');
  const [tempSelectedZodiac, setTempSelectedZodiac] = useState(sign?.toLowerCase() || 'aries');
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [activeCategory, setActiveCategory] = useState(location.state?.category || '');
  const [cameFromOverview, setCameFromOverview] = useState(false);
  const [overviewCardIndex, setOverviewCardIndex] = useState(null);
  const [showZodiacModal, setShowZodiacModal] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('phase_1');

  // Track if we've already applied the Kundli-based default
  const hasAppliedKundliDefault = useRef(false);

  // Track the previous profile ID to detect actual profile switches from header
  const prevProfileId = useRef(null);
  // Track the previous sun sign to detect when API returns new data for a switched profile
  const prevSunSign = useRef(null);

  // Refs for overview cards to scroll back on "Show Less"
  const overviewCardRefs = useRef([]);
  const overviewRef = useRef(null);

  const tabs = ['Today', 'Tomorrow', /* 'Daily', */ 'This Week', 'This Year'];
  
  // Categories will be dynamically generated from API response
  const [categories, setCategories] = useState([]);

  // Update selected zodiac when URL param changes
  useEffect(() => {
    if (sign) {
      setSelectedZodiac(sign.toLowerCase());
      setTempSelectedZodiac(sign.toLowerCase());
    }
  }, [sign]);

  // Set default zodiac based on profile's sun sign when page loads without a sign in URL
  // AND react to profile switches from the header
  useEffect(() => {
    // Wait until astro data is done fetching (unless westernSign is already available from profile)
    if (isAstroFetching && !activeProfile?.westernSign) return;
    if (!profileSunSign || !signToNumber[profileSunSign]) return;

    const currentProfileId = activeProfile?._id || null;
    const isProfileSwitch = prevProfileId.current !== null && currentProfileId !== prevProfileId.current;
    const isInitialLoad = prevProfileId.current === null;

    // Update refs
    prevProfileId.current = currentProfileId;

    // Determine if we should update the zodiac sign
    let shouldUpdate = false;

    if (isProfileSwitch) {
      // User switched profile from header — always update
      shouldUpdate = true;
    } else if (isInitialLoad && !hasAppliedKundliDefault.current) {
      // First load — apply profile's sign as default ONLY if no sign in URL
      if (!sign) {
        shouldUpdate = true;
      }
      hasAppliedKundliDefault.current = true;
    } else if (prevSunSign.current && prevSunSign.current !== profileSunSign) {
      // Same profile but sun sign data changed (e.g., after refetch on refresh)
      shouldUpdate = true;
    }

    prevSunSign.current = profileSunSign;

    if (!shouldUpdate) return;
    if (profileSunSign === selectedZodiac) return;

    setSelectedZodiac(profileSunSign);
    setTempSelectedZodiac(profileSunSign);

    // Update URL to reflect the selected zodiac
    let newPath;
    if (pathname.includes('tomorrow-horoscope')) {
      newPath = `/tomorrow-horoscope/${profileSunSign}`;
    } else if (pathname.includes('daily-horoscope') || pathname.includes('todays-horoscope')) {
      newPath = `/daily-horoscope/${profileSunSign}`;
    } else if (pathname.includes('weekly-horoscope')) {
      newPath = `/weekly-horoscope/${profileSunSign}`;
    } else if (pathname.includes('yearly-horoscope')) {
      newPath = `/yearly-horoscope/${profileSunSign}`;
    } else {
      newPath = `/daily-horoscope/${profileSunSign}`;
    }
    navigate(newPath, { replace: true});
  }, [activeProfile?._id, profileSunSign, isAstroFetching]);

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [pathname]);

  const signNumber = signToNumber[selectedZodiac.toLowerCase()];
  
  // Fetch data based on active tab
  // Both "Today" and "Daily" use the same daily API
  const { data: dailyData, isLoading: dailyLoading, isError: dailyError, refetch: refetchDaily } = useFetchWesternDailyQuery(signNumber, {
    skip: activeTab !== 'Today' && activeTab !== 'Daily'
  });

  const { data: tomorrowData, isLoading: tomorrowLoading, isError: tomorrowError, refetch: refetchTomorrow } = useFetchWesternTomorrowQuery(signNumber, {
    skip: activeTab !== 'Tomorrow'
  });
  
  const { data: weeklyData, isLoading: weeklyLoading, isError: weeklyError, refetch: refetchWeekly } = useFetchWeeklyQuery(signNumber, {
    skip: activeTab !== 'This Week'
  });
  
  const { data: yearlyData, isLoading: yearlyLoading, isError: yearlyError, refetch: refetchYearly } = useFetchWesternYearlyQuery(signNumber, {
    skip: activeTab !== 'This Year'
  });

  const isLoading = dailyLoading || tomorrowLoading || weeklyLoading || yearlyLoading;

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 'Today' || activeTab === 'Daily') return dailyData;
    if (activeTab === 'Tomorrow') return tomorrowData;
    if (activeTab === 'This Week') return weeklyData;
    if (activeTab === 'This Year') return yearlyData;
    return null;
  };

  /*
    Failure state of the query currently on screen. Mirrors getCurrentData().

    None of these error flags were read, so a failed western-horoscope fetch fell
    through to the "Please wait while we fetch your horoscope..." fallback in
    getContent() and stayed there — indistinguishable from loading, with nothing
    to press. Same defect as the Indian horoscope screen; same remedy.
  */
  const getCurrentQueryState = () => {
    if (activeTab === 'Today' || activeTab === 'Daily') return { failed: dailyError, retry: refetchDaily };
    if (activeTab === 'Tomorrow') return { failed: tomorrowError, retry: refetchTomorrow };
    if (activeTab === 'This Week') return { failed: weeklyError, retry: refetchWeekly };
    if (activeTab === 'This Year') return { failed: yearlyError, retry: refetchYearly };
    return { failed: false, retry: null };
  };

  const { failed: contentFailed, retry: retryContent } = getCurrentQueryState();

  const currentData = getCurrentData();

  // Update categories based on API response
  useEffect(() => {
    let newCategories = [{ id: 'overview', label: 'Overview' }]; // Always start with Overview
    
    if (activeTab === 'This Year' && yearlyData?.response) {
      // For yearly, get categories from phase_1
      const phase1 = yearlyData.response.phase_1;
      if (phase1) {
        const yearlyCategories = Object.keys(phase1)
          .filter(key => !['period', 'score', 'prediction'].includes(key))
          .map(key => ({
            id: key,
            label: key.replace(/_/g, ' ').split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
          }));
        newCategories = [...newCategories, ...yearlyCategories];
        console.log('Yearly Category IDs:', yearlyCategories.map(c => c.id));
      }
    } else if (((activeTab === 'Today' || activeTab === 'Daily') && dailyData?.response?.bot_response) || 
               (activeTab === 'Tomorrow' && tomorrowData?.response?.bot_response) ||
               (activeTab === 'This Week' && weeklyData?.response?.bot_response)) {
      // For daily/tomorrow/weekly, get categories from bot_response
      const bot = (activeTab === 'Today' || activeTab === 'Daily') 
        ? dailyData.response.bot_response 
        : activeTab === 'Tomorrow'
          ? tomorrowData.response.bot_response
          : weeklyData.response.bot_response;
      const dailyWeeklyCategories = Object.keys(bot)
        // Only show categories that actually have content (avoids empty cards
        // when the API returns partial/regenerating data).
        .filter(key => {
          const text = bot[key]?.split_response;
          return typeof text === 'string' && text.trim().length > 0;
        })
        .map(key => ({
          id: key,
          label: key.replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        }));
      newCategories = [...newCategories, ...dailyWeeklyCategories];
      console.log('Daily/Weekly Category IDs:', dailyWeeklyCategories.map(c => c.id));
    }
    
    // Remove "Total Score" category from all tabs
    newCategories = newCategories.filter(c => {
      const id = c.id.toLowerCase().replace(/[_\s]/g, '');
      return id !== 'totalscore';
    });
    
    setCategories(newCategories);
    
    // Set default active category to overview if not set or invalid
    // If navigated with a specific category, apply it once categories are available
    const navCategory = location.state?.category;
    if (navCategory && newCategories.find(c => c.id === navCategory)) {
      if (activeCategory !== navCategory) {
        setActiveCategory(navCategory);
      }
    } else if (!activeCategory || !newCategories.find(c => c.id === activeCategory)) {
      // Only default to overview if no pending nav category waiting for API data
      if (!navCategory || newCategories.length > 1) {
        setActiveCategory('overview');
      }
    }
  }, [activeTab, dailyData, tomorrowData, weeklyData, yearlyData, activeCategory]);

  // Get content for active category
  const getContent = () => {
    if (!currentData?.response) {
      /*
        A failed fetch must not impersonate a pending one. This single fallback
        used to cover loading, empty and failed alike, and no query here read its
        error flag — so a failed request left "Please wait while we fetch your
        horoscope..." on screen for good, with no message and nothing to press.
        A browser refresh was the only way out.
      */
      const signLabel = selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1);
      if (contentFailed) {
        return {
          title: signLabel,
          subtitle: "Couldn't load",
          content: "We couldn't load this horoscope just now. Please check your connection and try again.",
          luckyColor: null,
          luckyColorCode: null,
          luckyNumber: null,
          isOverview: false,
          failed: true
        };
      }
      return {
        title: signLabel,
        subtitle: 'Loading...',
        content: 'Please wait while we fetch your horoscope...',
        luckyColor: null,
        luckyColorCode: null,
        luckyNumber: null,
        isOverview: false
      };
    }

    const response = currentData.response;

    // OVERVIEW - Show all categories with titles
    if (activeCategory === 'overview') {
      if (activeTab === 'This Year') {
        // Yearly overview - show categories for selected phase
        const phaseData = response[selectedPhase];
        const allCategories = categories.filter(c => c.id !== 'overview');
        
        const overviewContent = allCategories.map(category => {
          const categoryData = phaseData?.[category.id];
          if (!categoryData) return null;
          
          return {
            title: category.label,
            score: categoryData.score,
            content: categoryData.prediction
          };
        }).filter(Boolean);

        return {
          title: `${selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)} ${activeTab} Overview`,
          subtitle: phaseData?.period || new Date().getFullYear().toString(),
          content: '',
          luckyColor: null,
          luckyColorCode: null,
          luckyNumber: null,
          isOverview: true,
          overviewSections: overviewContent
        };
      } else {
        // Daily/Weekly overview - all categories
        const bot = response.bot_response;
        const allCategories = categories.filter(c => c.id !== 'overview');
        
        const overviewContent = allCategories.map(category => {
          const categoryData = bot?.[category.id];
          if (!categoryData) return null;
          
          return {
            title: category.label,
            score: categoryData.score,
            content: categoryData.split_response
          };
        }).filter(Boolean);

        return {
          title: `${selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)} ${activeTab} Overview`,
          subtitle: (activeTab === 'Today' || activeTab === 'Daily') ? formatted : activeTab === 'Tomorrow' ? 'Tomorrow' : 'Sunday - Saturday',
          content: '',
          luckyColor: response.lucky_color,
          luckyColorCode: response.lucky_color_code,
          luckyNumber: response.lucky_number,
          isOverview: true,
          overviewSections: overviewContent
        };
      }
    }

    // SPECIFIC CATEGORY
    if (activeTab === 'This Year') {
      // Yearly data - show selected phase only
      const phaseData = response[selectedPhase];
      const categoryData = phaseData?.[activeCategory];
      
      return {
        title: categories.find(c => c.id === activeCategory)?.label || activeCategory,
        subtitle: phaseData?.period || new Date().getFullYear().toString(),
        content: categoryData?.prediction || 'Yearly predictions coming soon.',
        score: categoryData?.score || null,
        luckyColor: null,
        luckyColorCode: null,
        luckyNumber: null,
        isOverview: false
      };
    }

    // Daily and Weekly data
    const bot = response.bot_response;
    const categoryData = bot?.[activeCategory];
    
    return {
      title: categories.find(c => c.id === activeCategory)?.label || activeCategory,
      subtitle: (activeTab === 'Today' || activeTab === 'Daily') ? formatted : activeTab === 'Tomorrow' ? 'Tomorrow' : 'Sunday - Saturday',
      content: categoryData?.split_response || 'Content coming soon.',
      score: categoryData?.score,
      luckyColor: response.lucky_color,
      luckyColorCode: response.lucky_color_code,
      luckyNumber: response.lucky_number,
      isOverview: false
    };
  };

  const currentContent = getContent();

  const handleTabChange = (tab) => {
    /*
      Re-tapping the tab that is ALREADY active used to be a guaranteed dead
      click. Every statement below was a no-op in that case: setActiveTab() got
      an identical value so React bailed out of the re-render, the category
      reset was redundant because 'overview' is already the default, and the
      navigate() at the bottom targeted the exact URL we were sitting on.
      Nothing on screen moved, so the tap looked broken.

      Clarity session 1keamh6 is precisely this. A visitor from Google landed
      on /tomorrow-horoscope/cancer — a URL that getInitialTab() resolves to
      'Tomorrow', i.e. the Tomorrow pill renders ALREADY highlighted — then
      tapped "Tomorrow" over and over at 00:33 (rage click + dead click) and
      abandoned the session eight seconds later.

      The reason anyone re-taps a tab they are already on is that the content
      underneath never showed up. So give the tap the retry it was actually
      asking for, and when there IS content, at least move the viewport to it
      so the tap has a visible consequence.
    */
    if (tab === activeTab) {
      if (contentFailed || !currentData?.response) {
        retryContent?.();
      } else {
        overviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    setActiveTab(tab);
    setCameFromOverview(false);
    setSelectedPhase('phase_1');
    // Reset to Overview so a category that only exists on another tab
    // (e.g. "Physique" is daily-only) doesn't linger and show empty content.
    setActiveCategory('overview');
    
    // Navigate to corresponding route (replace so back button goes to home, not through each tab)
    // Both "Today" and "Daily" go to daily-horoscope
    if (tab === 'Today' || tab === 'Daily') {
      navigate(`/daily-horoscope/${selectedZodiac}`, { replace: true });
    } else if (tab === 'Tomorrow') {
      navigate(`/tomorrow-horoscope/${selectedZodiac}`, { replace: true });
    } else if (tab === 'This Week') {
      navigate(`/weekly-horoscope/${selectedZodiac}`, { replace: true });
    } else if (tab === 'This Year') {
      navigate(`/yearly-horoscope/${selectedZodiac}`, { replace: true });
    }
  };

  const handleZodiacClick = (zodiac) => {
    setTempSelectedZodiac(zodiac.toLowerCase());
  };

  const handleConfirmZodiac = () => {
    setSelectedZodiac(tempSelectedZodiac);
    setShowZodiacModal(false);
    
    // Construct the new path based on current tab
    let newPath;
    if (pathname.includes('tomorrow-horoscope')) {
      newPath = `/tomorrow-horoscope/${tempSelectedZodiac}`;
    } else if (pathname.includes('daily-horoscope') || pathname.includes('todays-horoscope')) {
      newPath = `/daily-horoscope/${tempSelectedZodiac}`;
    } else if (pathname.includes('weekly-horoscope')) {
      newPath = `/weekly-horoscope/${tempSelectedZodiac}`;
    } else if (pathname.includes('yearly-horoscope')) {
      newPath = `/yearly-horoscope/${tempSelectedZodiac}`;
    } else {
      // Default to daily horoscope
      newPath = `/daily-horoscope/${tempSelectedZodiac}`;
    }
    
    navigate(newPath, { replace: true });
  };

  const handleOpenModal = () => {
    if (isLoggedIn || activeProfile) {
      // Logged-in users, or guests who already have a Kundli profile,
      // open the profile manager (it handles guest profiles via cookie).
      setShowProfileSelector(true);
    } else {
      // Guest user with no profile — show zodiac selector
      setTempSelectedZodiac(selectedZodiac);
      setShowZodiacModal(true);
    }
  };

  // Tapping the big sign banner always opens the zodiac picker, so users can
  // switch signs without hunting for the profile selector above it.
  const handleZodiacDisplayClick = () => {
    trackEvent('horoscope_zodiac_banner_clicked', { sign: selectedZodiac });
    setTempSelectedZodiac(selectedZodiac);
    setShowZodiacModal(true);
  };

  const selectedZodiacData = zodiacSigns.find(
    z => z.name.toLowerCase() === selectedZodiac.toLowerCase()
  );

  // Get zodiac image dynamically based on selected sign
  const capitalizedSign = selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1);
  const zodiacImage = zodiacSignImages[selectedZodiac.toLowerCase()];

  // Truncate text to 200 words
  const truncateToWords = (text, wordLimit) => {
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return { text, isTruncated: false };
    return { text: words.slice(0, wordLimit).join(' '), isTruncated: true };
  };

  // Navigate to specific section route
  const handleShowMore = (categoryId, cardIndex) => {
    // Instead of navigating to a new route, just set the active category
    // This will show the full content for that specific category
    setCameFromOverview(true);
    setOverviewCardIndex(cardIndex);
    setActiveCategory(categoryId);
  };

  return (
    <>
    <div className="horoscope-old-page">
    <div className="horoscope-page">
      <PrimaryLoader isLoading={isLoading} />
      
      <div className="horoscope-header-Wrap">
        <div className="horoscope-header">
          <button className="back-button" onClick={() => {
            if (location.key !== 'default') {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}>
            <ChevronLeft size={24} />
          </button>
          <span className="horoscope-page-title">Western Horoscope</span>
          {/*
            Mirror of the Western button in Horoscope.jsx: carry the sign over
            instead of dropping the visitor on the bare '/daily-horoscope-indian'
            picker. '/daily-horoscope-indian/:sign' is a real route, and the
            period switches above already navigate with `selectedZodiac`.
          */}
          <button
            className="indian-horoscope-btn"
            onClick={() => {
              trackEvent('horoscope_type_switched', { from_type: 'western', to_type: 'indian' });
              navigate(`/daily-horoscope-indian/${selectedZodiac}`, { replace: true });
            }}
          >
            Indian
          </button>
        </div>
      </div>

      <div className="horoscope-page-content">
        {/* Centered Profile Selector with DOB/Place */}
        <div className="horoscope-profile-header">
          {/* Was a bare <div onClick>: mouse-only, unreachable by keyboard and
              invisible to assistive tech, despite rendering a chevron that
              promises a picker. Not a real <button> because it contains block
              content (the date-of-birth line). */}
          <div
            className="horoscope-profile-center"
            role="button"
            tabIndex={0}
            aria-label={
              activeProfile
                ? `Profile: ${activeProfile.name}. Change profile`
                : `Zodiac: ${selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)}. Change zodiac sign`
            }
            onClick={handleOpenModal}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenModal();
              }
            }}
          >
            <span className="horoscope-profile-label">{activeProfile ? 'Select Profile' : 'Select Zodiac'}</span>
            <span className="horoscope-profile-name">
              {activeProfile?.name || (selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1))}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '4px' }}>
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {activeProfile && (
              <span className="horoscope-profile-dob">
                Date of birth: {activeProfile.day} {['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][activeProfile.month]}, {activeProfile.year} | Time:  {String(((activeProfile.hour || 0) % 12) || 12).padStart(2, '0')}:{String(activeProfile.min || 0).padStart(2, '0')} {activeProfile.hour >= 12 ? 'PM' : 'AM'} | Place: {activeProfile.place}
              </span>
            )}
          </div>
        </div>

        <div className="horoscope-container">
          {/* The whole sign banner is tappable — users instinctively click the
              sign name/symbol to change it (was a dead click before). */}
          <div
            className="zodiac-display zodiac-display-interactive"
            role="button"
            tabIndex={0}
            aria-label={`${capitalizedSign} selected. Change zodiac sign`}
            onClick={handleZodiacDisplayClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZodiacDisplayClick();
              }
            }}
          >
            <div className="zodiac-info">
              <h1 className="zodiac-name">
                {selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)}
              </h1>
              <p className="zodiac-date-range">{selectedZodiacData?.dateRange}</p>
              <span className="zodiac-change-hint">
                Change
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            {zodiacImage && (
              <img 
                src={zodiacImage} 
                alt={capitalizedSign}
                className="zodiac-symbol-img"
              />
            )}
          </div>

          <div className="time-tabs-wrapper pill-tabs-wrapper">
            <div className="time-tabs pill-tabs" style={{ justifyContent: 'flex-start' }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`time-tab pill-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'This Year' && yearlyData?.response && (
            <div className="time-tabs-wrapper pill-tabs-wrapper">
              <div className="time-tabs pill-tabs">
                {['phase_1', 'phase_2', 'phase_3', 'phase_4'].map((phase, idx) => {
                  const period = yearlyData.response[phase]?.period;
                  return (
                    <button
                      key={phase}
                      className={`time-tab pill-tab ${selectedPhase === phase ? 'active' : ''}`}
                      onClick={() => setSelectedPhase(phase)}
                    >
                      {period || `Q${idx + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="category-cards">
            {categories.map((category) => (
                <button key={category.id}
                  className={`category-card ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => {
                    setCameFromOverview(false);
                    setActiveCategory(category.id);
                  }}
                >
                  <span className="category-label">{category.label}</span>
                  <img className="categoryImages" src={getCategoryImage(category.id)} alt={category.label} />
                  {/* <span className="roundedShadowBottom"></span> */}
                </button>
            ))}
          </div>

          <div
            className="horoscope-content"
            ref={overviewRef}
            key={`${activeTab}-${selectedPhase}-${activeCategory}-${selectedZodiac}-${(currentContent.title || '')}-${(currentContent.content || '').slice(0, 24)}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <h2 className="content-title">
                {currentContent.title}
                {/* {currentContent.score && !currentContent.isOverview && (
                  <span style={{ fontSize: '14px', color: 'orange', marginLeft: '8px' }}>
                    ({currentContent.score}/100)
                  </span>
                )} */}
              </h2>
              <TTSButton text={(() => {
                const parts = [];
                if (currentContent.title) parts.push(currentContent.title);
                if (currentContent.luckyColor) parts.push(`Lucky Color: ${currentContent.luckyColor}`);
                if (currentContent.luckyNumber?.length) parts.push(`Lucky Number: ${currentContent.luckyNumber.join(', ')}`);
                if (currentContent.isOverview && currentContent.overviewSections) {
                  currentContent.overviewSections.forEach((s) => {
                    parts.push(`${s.title}. ${s.content}`);
                  });
                } else if (currentContent.content) {
                  parts.push(currentContent.content);
                }
                return parts.join('. ');
              })()} />
            </div>
            
            {/* Lucky Details - Only for Daily and Weekly, not in Overview */}
            {!currentContent.isOverview && (activeTab === 'Today' || activeTab === 'Tomorrow' || activeTab === 'This Week') && currentContent.luckyColor && (
              <div className="lucky-details">
                <h3 className="lucky-title">Lucky Details</h3>
                <p className="lucky-item">
                  <strong>Lucky Color:</strong>{' '}
                  <span
                    style={{
                      color: isLightColor(currentContent.luckyColorCode || currentContent.luckyColor) ? '#333' : '#fff',
                      backgroundColor: currentContent.luckyColorCode || currentContent.luckyColor,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: currentContent.luckyColor?.toLowerCase() === 'white' ? '1px solid #ccc' : 'none',
                    }}
                  >
                    {currentContent.luckyColor}
                  </span>
                </p>
                {currentContent.luckyNumber && currentContent.luckyNumber.length > 0 && (
                  <p className="lucky-item">
                    <strong>Lucky Number:</strong> {currentContent.luckyNumber.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Overview Sections - Show all categories with titles */}
            {currentContent.isOverview && currentContent.overviewSections ? (
              <div className="overview-sections">
                {/* Lucky Details for Overview in Daily/Weekly */}
                {(activeTab === 'Today' || activeTab === 'Daily' || activeTab === 'Tomorrow' || activeTab === 'This Week') && currentContent.luckyColor && (
                  <div className="lucky-details">
                    <h3 className="lucky-title">Lucky Details</h3>
                    <p className="lucky-item">
                      <strong>Lucky Color:</strong>{' '}
                      <span
                        style={{
                          color: isLightColor(currentContent.luckyColorCode || currentContent.luckyColor) ? '#333' : '#fff',
                          backgroundColor: currentContent.luckyColorCode || currentContent.luckyColor,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: currentContent.luckyColor?.toLowerCase() === 'white' ? '1px solid #ccc' : 'none',
                        }}
                      >
                        {currentContent.luckyColor}
                      </span>
                    </p>
                    {currentContent.luckyNumber && currentContent.luckyNumber.length > 0 && (
                      <p className="lucky-item">
                        <strong>Lucky Number:</strong> {currentContent.luckyNumber.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                
                <div className={`overview-cards-grid ${(activeTab === 'This Week' || activeTab === 'This Year') ? 'three-column' : ''}`}>
                  {currentContent.overviewSections.map((section, index) => {
                    /*
                      Daily/weekly overview cards used to render the full
                      category text with no truncation, but the card has a fixed
                      height (180px desktop, 200px tablet) with overflow:hidden —
                      so anything longer was clipped with no way to read the
                      rest. Only the yearly tab offered "show more". Clarity
                      session 156r2de (03:16 PM Sep 1, desktop) ended on the
                      Libra daily page with rage clicks on the horoscope text
                      between 11:19 and 11:35 — clicking clipped text expecting
                      it to expand, on the one tab where nothing did.

                      Truncate daily/weekly the same way, so every clipped card
                      gets the same "show more" that opens the full single
                      category view (handleShowMore). The word limit is generous
                      enough that short categories still render whole and never
                      show the link.
                    */
                    const { text: truncatedText, isTruncated } = activeTab === 'This Year'
                      ? truncateToWords(section.content, 25)
                      : truncateToWords(section.content, 40);
                    
                    return (
                      <div key={index} className="overview-card" ref={el => overviewCardRefs.current[index] = el}>
                        <div className="overview-card-header">
                          <div className="overview-card-left">
                            <h3 className="overview-card-title">
                              {section.title}
                            </h3>
                            {/* {section.score && (
                              <span className="overview-card-score">
                                ({section.score}/100)
                              </span>
                            )} */}
                          </div>
                        </div>
                        <div className="overview-card-body overview-card-body-expanded">
                          <div className="overview-card-text">
                            {truncatedText.split('\n\n').map((paragraph, pIndex, arr) => (
                              <p key={pIndex}>
                                {paragraph}
                                {isTruncated && pIndex === arr.length - 1 && (
                                  <>
                                    {'... '}
                                    {/* A real <button>, not a click-only <span>:
                                        keyboard reachable and announced. type is
                                        "button" so it never submits an ancestor
                                        form. */}
                                    <button
                                      type="button"
                                      className="show-more-link"
                                      onClick={() => handleShowMore(categories.find(c => c.label === section.title)?.id || section.title)}
                                    >
                                      show more
                                    </button>
                                  </>
                                )}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Single Category Content */
              <div className="content-text">
                {currentContent.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {/*
                  A failed load gets something to press. Without this the only
                  recovery was a browser refresh — see getContent().
                */}
                {currentContent.failed && retryContent && (
                  <button
                    type="button"
                    className="horoscope-retry-btn"
                    onClick={() => retryContent()}
                  >
                    Try again
                  </button>
                )}
                {/* Return to overview after a "show more". Was gated on
                    activeTab === 'This Year', but now that daily/weekly cards
                    truncate and open a category too, they need the same way
                    back — without it the visitor is stranded on the single
                    category with no route to the other cards. A <button> for
                    the same keyboard/AT reasons as show-more. */}
                {cameFromOverview && activeCategory !== 'overview' && (
                  <button
                    type="button"
                    className="show-less-link"
                    onClick={() => {
                      setCameFromOverview(false);
                      setOverviewCardIndex(null);
                      setActiveCategory('overview');
                      // Scroll to the very top of the page after re-render
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showZodiacModal && (
          <div className="zodiac-modal" onClick={() => setShowZodiacModal(false)}>
            <div className="zodiac-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Was an inert <div>. A grabber bar is the universal "this sheet
                  can be dismissed" affordance, so it gets tapped — and this one
                  sits inside a container that stops click propagation, so the
                  tap could not even fall through to the backdrop's own dismiss
                  handler. Guaranteed dead click, right where the thumb rests. */}
              <button
                type="button"
                className="modal-handle"
                aria-label="Close zodiac picker"
                onClick={() => setShowZodiacModal(false)}
              />
              <h2 className="modal-title">Select Zodiac</h2>
              <div className="zodiac-list">
                {zodiacSigns.map((zodiac) => (
                  <button
                    key={zodiac.id}
                    type="button"
                    className={`zodiac-item ${
                      tempSelectedZodiac === zodiac.name.toLowerCase() ? 'selected' : ''
                    }`}
                    /* Picking a sign only stages it; the button below commits.
                       aria-pressed makes that two-step state audible, since
                       visually it is just a filled radio dot. */
                    aria-pressed={tempSelectedZodiac === zodiac.name.toLowerCase()}
                    onClick={() => handleZodiacClick(zodiac.name)}
                  >
                    <span className="zodiac-item-name">{zodiac.name}</span>
                    <span className="zodiac-item-date">{zodiac.dateRange}</span>
                  </button>
                ))}
              </div>
              {/*
                Was "Select Zodiac" — the same words as the modal's own title,
                which made it read as a heading rather than the action that
                applies the pick. Naming the staged sign makes the two-step
                nature of the picker obvious.
              */}
              <button type="button" className="select-zodiac-button" onClick={handleConfirmZodiac}>
                Show {tempSelectedZodiac.charAt(0).toUpperCase() + tempSelectedZodiac.slice(1)} horoscope
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>

    {/* Profile Manager - rendered outside .horoscope-old-page so the page's
        global CSS reset does not affect the shared modal styling */}
    <ProfileManager
      isOpen={showProfileSelector}
      onClose={() => setShowProfileSelector(false)}
      onProfileSelect={(profile) => {
        setShowProfileSelector(false);
        // Update Redux with selected profile so useEffect picks up the new sun sign
        dispatch(setSelectedKundli(profile));
      }}
      selectedProfileId={activeProfile?._id}
      title="Select Profile"
      enabledOperations={{
        list: true,
        add: true,
        edit: true,
        delete: true,
      }}
    />
    </>
  );
};

export default HoroscopeOld;
