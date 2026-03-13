import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  useFetchDailyQuery, 
  useFetchWeeklyQuery, 
  useFetchYearlyQuery
} from '../../../redux/api/horoscope/zodiacApi';
import { signToNumber, zodiacDateRanges } from './utils';
import { appSvgs } from '../../../utils/appImages';
import PrimaryLoader from '../../../component/UI/PrimaryLoader';
import { formatted } from '../../../utils/dateFormat/date';
import { zodiac } from './zodiac';
import './Horoscope.css';
import { useGetAllKundlisQuery } from '../../../services/appServices/kundliServicesNew';
import overViewImg from "../../../assets/images/overall-Image.png";
import financeImg from "../../../assets/images/finance.png";
import scoreImg from "../../../assets/images/score.png";
import healthImg from "../../../assets/images/health.png";
import friendsImg from "../../../assets/images/friends.png";
import familyImg from "../../../assets/images/family.png";
import travelImg from "../../../assets/images/travel.png";
import careerImg from "../../../assets/images/career.png";
import relationImg from "../../../assets/images/relation.png";
import statusImg from "../../../assets/images/status.png";
import physiqueImg from "../../../assets/images/physique.png";

const HoroscopeNew = () => {
  const navigate = useNavigate();
  const { sign } = useParams();
  const { pathname } = useLocation();
  
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
    if (pathname.includes('daily-horoscope') || pathname.includes('todays-horoscope')) {
      return 'Today';
    } else if (pathname.includes('weekly-horoscope')) {
      return 'This Week';
    } else if (pathname.includes('yearly-horoscope')) {
      return 'This Year';
    }
    return 'Today';
  };
  
  // Fetch user's Kundli profiles for default zodiac selection
  const { data: kundliProfilesData } = useGetAllKundlisQuery();
  const kundliProfiles = kundliProfilesData?.data || [];

  // Helper function: Get default zodiac from Kundli profiles
  const getDefaultZodiacFromKundli = () => {
    if (kundliProfiles.length === 0) return null;
    
    // Priority 1: Find profile with relation = "Self" (case-insensitive)
    const selfProfile = kundliProfiles.find(
      (profile) => profile.relation?.toLowerCase() === 'self'
    );
    
    // Priority 2: Use first available profile if no "Self" profile
    const targetProfile = selfProfile || kundliProfiles[0];
    const sunSign = targetProfile?.sunSign;
    
    // Validate that sunSign is a known zodiac sign
    if (sunSign && signToNumber[sunSign.toLowerCase()]) {
      return sunSign.toLowerCase();
    }
    
    return null;
  };
  
  // Default to first sign if no sign in URL
  const [selectedZodiac, setSelectedZodiac] = useState(sign?.toLowerCase() || 'aries');
  const [tempSelectedZodiac, setTempSelectedZodiac] = useState(sign?.toLowerCase() || 'aries');
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [activeCategory, setActiveCategory] = useState('');
  const [cameFromOverview, setCameFromOverview] = useState(false);
  const [overviewCardIndex, setOverviewCardIndex] = useState(null);
  const [showZodiacModal, setShowZodiacModal] = useState(false);

  // Track if we've already applied the Kundli-based default
  const hasAppliedKundliDefault = useRef(false);

  // Refs for overview cards to scroll back on "Show Less"
  const overviewCardRefs = useRef([]);

  const tabs = ['Today', /* 'Daily', */ 'This Week', 'This Year'];
  
  // Categories will be dynamically generated from API response
  const [categories, setCategories] = useState([]);

  // Update selected zodiac when URL param changes
  useEffect(() => {
    if (sign) {
      setSelectedZodiac(sign.toLowerCase());
      setTempSelectedZodiac(sign.toLowerCase());
    }
  }, [sign]);

  // NEW LOGIC: Set default zodiac based on Kundli profile when page loads without a sign in URL
  useEffect(() => {
    // Only apply this logic if:
    // 1. No sign in URL (user landed on /horoscopes/daily-horoscope without a sign)
    // 2. We haven't already applied the Kundli default
    // 3. Kundli profiles are loaded
    if (!sign && !hasAppliedKundliDefault.current && kundliProfiles.length > 0) {
      const defaultZodiac = getDefaultZodiacFromKundli();
      
      if (defaultZodiac) {
        setSelectedZodiac(defaultZodiac);
        setTempSelectedZodiac(defaultZodiac);
        hasAppliedKundliDefault.current = true;
        
        // Update URL to reflect the selected zodiac
        let newPath;
        if (pathname.includes('daily-horoscope') || pathname.includes('todays-horoscope')) {
          newPath = `/horoscopes/daily-horoscope/${defaultZodiac}`;
        } else if (pathname.includes('weekly-horoscope')) {
          newPath = `/horoscopes/weekly-horoscope/${defaultZodiac}`;
        } else if (pathname.includes('yearly-horoscope')) {
          newPath = `/horoscopes/yearly-horoscope/${defaultZodiac}`;
        } else {
          newPath = `/horoscopes/daily-horoscope/${defaultZodiac}`;
        }
        
        navigate(newPath, { replace: true });
      }
    }
  }, [sign, kundliProfiles, pathname, navigate, getDefaultZodiacFromKundli]);

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [pathname]);

  const signNumber = signToNumber[selectedZodiac.toLowerCase()];
  
  // Fetch data based on active tab
  // Both "Today" and "Daily" use the same daily API
  const { data: dailyData, isLoading: dailyLoading } = useFetchDailyQuery(signNumber, {
    skip: activeTab !== 'Today' && activeTab !== 'Daily'
  });
  
  const { data: weeklyData, isLoading: weeklyLoading } = useFetchWeeklyQuery(signNumber, {
    skip: activeTab !== 'This Week'
  });
  
  const { data: yearlyData, isLoading: yearlyLoading } = useFetchYearlyQuery(signNumber, {
    skip: activeTab !== 'This Year'
  });

  const isLoading = dailyLoading || weeklyLoading || yearlyLoading;

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 'Today' || activeTab === 'Daily') return dailyData;
    if (activeTab === 'This Week') return weeklyData;
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
    } else if (((activeTab === 'Today' || activeTab === 'Daily') && dailyData?.response?.bot_response) || 
               (activeTab === 'This Week' && weeklyData?.response?.bot_response)) {
      // For daily/weekly, get categories from bot_response
      const bot = (activeTab === 'Today' || activeTab === 'Daily') ? dailyData.response.bot_response : weeklyData.response.bot_response;
      const dailyWeeklyCategories = Object.keys(bot).map(key => ({
        id: key,
        label: key.replace(/_/g, ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }));
      newCategories = [...newCategories, ...dailyWeeklyCategories];
      console.log('Daily/Weekly Category IDs:', dailyWeeklyCategories.map(c => c.id));
    }
    
    setCategories(newCategories);
    
    // Set default active category to overview if not set or invalid
    if (!activeCategory || !newCategories.find(c => c.id === activeCategory)) {
      setActiveCategory('overview');
    }
  }, [activeTab, dailyData, weeklyData, yearlyData, activeCategory]);

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
        // Yearly overview - all categories from all phases
        const phases = ['phase_1', 'phase_2', 'phase_3', 'phase_4'];
        const allCategories = categories.filter(c => c.id !== 'overview');
        
        const overviewContent = allCategories.map(category => {
          const categoryData = phases
            .map(phase => response[phase]?.[category.id])
            .filter(Boolean);
          
          if (categoryData.length === 0) return null;
          
          const avgScore = Math.round(
            categoryData.reduce((sum, d) => sum + (d.score || 0), 0) / categoryData.length
          );
          
          const predictions = categoryData
            .map((data, idx) => `Quarter ${idx + 1}: ${data.prediction}`)
            .join('\n\n');
          
          return {
            title: category.label,
            score: avgScore,
            content: predictions
          };
        }).filter(Boolean);

        return {
          title: `${selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)} ${activeTab} Overview`,
          subtitle: new Date().getFullYear().toString(),
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
          subtitle: (activeTab === 'Today' || activeTab === 'Daily') ? formatted : 'Sunday - Saturday',
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
      // Yearly data structure
      const phases = ['phase_1', 'phase_2', 'phase_3', 'phase_4'];
      const allPhaseData = phases
        .map(phase => response[phase]?.[activeCategory])
        .filter(Boolean);
      
      const content = allPhaseData
        .map((data, idx) => {
          const phaseName = `Quarter ${idx + 1}: ${response[phases[idx]]?.period}`;
          return `${phaseName}\n${data.prediction}`;
        })
        .join('\n\n');
      
      const avgScore = allPhaseData.length > 0 
        ? Math.round(allPhaseData.reduce((sum, d) => sum + (d.score || 0), 0) / allPhaseData.length)
        : null;

      return {
        title: categories.find(c => c.id === activeCategory)?.label || activeCategory,
        subtitle: new Date().getFullYear().toString(),
        content: content || 'Yearly predictions coming soon.',
        score: avgScore,
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
      subtitle: (activeTab === 'Today' || activeTab === 'Daily') ? formatted : 'Sunday - Saturday',
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
    
    // Navigate to corresponding route
    // Both "Today" and "Daily" go to daily-horoscope
    if (tab === 'Today' || tab === 'Daily') {
      navigate(`/horoscopes/daily-horoscope/${selectedZodiac}`);
    } else if (tab === 'This Week') {
      navigate(`/horoscopes/weekly-horoscope/${selectedZodiac}`);
    } else if (tab === 'This Year') {
      navigate(`/horoscopes/yearly-horoscope/${selectedZodiac}`);
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
    if (pathname.includes('daily-horoscope') || pathname.includes('todays-horoscope')) {
      newPath = `/horoscopes/daily-horoscope/${tempSelectedZodiac}`;
    } else if (pathname.includes('weekly-horoscope')) {
      newPath = `/horoscopes/weekly-horoscope/${tempSelectedZodiac}`;
    } else if (pathname.includes('yearly-horoscope')) {
      newPath = `/horoscopes/yearly-horoscope/${tempSelectedZodiac}`;
    } else {
      // Default to daily horoscope
      newPath = `/horoscopes/daily-horoscope/${tempSelectedZodiac}`;
    }
    
    navigate(newPath, { replace: true });
  };

  const handleOpenModal = () => {
    setTempSelectedZodiac(selectedZodiac);
    setShowZodiacModal(true);
  };

  const selectedZodiacData = zodiacSigns.find(
    z => z.name.toLowerCase() === selectedZodiac.toLowerCase()
  );

  // Get zodiac image from appSvgs
  const capitalizedSign = selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1);
  const zodiacImage = appSvgs[capitalizedSign];

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
      
      <div className="horoscope-header-Wrap">
        <div className="horoscope-header">
          <button className="back-button" onClick={() => navigate('/')}>
            <ChevronLeft size={24} />
          </button>
          <button className="profile-selector" onClick={handleOpenModal}>
            <div className="selector-content">
              <span className="selector-label">Select Horoscope</span>
              <span className="selector-value">
                {selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)}
              </span>
            </div>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="horoscope-page-content">
        <div className="horoscope-container">
          <div className="zodiac-display">
            <div className="zodiac-info">
              <h1 className="zodiac-name">
                {selectedZodiac.charAt(0).toUpperCase() + selectedZodiac.slice(1)}
              </h1>
              <p className="zodiac-date-range">{selectedZodiacData?.dateRange}</p>
            </div>
            {zodiacImage && (
              <img 
                src={zodiacImage} 
                alt={capitalizedSign}
                className="zodiac-symbol-img"
              />
            )}
          </div>

          <div className="time-tabs-wrapper">
            <div className="time-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`time-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

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

          <div className="horoscope-content">
            <h2 className="content-title">
              {currentContent.title}
              {currentContent.score && !currentContent.isOverview && (
                <span style={{ fontSize: '14px', color: 'orange', marginLeft: '8px' }}>
                  ({currentContent.score}/100)
                </span>
              )}
            </h2>
            
            {/* Lucky Details - Only for Daily and Weekly, not in Overview */}
            {!currentContent.isOverview && (activeTab === 'Today' || activeTab === 'This Week') && currentContent.luckyColor && (
              <div className="lucky-details">
                <h3 className="lucky-title">Lucky Details</h3>
                <p className="lucky-item">
                  <strong>Lucky Color:</strong>{' '}
                  <span
                    style={{
                      color: currentContent.luckyColor?.toLowerCase() === 'white'
                        ? '#000'
                        : currentContent.luckyColorCode,
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
                {(activeTab === 'Today' || activeTab === 'Daily' || activeTab === 'This Week') && currentContent.luckyColor && (
                  <div className="lucky-details">
                    <h3 className="lucky-title">Lucky Details</h3>
                    <p className="lucky-item">
                      <strong>Lucky Color:</strong>{' '}
                      <span
                        style={{
                          color: currentContent.luckyColor?.toLowerCase() === 'white'
                            ? '#000'
                            : currentContent.luckyColorCode,
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
                              <span className="overview-card-score">
                                ({section.score}/100)
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
                      const savedIndex = overviewCardIndex;
                      setCameFromOverview(false);
                      setOverviewCardIndex(null);
                      setActiveCategory('overview');
                      // Scroll to the card after state updates and re-render
                      setTimeout(() => {
                        if (savedIndex !== null && overviewCardRefs.current[savedIndex]) {
                          overviewCardRefs.current[savedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
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
      </div>
    </div>
  );
};

export default HoroscopeNew;
