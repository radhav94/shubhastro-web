import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Search,
  Home as HomeIcon,
  Compass,
  Radio,
  UserRound,
  Store,
  BookOpen,
  Heart,
  Plus,
  Calendar,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import styles from "./Home.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices";

// Image imports
import quickActionOne from "../../../assets/images/quick-action-1.svg";
import quickActionTwo from "../../../assets/images/quick-action-2.svg";
import quickActionThree from "../../../assets/images/quick-action-3.svg";
import consult from "../../../assets/images/astrologer.svg";
import astrologerImage from "../../../assets/images/top-rated-1.svg";
import astrologerSquare from "../../../assets/images/astrologer-square.svg";
import vedikKundli from "../../../assets/images/vedic-kundli.svg";
import horoscope from "../../../assets/images/horoscope.svg";
import wheel from "../../../assets/images/wheel.svg";
import sun from "../../../assets/images/sun.svg";
import sunriseIcon from "../../../assets/images/sunrise-icon.svg";
import sunsetIcon from "../../../assets/images/sunset-icon.svg";
import moonriseIcon from "../../../assets/images/moonrise-icon.svg";
import moonsetIcon from "../../../assets/images/moonset-icon.svg";
import numerology from "../../../assets/images/numerology.svg";
import matchmaking from "../../../assets/images/matchmaking.svg";
import tarot from "../../../assets/images/tarot.svg";
import blog from "../../../assets/images/blog.svg";

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingConsult, setLoadingConsult] = useState(true);
  const [loadingConnect, setLoadingConnect] = useState("all");
  const [loadingCallAgain, setLoadingCallAgain] = useState("all");
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const quickActions = [
    { 
      id: 1, 
      title: "Chat with Astrologer", 
      image: quickActionOne,
      path: PATH.privateRoutes.Chat_With_ASTROLOGER.path
    },
    { 
      id: 2, 
      title: "Talk to Astrologer", 
      image: quickActionOne,
      path: PATH.privateRoutes.Chat_With_ASTROLOGER.path
    },
    { 
      id: 3, 
      title: "Astromall Shop", 
      image: quickActionTwo,
      path: PATH.privateRoutes.SHOP.path
    },
    { 
      id: 4, 
      title: "Book A Pooja", 
      image: quickActionThree,
      path: "shop/vip-e-pooja"
    },
  ];

  const carouselSlides = [
    {
      id: 1,
      title: "Consult our astrologers today.",
      subtitle: "Get advice from astrologers.",
      buttonText: "Consult Now",
      image: consult,
    },
    {
      id: 2,
      title: "Want to know your future?",
      subtitle: "Get advice from experts.",
      buttonText: "Consult Now",
      image: consult,
    },
    {
      id: 3,
      title: "Want to know your future?",
      subtitle: "Get advice from experts.",
      buttonText: "Consult Now",
      image: consult,
    },
    {
      id: 4,
      title: "Consult our astrologers today.",
      subtitle: "Get advice from astrologers.",
      buttonText: "Consult Now",
      image: consult,
    },
  ];

  const { data, isLoading } = useGetHomeDetailsQuery();
  const homeList = data?.data?.list;
  const astrologerSectionOnline = homeList?.find(
    (item) => item.slug === "astrologer",
  );
  const astrologersOnline = astrologerSectionOnline?.content || [];

  const OurastrologerSection = homeList?.find(
    (item) => item.slug === "our-astrologers",
  );
  const Ourastrologers = OurastrologerSection?.content || [];

  // Blog data
  const blogSection = homeList?.find((item) => item.display_type === "blog");
  const blogData = blogSection?.content || [];

  console.log("Ourastrologers", Ourastrologers);
  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  // Clear loading states on mount
  useEffect(() => {
    setLoadingConsult(true);
    setLoadingConnect("all");
    setLoadingCallAgain("all");
  }, []);

  // Scroll to active slide
  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.children[0]?.offsetWidth || 0;
      const gap = 16; // gap between slides
      const scrollPosition = activeSlide * (slideWidth + gap);

      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [activeSlide]);

  // Handle dot click
  const handleDotClick = (index) => {
    setActiveSlide(index);
  };

  // Handle Consult Now button
  const handleConsultNow = () => {
    setLoadingConsult(true);
    setTimeout(() => {
      navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path);
    }, 500);
  };

  // Handle Connect button
  const handleConnect = (astrologerId) => {
    setLoadingConnect(astrologerId);
    setTimeout(() => {
      navigate(`/chat-with-astrologers/${astrologerId}`);
    }, 500);
  };

  // Handle Call Again button
  const handleCallAgain = (sessionId) => {
    setLoadingCallAgain(sessionId);
    setTimeout(() => {
      navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path);
    }, 500);
  };

  return (
    <div className={styles.home}>
      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Today's Horoscope Card */}
        <section className={styles.horoscopeSection}>
          <div className={styles.horoscopeCard}>
            <div className={styles.horoscopeContent}>
              <h2 className={styles.horoscopeTitle}>TODAY'S HOROSCOPE</h2>
              <div className={styles.dividerContainer}>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#fff" fill-opacity="0.2"/>
                  </svg>
                </div>
                <span className={styles.dividerMoon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 4 6" fill="none">
                    <path d="M3.39392 4.49489C3.03602 4.84065 2.58016 5.0493 2.08582 5.0493C0.934798 5.0493 0 3.9185 0 2.52316C0 1.1308 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00931234 2.38704 0.024961C1.91056 0.485852 1.60687 1.196 1.60687 1.99371C1.60687 3.26461 2.38458 4.31717 3.39392 4.49489Z" fill="#FEFEFE"/>
                  </svg>
                </span>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#fff" fill-opacity="0.2"/>
                  </svg>
                </div>
              </div>
              <h3 className={styles.horoscopeHeading}>Saturn in Libra</h3>
              <p className={styles.horoscopeSubtext}>
                Time to balance emotions
              </p>
              <div className={styles.horoscopeAction}>
                <span>Tap for Daily Horoscope</span>
                <ChevronRight size={18} />
              </div>
            </div>
            <div className={styles.horoscopePlanet}>
              <img
                src={horoscope}
                alt="Planet"
                className={styles.planetImage}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          </div>
        </section>

        {/* Consultation Carousel */}
        <section className={styles.carouselSection}>
          <div className={styles.carouselContainer} ref={carouselRef}>
            {carouselSlides.map((slide, index) => (
              <div
                key={slide.id + "-" + index}
                className={`${styles.carouselSlide} ${activeSlide === index ? styles.activeSlide : ""}`}
              >
                <div className={styles.slideContent}>
                  <h3 className={styles.slideTitle}>{slide.title}</h3>
                  <p className={styles.slideSubtitle}>{slide.subtitle}</p>
                  <button 
                    className={`${styles.slideButton} ${loadingConsult ? styles.loading : ""}`}
                    onClick={handleConsultNow}
                    disabled={loadingConsult}
                  >
                    {slide.buttonText} <ChevronRight size={16} />
                  </button>
                </div>
                <div className={styles.slideImageWrapper}>
                  <img
                    src={slide.image}
                    alt="Astrologer"
                    className={styles.astrologerImage}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.carouselDots}>
            {carouselSlides.map((_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${activeSlide === index ? styles.active : ""}`}
                onClick={() => handleDotClick(index)}
              ></span>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          {quickActions.map((action) => (
            <div 
              key={action.id} 
              className={styles.actionCard}
              onClick={() => navigate(action.path)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className={styles.actionTitle}>{action.title}</h3>

              <div className={styles.actionMedia}>
                <div className={styles.actionCircle} />
                <img
                  src={action.image}
                  alt={action.title}
                  className={styles.actionImg}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Pandit AI Section */}
        <section className={styles.panditAISection}>
          <div className={styles.panditAICard}>
            <div className={styles.panditInfo}>
              <div className={styles.panditAvatar}>
                <span>🧘‍♀️</span>
              </div>
              <div className={styles.panditText}>
                <span className={styles.panditName}>
                  Pandit AI <span className={styles.sparkle}>✨</span>
                </span>
                <span className={styles.panditRole}>AI Assistant</span>
              </div>
            </div>
            <button className={styles.freeQuestionBtn}>1 Free Question</button>
          </div>

          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="When will I get a job?"
              className={styles.searchInput}
            />
            <button className={styles.searchSubmit}>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Top Rated Astrologers Section */}
        <section className={styles.astrologersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              TOP RATED ASTROLOGERS FOR YOU
            </h2>
            <div className={styles.titleDivider}>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                  </svg>
              </div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.astrologersGrid}>
            {astrologersOnline.map((astrologer) => (
              <div key={astrologer._id} className={styles.astrologerCard}>
                <div className={styles.astrologerImageWrapper}>
                  <img
                    src={astrologerImage}
                    alt={astrologer.firstName}
                    className={styles.astrologerImg}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className={styles.ratingBadge}>
                  <span className={styles.star}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 12 13" fill="none">
                      <g clip-path="url(#clip0_4961_937)">
                        <path d="M5.94187 1.3447C6.09954 0.919606 6.69621 0.919606 6.85438 1.3447L7.87429 4.2327C7.90988 4.32678 7.97253 4.40762 8.05399 4.46454C8.13545 4.52146 8.23188 4.55179 8.33055 4.55152H10.837C11.3001 4.55152 11.5021 5.14081 11.138 5.42941L9.35441 7.06984C9.27451 7.13262 9.21612 7.21967 9.18762 7.31848C9.15912 7.41729 9.16196 7.52279 9.19575 7.61984L9.84712 10.4419C10.0058 10.8952 9.49237 11.2845 9.10411 11.0055L6.68143 9.43404C6.59847 9.37443 6.49953 9.34245 6.39812 9.34245C6.29672 9.34245 6.19778 9.37443 6.11481 9.43404L3.69214 11.0055C3.30437 11.2845 2.79047 10.8947 2.94912 10.4419L3.60049 7.61984C3.63428 7.52279 3.63713 7.41729 3.60863 7.31848C3.58012 7.21967 3.52173 7.13262 3.44184 7.06984L1.65821 5.42941C1.2936 5.14081 1.4966 4.55152 1.95877 4.55152H4.46521C4.56389 4.55186 4.66035 4.52156 4.74182 4.46463C4.82329 4.4077 4.88594 4.32682 4.92146 4.2327L5.94138 1.3447H5.94187Z" fill="#FFB246" stroke="#FFB246" stroke-width="0.985428" stroke-linecap="round" stroke-linejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_4961_937">
                          <rect width="11.8251" height="12.0879" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  </span>
                  <span className={styles.ratingText}>
                    {astrologer.rating ?? 4}
                  </span>
                </div>
                <h3 className={styles.astrologerName}>
                  {astrologer.firstName} {astrologer.lastName}
                </h3>
                {astrologer.specialities.length > 0 && (
                  <div className={styles.experienceRow}>
                    <BookOpen size={18} className={styles.bookIcon} />
                    <span className={styles.experienceText}>
                      {astrologer.specialities.join(", ")}
                    </span>
                  </div>
                )}
                <button 
                  className={`${styles.connectBtn} ${loadingConnect === astrologer._id || loadingConnect === "all" ? styles.loading : ""}`}
                  onClick={() => handleConnect(astrologer._id)}
                  disabled={loadingConnect === astrologer._id || loadingConnect === "all"}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Explore by Life Area Section */}
        <section className={styles.lifeAreaSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>EXPLORE BY LIFE AREA</h2>
            <div className={styles.titleDivider}>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.lifeAreaGrid}>
            <div
              className={styles.lifeAreaCard}
              onClick={() => navigate(PATH.privateRoutes.COMPATIBILITY.path)}
              style={{ 
                background: "linear-gradient(135deg, #FFE5F0 0%, #FFF0F8 100%)",
                cursor: 'pointer'
              }}
            >
              <h3 className={styles.lifeAreaTitle}>
                Love &<br />
                Relationships
              </h3>
              <div
                className={styles.lifeAreaIcon}
                style={{ background: "#FF6B9D" }}
              >
                <Heart size={32} color="#FFFFFF" fill="#FFFFFF" />
              </div>
            </div>

            <div
              className={styles.lifeAreaCard}
              style={{
                background: "linear-gradient(135deg, #E3F2FD 0%, #F0F8FF 100%)",
              }}
            >
              <h3 className={styles.lifeAreaTitle}>
                Health &<br />
                Wellbeing
              </h3>
              <div
                className={styles.lifeAreaIcon}
                style={{ background: "#4A90E2" }}
              >
                <Plus size={32} color="#FFFFFF" strokeWidth={3} />
              </div>
            </div>
          </div>
        </section>

        {/* My Sessions Section */}
        <section className={styles.sessionsSection}>
          <div className={styles.sessionsHeader}>
            <div className={styles.sessionsHeaderLeft}>
              <h2 className={styles.sessionsTitle}>MY SESSIONS</h2>
              <div className={styles.titleDivider}>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
                </div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                  </svg>
                </div>
              </div>
            </div>
            <button className={styles.viewAllLink}>
              View All <ChevronRight size={20} />
            </button>
          </div>

          <div className={styles.sessionsGrid}>
            {/* Session Card 1 */}
            <div className={styles.sessionCard}>
              <div className={styles.sessionImageWrapper}>
                <img
                  src={astrologerSquare}
                  alt="Dr. K Jagdish Rao"
                  className={styles.sessionImage}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div className={styles.sessionInfo}>
                <h3 className={styles.sessionName}>Dr. K Jagdish Rao</h3>
                <div className={styles.sessionDetails}>
                  <div className={styles.sessionDetail}>
                    <Calendar size={16} className={styles.sessionIconSvg} />
                    <span className={styles.sessionText}>Oct 17, 2025</span>
                  </div>
                  <div className={styles.sessionDetail}>
                    <Clock size={16} className={styles.sessionIconSvg} />
                    <span className={styles.sessionText}>04:36 PM</span>
                  </div>
                </div>
                <p className={styles.sessionDuration}>
                  Duration : 5 Min 30 Secs
                </p>
                <button 
                  className={`${styles.callAgainBtn} ${loadingCallAgain === 1 || loadingCallAgain === "all" ? styles.loading : ""}`}
                  onClick={() => handleCallAgain(1)}
                  disabled={loadingCallAgain === 1 || loadingCallAgain === "all"}
                >
                  Call Again
                </button>
              </div>
            </div>

            {/* Session Card 2 */}
            <div className={styles.sessionCard}>
              <div className={styles.sessionImageWrapper}>
                <img
                  src={astrologerSquare}
                  alt="Pandit Jagdish"
                  className={styles.sessionImage}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div className={styles.sessionInfo}>
                <h3 className={styles.sessionName}>Pandit Jagdish</h3>
                <div className={styles.sessionDetails}>
                  <div className={styles.sessionDetail}>
                    <Calendar size={16} className={styles.sessionIconSvg} />
                    <span className={styles.sessionText}>Oct 15, 2025</span>
                  </div>
                  <div className={styles.sessionDetail}>
                    <Clock size={16} className={styles.sessionIconSvg} />
                    <span className={styles.sessionText}>02:15 PM</span>
                  </div>
                </div>
                <p className={styles.sessionDuration}>
                  Duration : 8 Min 45 Secs
                </p>
                <button 
                  className={`${styles.callAgainBtn} ${loadingCallAgain === 2 || loadingCallAgain === "all" ? styles.loading : ""}`}
                  onClick={() => handleCallAgain(2)}
                  disabled={loadingCallAgain === 2 || loadingCallAgain === "all"}
                >
                  Call Again
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Cosmic Insight Section */}
        <section className={styles.cosmicInsightSection}>
          <div className={styles.cosmicInsightCard}>
            <div className={styles.cosmicContent}>
              <div className={styles.cosmicHeader}>
                <span className={styles.cosmicLabel}>DAILY COSMIC INSIGHT</span>
                <div className={styles.cosmicDivider}>
                  <div className={styles.dividerLine}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                      <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#fff" fill-opacity="0.2"/>
                    </svg>
                  </div>
                  <span className={styles.dividerMoon}>☾</span>
                  <div className={styles.dividerLine}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                      <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#fff" fill-opacity="0.2"/>
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className={styles.cosmicTitle}>Cosmic Insights</h3>
              <p className={styles.cosmicText}>
                Patience is also an action let the stars take their turn.
              </p>
            </div>
            <div className={styles.cosmicArt}>
              <img
                src={wheel}
                alt="Zodiac Wheel"
                className={styles.zodiacWheel}
              />
            </div>
          </div>
        </section>

        {/* Explore Panchang Section */}
        <section className={styles.panchangSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>EXPLORE PANCHANG</h2>
            <div className={styles.titleDivider}>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.panchangTabs}>
            <button className={`${styles.panchangTab} ${styles.active}`}>
              Today
            </button>
            <button className={styles.panchangTab}>Tomorrow</button>
            <button className={styles.panchangTab}>15th Jan</button>
          </div>

          <div className={styles.panchangCard}>
            <div className={styles.panchangHeader}>
              <div className={styles.panchangLeft}>
                <h3 className={styles.panchangTitle}>Poornima</h3>
                <p className={styles.panchangSubtitle}>Tithi</p>
              </div>
              <div className={styles.panchangCenter}>
                <img src={sun} alt="Sun" className={styles.sunIcon} />
              </div>
              <div className={styles.panchangRight}>
                <h3 className={styles.panchangTitle}>Ashwini</h3>
                <p className={styles.panchangSubtitle}>Nakshatra</p>
              </div>
            </div>
          </div>

          <div className={styles.timingsRow}>
            {/* Sun Timings Card */}
            <div className={styles.timingsCard}>
              <div className={styles.panchangTimings}>
                <div className={styles.timingItem}>
                  <img
                    src={sunriseIcon}
                    alt="Sunrise"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>6:35 AM</p>
                  <p className={styles.timingLabel}>Sunrise</p>
                </div>
                <div className={styles.timingDivider}></div>
                <div className={styles.timingItem}>
                  <img
                    src={sunsetIcon}
                    alt="Sunset"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>5:30 PM</p>
                  <p className={styles.timingLabel}>Sunset</p>
                </div>
              </div>
            </div>

            {/* Moon Timings Card */}
            <div className={styles.timingsCard}>
              <div className={styles.panchangTimings}>
                <div className={styles.timingItem}>
                  <img
                    src={moonriseIcon}
                    alt="Moonrise"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>6:25 PM</p>
                  <p className={styles.timingLabel}>Moonrise</p>
                </div>
                <div className={styles.timingDivider}></div>
                <div className={styles.timingItem}>
                  <img
                    src={moonsetIcon}
                    alt="Moonset"
                    className={styles.timingIcon}
                  />
                  <p className={styles.timingTime}>6:00 AM</p>
                  <p className={styles.timingLabel}>Moonset</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Astrologer for you Section */}
        <section className={styles.astrologersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>ASTROLOGERS FOR YOU</h2>
            <div className={styles.titleDivider}>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}>
                <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                  <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.astrologersGrid}>
            {Ourastrologers.map((astrologer) => (
              <div key={astrologer.id} className={styles.astrologerCard}>
                <div className={styles.astrologerImageWrapper}>
                  <img
                    src={astrologer.imageUrl}
                    alt={astrologer.name}
                    className={styles.astrologerImg}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className={styles.ratingBadge}>
                  <span className={styles.star}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 12 13" fill="none">
                      <g clip-path="url(#clip0_4961_292)">
                        <path d="M5.94187 1.3447C6.09954 0.919606 6.69621 0.919606 6.85438 1.3447L7.87429 4.2327C7.90988 4.32678 7.97253 4.40762 8.05399 4.46454C8.13545 4.52146 8.23188 4.55179 8.33055 4.55152H10.837C11.3001 4.55152 11.5021 5.14081 11.138 5.42941L9.35441 7.06984C9.27451 7.13262 9.21612 7.21967 9.18762 7.31848C9.15912 7.41729 9.16196 7.52279 9.19575 7.61984L9.84712 10.4419C10.0058 10.8952 9.49237 11.2845 9.10411 11.0055L6.68143 9.43404C6.59847 9.37443 6.49953 9.34245 6.39812 9.34245C6.29672 9.34245 6.19778 9.37443 6.11481 9.43404L3.69214 11.0055C3.30437 11.2845 2.79047 10.8947 2.94912 10.4419L3.60049 7.61984C3.63428 7.52279 3.63713 7.41729 3.60863 7.31848C3.58012 7.21967 3.52173 7.13262 3.44184 7.06984L1.65821 5.42941C1.2936 5.14081 1.4966 4.55152 1.95877 4.55152H4.46521C4.56389 4.55186 4.66035 4.52156 4.74182 4.46463C4.82329 4.4077 4.88594 4.32682 4.92146 4.2327L5.94138 1.3447H5.94187Z" fill="#FFB246" stroke="#FFB246" stroke-width="0.985428" stroke-linecap="round" stroke-linejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_4961_292">
                          <rect width="11.8251" height="12.0879" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  </span>
                  <span className={styles.ratingText}>
                    {astrologer.experience ?? 4}
                  </span>
                </div>
                <h3 className={styles.astrologerName}>
                  {astrologer.firstName} {astrologer.lastName}
                </h3>
                <div className={styles.experienceRow}>
                  <BookOpen size={18} className={styles.bookIcon} />
                  <span className={styles.experienceText}>
                    {astrologer.specialities.join(", ")}
                  </span>
                </div>
                <button 
                  className={`${styles.connectBtn} ${loadingConnect === astrologer._id || loadingConnect === "all" ? styles.loading : ""}`}
                  onClick={() => handleConnect(astrologer._id)}
                  disabled={loadingConnect === astrologer._id || loadingConnect === "all"}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Discover More Section */}
        <section className={styles.discoverSection}>
          <div className={styles.discoverHeader}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>DISCOVER MORE</h2>
              <div className={styles.titleDivider}>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                  </svg>
                </div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                  </svg>
                </div>
              </div>
            </div>
            <button className={styles.viewAllBtn}>
              <ChevronRight size={24} />
            </button>
          </div>

          <div className={styles.discoverGrid}>
            {/* Vedic Kundli Card */}
            <div
              className={styles.discoverCard}
              style={{ background: "#D43400" }}
              onClick={() => navigate(PATH.privateRoutes.KUNDLI.path)}
            >
              <div className={styles.discoverContent}>
                <h3 className={styles.discoverTitle}>Vedic Kundli</h3>
                <p className={styles.discoverText}>
                  Discover the blueprint of your destiny by vedic wisdom.
                </p>
              </div>
              <img
                src={vedikKundli}
                alt="Kundli Chart"
                className={styles.discoverImage}
              />
            </div>

            {/* Numerology Card */}
            <div
              className={styles.discoverCard}
              style={{ background: "#752B29" }}
              onClick={() => navigate(PATH.privateRoutes.NUMEROLOGY.path)}
            >
              <div className={styles.discoverContent}>
                <h3 className={styles.discoverTitle}>Numerology</h3>
                <p className={styles.discoverText}>
                  Decode the power of numbers and their influence.
                </p>
              </div>
              <img
                src={numerology}
                alt="Numerology"
                className={styles.discoverImage}
              />
            </div>

            {/* Match-making Card */}
            <div
              className={styles.discoverCard}
              style={{ background: "#A560CA" }}
              onClick={() => navigate(PATH.privateRoutes.MATCHMAKING.path)}
            >
              <div className={styles.discoverContent}>
                <h3 className={styles.discoverTitle}>Match-making</h3>
                <p className={styles.discoverText}>
                  Explore cosmic compatibility for love, marriage and harmony.
                </p>
              </div>
              <img
                src={matchmaking}
                alt="Match-making"
                className={styles.discoverImage}
              />
            </div>
            {/* Tarot Card */}
            <div
              className={styles.discoverCard}
              style={{ background: "#3E93C9" }}
              onClick={() => navigate(PATH.privateRoutes.TAROT_CARD_V2.path)}
            >
              <div className={styles.discoverContent}>
                <h3 className={styles.discoverTitle}>Tarot</h3>
                <p className={styles.discoverText}>
                  Unveil the unseen and gain clarity with card readings.
                </p>
              </div>
              <img
                src={tarot}
                alt="Tarot Cards"
                className={styles.discoverImage}
              />
            </div>
          </div>
        </section>

        {/* Explore Blogs and In The News Section */}
        <section className={styles.blogsSection}>
          <div className={styles.blogsHeader}>
            <div className={styles.blogsHeaderLeft}>
              <h2 className={styles.blogsTitle}>
                EXPLORE BLOGS AND IN THE NEWS
              </h2>
              <div className={styles.titleDivider}>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                  </svg>
                </div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
                    <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fill-opacity="0.2"/>
                  </svg>
                </div>
              </div>
            </div>
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate(PATH.privateRoutes.BLOG.path)}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className={styles.blogsGrid}>
            {blogData.length > 0 &&
              blogData.map((blog) => (
                <div
                  key={blog._id}
                  className={styles.blogCard}
                  onClick={() =>
                    navigate(
                      PATH.privateRoutes.SINGLEBLOG.path.replace(
                        ":slug",
                        blog.blogId,
                      ),
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.blogImageWrapper}>
                    <img
                      src={blog.imageUrl || blog}
                      alt={blog.title}
                      className={styles.blogImage}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className={styles.blogContent}>
                    <h3 className={styles.blogTitle}>{blog.title}</h3>
                    <p className={styles.blogDate}>
                      {blog.publishDate
                        ? dayjs(blog.publishDate).format("DD MMM YYYY")
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <button className={`${styles.navItem} ${styles.active}`}>
          <div className={styles.iconCircle}>
            <HomeIcon size={22} />
          </div>
          <span className={styles.label}>Home</span>
          <span className={styles.activeLine} />
        </button>

        <button className={styles.navItem}>
          <div className={styles.iconCircle}>
            <Compass size={22} />
          </div>
          <span className={styles.label}>Explore</span>
        </button>

        {/* LIVE */}
        <button 
          className={styles.liveItem}
          onClick={() => navigate(PATH.privateRoutes.AUDIENCE_LIVE_STREAMING.path)}
        >
          <div className={styles.liveBtn}>
            <Radio size={28} />
          </div>
          <span className={styles.label}>Live</span>
        </button>

        <button 
          className={styles.navItem}
          onClick={() => navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path)}
        >
          <div className={styles.iconCircle}>
            <UserRound size={22} />
          </div>
          <span className={styles.label}>Astrologer</span>
        </button>

        <button 
          className={styles.navItem}
          onClick={() => navigate(PATH.privateRoutes.SHOP.path)}
        >
          <div className={styles.iconCircle}>
            <Store size={22} />
          </div>
          <span className={styles.label}>Astro Mall</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;
