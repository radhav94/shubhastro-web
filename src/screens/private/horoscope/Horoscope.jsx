import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import overViewImg from '../../../assets/images/overview-img.png';

const HoroscopeNew = () => {
  const navigate = useNavigate();
  const { sign } = useParams();
  const { pathname } = useLocation();
  
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
  
  // Default to first sign if no sign in URL
  const [selectedZodiac, setSelectedZodiac] = useState(sign?.toLowerCase() || 'aries');
  const [tempSelectedZodiac, setTempSelectedZodiac] = useState(sign?.toLowerCase() || 'aries');
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [activeCategory, setActiveCategory] = useState('');
  const [showZodiacModal, setShowZodiacModal] = useState(false);

  const tabs = ['Today', 'Daily', 'This Week', 'This Year'];
  
  // Categories will be dynamically generated from API response
  const [categories, setCategories] = useState([]);

  // Update selected zodiac when URL param changes
  useEffect(() => {
    if (sign) {
      setSelectedZodiac(sign.toLowerCase());
      setTempSelectedZodiac(sign.toLowerCase());
    }
  }, [sign]);

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
    
    // Navigate to corresponding route
    // Both "Today" and "Daily" go to daily-horoscope
    if (tab === 'Today' || tab === 'Daily') {
      navigate('/horoscopes/daily-horoscope');
    } else if (tab === 'This Week') {
      navigate('/horoscopes/weekly-horoscope');
    } else if (tab === 'This Year') {
      navigate('/horoscopes/yearly-horoscope');
    }
  };

  const handleZodiacClick = (zodiac) => {
    setTempSelectedZodiac(zodiac.toLowerCase());
  };

  const handleConfirmZodiac = () => {
    setSelectedZodiac(tempSelectedZodiac);
    setShowZodiacModal(false);
    // Don't navigate, just update state to stay on same page
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

  return (
    <div className="horoscope-page">
      <PrimaryLoader isLoading={isLoading} />
      
      <div className="horoscope-page-content">
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
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="category-label">{category.label}</span>
                  <img className="categoryImages" src={overViewImg} alt="icons" />
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
                
                {currentContent.overviewSections.map((section, index) => (
                  <div key={index} className="overview-section">
                    <h3 className="overview-section-title">
                      {section.title}
                      {section.score && (
                        <span style={{ fontSize: '14px', color: 'orange', marginLeft: '8px' }}>
                          ({section.score}/100)
                        </span>
                      )}
                    </h3>
                    <div className="overview-section-content">
                      {section.content.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Category Content */
              <div className="content-text">
                {currentContent.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
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
