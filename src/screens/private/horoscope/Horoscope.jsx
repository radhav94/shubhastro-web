import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  useFetchDailyQuery, 
  useFetchTomorrowQuery,
  useFetchTomorrowMoonQuery,
  useFetchTomorrowNakshatraQuery,
  useFetchWeeklyQuery, 
  useFetchYearlyQuery,
  useFetchDailyMoonQuery,
  useFetchDailySunQuery,
  useFetchDailyNakshatraQuery,
  useFetchWeeklyMoonQuery,
  useFetchWeeklySunQuery,
} from '../../../redux/api/horoscope/zodiacApi';
import { signToNumber, zodiacDateRanges } from './utils';
import PrimaryLoader from '../../../component/UI/PrimaryLoader';
import TTSButton from '../../../component/UI/TTSButton';
import { formatted } from '../../../utils/dateFormat/date';
import { zodiac, zodiacSignImages } from './zodiac';
import './Horoscope.css';
import { ProfileManager } from '../../../component/UI/Profile';
import ProfileSelector from '../kundli/components/ProfileSelector';
import { useGetAllKundlisQuery } from '../../../services/appServices/kundliServicesNew';
import { useSelector, useDispatch } from 'react-redux';
import { useGetAstroDetailsQuery } from '../../../redux/api/kundli/kundliApi';
import { buildVedicParam } from '../../../utils/VedicParams.js/vedicParams';
import { setSelectedKundli } from '../../../redux/kundli/kundliSlice';
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

const HoroscopeNew = () => {
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
    total_score: scoreImg,
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

  // Determine the active profile: header-selected > Self > first profile
  const activeProfile = headerSelectedKundli?._id
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
  const profileSunSign = astroData?.response?.sun_sign?.toLowerCase() || null;
  
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

  const tabs = ['Today', 'Tomorrow', 'This Week', 'This Year'];

  // Sub-tabs for Daily, Tomorrow and Weekly
  const dailySubTabs = ['Sun', 'Moon', 'Nakshatra'];
  const weeklySubTabs = ['Sun', 'Moon'];
  const [activeSignTab, setActiveSignTab] = useState('Sun'); // Shared across all time tabs
  const [dailySubTab, setDailySubTab] = useState('Sun');
  const [tomorrowSubTab, setTomorrowSubTab] = useState('Sun');
  const [weeklySubTab, setWeeklySubTab] = useState('Sun');
  
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
    // Wait until astro data is done fetching for the current profile
    if (isAstroFetching) return;
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
    navigate(newPath, { replace: true });
  }, [activeProfile?._id, profileSunSign, isAstroFetching]);

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [pathname]);

  const signNumber = signToNumber[selectedZodiac.toLowerCase()];
  
  // Fetch data based on active tab
  const { data: dailyData, isLoading: dailyLoading } = useFetchDailyQuery(signNumber, {
    skip: activeTab !== 'Today' || dailySubTab !== 'Sun'
  });

  // Daily Moon
  const { data: dailyMoonData, isLoading: dailyMoonLoading } = useFetchDailyMoonQuery(signNumber, {
    skip: activeTab !== 'Today' || dailySubTab !== 'Moon'
  });

  // Daily Sun (same as fetchDaily but using the new endpoint)
  const { data: dailySunData, isLoading: dailySunLoading } = useFetchDailySunQuery(signNumber, {
    skip: activeTab !== 'Today' || dailySubTab !== 'Sun'
  });

  // Daily Nakshatra (uses nakshatra number, default to 1 if not known)
  const [selectedNakshatra, setSelectedNakshatra] = useState(1);
  const { data: dailyNakshatraData, isLoading: dailyNakshatraLoading } = useFetchDailyNakshatraQuery(selectedNakshatra, {
    skip: activeTab !== 'Today' || dailySubTab !== 'Nakshatra'
  });

  const { data: tomorrowData, isLoading: tomorrowLoading } = useFetchTomorrowQuery(signNumber, {
    skip: activeTab !== 'Tomorrow' || tomorrowSubTab !== 'Sun'
  });

  // Tomorrow Moon
  const { data: tomorrowMoonData, isLoading: tomorrowMoonLoading } = useFetchTomorrowMoonQuery(signNumber, {
    skip: activeTab !== 'Tomorrow' || tomorrowSubTab !== 'Moon'
  });

  // Tomorrow Nakshatra
  const [selectedTomorrowNakshatra, setSelectedTomorrowNakshatra] = useState(1);
  const { data: tomorrowNakshatraData, isLoading: tomorrowNakshatraLoading } = useFetchTomorrowNakshatraQuery(
    selectedTomorrowNakshatra, {
    skip: activeTab !== 'Tomorrow' || tomorrowSubTab !== 'Nakshatra'
  });
  
  const { data: weeklyData, isLoading: weeklyLoading } = useFetchWeeklyQuery(signNumber, {
    skip: activeTab !== 'This Week' || weeklySubTab !== 'Sun'
  });

  // Weekly Moon
  const { data: weeklyMoonData, isLoading: weeklyMoonLoading } = useFetchWeeklyMoonQuery(signNumber, {
    skip: activeTab !== 'This Week' || weeklySubTab !== 'Moon'
  });

  // Weekly Sun
  const { data: weeklySunData, isLoading: weeklySunLoading } = useFetchWeeklySunQuery(signNumber, {
    skip: activeTab !== 'This Week' || weeklySubTab !== 'Sun'
  });
  
  const { data: yearlyData, isLoading: yearlyLoading } = useFetchYearlyQuery(signNumber, {
    skip: activeTab !== 'This Year'
  });

  const isLoading = dailyLoading || dailyMoonLoading || dailySunLoading || dailyNakshatraLoading || tomorrowLoading || tomorrowMoonLoading || tomorrowNakshatraLoading || weeklyLoading || weeklyMoonLoading || weeklySunLoading || yearlyLoading;

  // Get current data based on active tab and sub-tab
  // Moon APIs return a different structure - normalize it
  const normalizeMoonResponse = (data) => {
    if (!data?.response) return data;
    const res = data.response;
    // If bot_response is already an object (Sun format), return as-is
    if (res.bot_response && typeof res.bot_response === 'object') return data;
    // Moon format: scores at root, bot_response is a string
    const categoryKeys = ['physique', 'status', 'finances', 'relationship', 'career', 'travel', 'family', 'friends', 'health'];
    const bot_response = {};
    categoryKeys.forEach(key => {
      if (res[key] !== undefined) {
        bot_response[key] = {
          score: res[key],
          split_response: '' // Will use the single bot_response string for overview
        };
      }
    });
    // Add total_score
    if (res.total_score !== undefined) {
      bot_response.total_score = {
        score: res.total_score,
        split_response: typeof res.bot_response === 'string' ? res.bot_response : ''
      };
    }
    // Put the full bot_response text into overview-like content
    const fullText = typeof res.bot_response === 'string' ? res.bot_response : '';
    // Distribute text across categories if possible (split by sentences)
    if (fullText) {
      const sentences = fullText.split(/(?<=\.)\s+/).filter(Boolean);
      const keys = Object.keys(bot_response).filter(k => k !== 'total_score');
      keys.forEach((key, idx) => {
        if (sentences[idx]) {
          bot_response[key].split_response = sentences[idx];
        }
      });
      // If fewer sentences than categories, put all text in total_score
      if (sentences.length < keys.length && bot_response.total_score) {
        bot_response.total_score.split_response = fullText;
      }
    }
    return {
      ...data,
      response: {
        ...res,
        bot_response,
        lucky_color: res.lucky_color,
        lucky_color_code: res.lucky_color_code,
        lucky_number: res.lucky_number,
      }
    };
  };

  const getCurrentData = () => {
    if (activeTab === 'Today') {
      if (dailySubTab === 'Moon') return normalizeMoonResponse(dailyMoonData);
      if (dailySubTab === 'Nakshatra') return normalizeMoonResponse(dailyNakshatraData);
      return dailyData; // Sun
    }
    if (activeTab === 'Tomorrow') {
      if (tomorrowSubTab === 'Moon') return normalizeMoonResponse(tomorrowMoonData);
      if (tomorrowSubTab === 'Nakshatra') return normalizeMoonResponse(tomorrowNakshatraData);
      return tomorrowData; // Sun
    }
    if (activeTab === 'This Week') {
      if (weeklySubTab === 'Moon') return normalizeMoonResponse(weeklyMoonData);
      return weeklyData; // Sun
    }
    if (activeTab === 'This Year') return yearlyData;
    return null;
  };

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
    } else if ((activeTab === 'Today' && (dailyData?.response?.bot_response || dailyMoonData?.response?.bot_response || dailyNakshatraData?.response?.bot_response)) || 
               (activeTab === 'Tomorrow' && (tomorrowData?.response?.bot_response || tomorrowMoonData?.response || tomorrowNakshatraData?.response)) ||
               (activeTab === 'This Week' && (weeklyData?.response?.bot_response || weeklyMoonData?.response?.bot_response))) {
      // For daily/tomorrow/weekly, get categories from bot_response
      let bot;
      if (activeTab === 'Today') {
        bot = dailyData?.response?.bot_response || dailyMoonData?.response?.bot_response || dailyNakshatraData?.response?.bot_response;
      } else if (activeTab === 'Tomorrow') {
        bot = tomorrowData?.response?.bot_response || normalizeMoonResponse(tomorrowMoonData)?.response?.bot_response || normalizeMoonResponse(tomorrowNakshatraData)?.response?.bot_response;
      } else {
        bot = weeklyData?.response?.bot_response || weeklyMoonData?.response?.bot_response;
      }
      const dailyWeeklyCategories = Object.keys(bot).map(key => ({
        id: key,
        label: key.replace(/_/g, ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }));
      newCategories = [...newCategories, ...dailyWeeklyCategories];
      console.log('Daily/Weekly Category IDs:', dailyWeeklyCategories.map(c => c.id));
    }
    
    // Keep all categories including total_score
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
  }, [activeTab, dailyData, dailyMoonData, dailyNakshatraData, tomorrowData, tomorrowMoonData, tomorrowNakshatraData, weeklyData, weeklyMoonData, yearlyData, activeCategory, dailySubTab, tomorrowSubTab, weeklySubTab]);

  // Get content for active category
  const getContent = () => {
    if (!currentData?.response) {
      return {
        title: selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1),
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
          subtitle: activeTab === 'Today' ? formatted : activeTab === 'Tomorrow' ? 'Tomorrow' : 'Sunday - Saturday',
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
      subtitle: activeTab === 'Today' ? formatted : activeTab === 'Tomorrow' ? 'Tomorrow' : 'Sunday - Saturday',
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
    setActiveTab(tab);
    setCameFromOverview(false);
    setSelectedPhase('phase_1');
    
    // Navigate to corresponding route
    if (tab === 'Today') {
      navigate(`/daily-horoscope/${selectedZodiac}`);
    } else if (tab === 'Tomorrow') {
      navigate(`/tomorrow-horoscope/${selectedZodiac}`);
    } else if (tab === 'This Week') {
      navigate(`/weekly-horoscope/${selectedZodiac}`);
    } else if (tab === 'This Year') {
      navigate(`/yearly-horoscope/${selectedZodiac}`);
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
    if (isLoggedIn) {
      setShowProfileSelector(true);
    } else {
      // Guest user — show zodiac selector
      setTempSelectedZodiac(selectedZodiac);
      setShowZodiacModal(true);
    }
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
    <div className="horoscope-page">
      <PrimaryLoader isLoading={isLoading} />
      
      {/* Page Header with Back Button */}
      <div className="horoscope-page-header">
        <button className="horoscope-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="horoscope-page-title">Kundli Horoscope</span>
      </div>

      {/* Centered Profile Selector with DOB/Place */}
      <div className="horoscope-profile-header">
        <div className="horoscope-profile-center" onClick={handleOpenModal}>
          <span className="horoscope-profile-label">Select Profile</span>
          <span className="horoscope-profile-name">
            {activeProfile?.name || capitalizedSign}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '4px' }}>
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {activeProfile && (
            <span className="horoscope-profile-dob">
              Date of birth: {activeProfile.day} {['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][activeProfile.month]}, {activeProfile.year} | Place: {activeProfile.place}
            </span>
          )}
        </div>
      </div>

      <div className="horoscope-page-content">
        <div className="horoscope-container">

          {/* Sun Sign / Moon Sign - Primary Tabs */}
          <div className="sign-tabs-wrapper">
            <div className="sign-tabs">
              {['Sun Sign', 'Moon Sign'].map((signTab) => {
                const isActive = (signTab === 'Moon Sign') ? activeSignTab === 'Moon' : activeSignTab === 'Sun';
                return (
                  <button
                    key={signTab}
                    className={`sign-tab ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      const val = signTab === 'Moon Sign' ? 'Moon' : 'Sun';
                      setActiveSignTab(val);
                      setDailySubTab(val);
                      setTomorrowSubTab(val);
                      setWeeklySubTab(val);
                    }}
                  >
                    {signTab}
                    {zodiacImage && (
                      <span className="sign-tab-zodiac-wrap">
                        ({capitalizedSign})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today / Tomorrow / This Week / This Year - Pill Tabs */}
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

          {/* Nakshatra selector for Daily Nakshatra */}
          {activeTab === 'Today' && dailySubTab === 'Nakshatra' && (
            <div className="category-cards nakshatra-cards">
              {[
                {name: 'Ashwini', icon: '🐴'}, {name: 'Bharani', icon: '🌺'}, {name: 'Krittika', icon: '🔥'},
                {name: 'Rohini', icon: '🌙'}, {name: 'Mrigashira', icon: '🦌'}, {name: 'Ardra', icon: '💧'},
                {name: 'Punarvasu', icon: '🏹'}, {name: 'Pushya', icon: '🌸'}, {name: 'Ashlesha', icon: '🐍'},
                {name: 'Magha', icon: '👑'}, {name: 'Purvaphalguni', icon: '🛏️'}, {name: 'Uttaraphalguni', icon: '☀️'},
                {name: 'Hasta', icon: '✋'}, {name: 'Chitra', icon: '💎'}, {name: 'Swati', icon: '🌬️'},
                {name: 'Vishakha', icon: '🌳'}, {name: 'Anuradha', icon: '🪷'}, {name: 'Jyeshtha', icon: '⭐'},
                {name: 'Mula', icon: '🌿'}, {name: 'Purvashadha', icon: '🌊'}, {name: 'Uttarashadha', icon: '🐘'},
                {name: 'Sravana', icon: '👂'}, {name: 'Dhanista', icon: '🎵'}, {name: 'Shatabhisha', icon: '💊'},
                {name: 'Purvabhadra', icon: '⚡'}, {name: 'Uttarabhadra', icon: '🐉'}, {name: 'Revati', icon: '🐟'}
              ].map((item, idx) => (
                <div key={idx + 1} className="category-item">
                  <button
                    className={`category-card ${selectedNakshatra === idx + 1 ? 'active' : ''}`}
                    onClick={() => setSelectedNakshatra(idx + 1)}
                  >
                    <span className="category-label">{item.name}</span>
                    <span className="categoryImages" style={{ fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Nakshatra selector for Tomorrow Nakshatra */}
          {activeTab === 'Tomorrow' && tomorrowSubTab === 'Nakshatra' && (
            <div className="category-cards nakshatra-cards">
              {[
                {name: 'Ashwini', icon: '🐴'}, {name: 'Bharani', icon: '🌺'}, {name: 'Krittika', icon: '🔥'},
                {name: 'Rohini', icon: '🌙'}, {name: 'Mrigashira', icon: '🦌'}, {name: 'Ardra', icon: '💧'},
                {name: 'Punarvasu', icon: '🏹'}, {name: 'Pushya', icon: '🌸'}, {name: 'Ashlesha', icon: '🐍'},
                {name: 'Magha', icon: '👑'}, {name: 'Purvaphalguni', icon: '🛏️'}, {name: 'Uttaraphalguni', icon: '☀️'},
                {name: 'Hasta', icon: '✋'}, {name: 'Chitra', icon: '💎'}, {name: 'Swati', icon: '🌬️'},
                {name: 'Vishakha', icon: '🌳'}, {name: 'Anuradha', icon: '🪷'}, {name: 'Jyeshtha', icon: '⭐'},
                {name: 'Mula', icon: '🌿'}, {name: 'Purvashadha', icon: '🌊'}, {name: 'Uttarashadha', icon: '🐘'},
                {name: 'Sravana', icon: '👂'}, {name: 'Dhanista', icon: '🎵'}, {name: 'Shatabhisha', icon: '💊'},
                {name: 'Purvabhadra', icon: '⚡'}, {name: 'Uttarabhadra', icon: '🐉'}, {name: 'Revati', icon: '🐟'}
              ].map((item, idx) => (
                <div key={idx + 1} className="category-item">
                  <button
                    className={`category-card ${selectedTomorrowNakshatra === idx + 1 ? 'active' : ''}`}
                    onClick={() => setSelectedTomorrowNakshatra(idx + 1)}
                  >
                    <span className="category-label">{item.name}</span>
                    <span className="categoryImages" style={{ fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

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

          {/* Category cards - hide when Nakshatra is active */}
          {!(activeTab === 'Today' && dailySubTab === 'Nakshatra') && !(activeTab === 'Tomorrow' && tomorrowSubTab === 'Nakshatra') && (
          <div className="category-cards">
            {categories.map((category) => (
              <div key={category.id} className="category-item">
                <button
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
              </div>
            ))}
          </div>
          )}

          <div className="horoscope-content" ref={overviewRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <h2 className="content-title">
                {currentContent.title}
                {currentContent.score && !currentContent.isOverview && (
                  <span style={{ fontSize: '14px', color: '#F75801', marginLeft: '8px', fontWeight: '600' }}>
                    {currentContent.score}/100
                  </span>
                )}
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
                {(activeTab === 'Today' || activeTab === 'Tomorrow' || activeTab === 'This Week') && currentContent.luckyColor && (
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
                    const { text: truncatedText, isTruncated } = activeTab === 'This Year' 
                      ? truncateToWords(section.content, 25) 
                      : { text: section.content, isTruncated: false };
                    
                    return (
                      <div key={index} className="overview-card" ref={el => overviewCardRefs.current[index] = el}>
                        <div className="overview-card-header">
                          <div className="overview-card-left">
                            <h3 className="overview-card-title">
                              {section.title}
                            </h3>
                            {section.score && (
                              <span className="overview-card-score" style={{ fontSize: '12px', color: '#F75801', fontWeight: '600' }}>
                                {section.score}/100
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="overview-card-body overview-card-body-expanded">
                          <div className="overview-card-text">
                            {truncatedText.split('\n\n').map((paragraph, pIndex, arr) => (
                              <p key={pIndex}>
                                {paragraph}
                                {isTruncated && pIndex === arr.length - 1 && (
                                  <>
                                    ...
                                    <span 
                                      className="show-more-link"
                                      onClick={() => handleShowMore(categories.find(c => c.label === section.title)?.id || section.title)}
                                    >
                                      show more
                                    </span>
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
                {cameFromOverview && activeTab === 'This Year' && activeCategory !== 'overview' && (
                  <span 
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
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showZodiacModal && (
          <div className="zodiac-modal" onClick={() => setShowZodiacModal(false)}>
            <div className="zodiac-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle"></div>
              <h2 className="modal-title">Select Zodiac</h2>
              <div className="zodiac-list">
                {zodiacSigns.map((zodiac) => (
                  <button
                    key={zodiac.id}
                    className={`zodiac-item ${
                      tempSelectedZodiac === zodiac.name.toLowerCase() ? 'selected' : ''
                    }`}
                    onClick={() => handleZodiacClick(zodiac.name)}
                  >
                    <span className="zodiac-item-name">{zodiac.name}</span>
                    <span className="zodiac-item-date">{zodiac.dateRange}</span>
                  </button>
                ))}
              </div>
              <button className="select-zodiac-button" onClick={handleConfirmZodiac}>
                Select Zodiac
              </button>
            </div>
          </div>
        )}

        {/* Profile Manager */}
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
      </div>
    </div>
  );
};

export default HoroscopeNew;
