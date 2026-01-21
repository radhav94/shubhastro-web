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
import ConnectAstrologerPopup from "../../../screens/private/v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import KundliSelectModal from "../../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";

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
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  // Use the astrologer connect hook
  const {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

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

  // Handle connect button click
  const handleConnectClick = (astrologer) => {
    setSelectedAstrologer(astrologer);
    setIsConnectPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsConnectPopupOpen(false);
    setSelectedAstrologer(null);
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
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}></div>
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
                  <button className={styles.slideButton}>
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
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}></div>
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
                  <span className={styles.star}>⭐</span>
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
                  className={styles.connectBtn}
                  onClick={() => handleConnectClick(astrologer)}
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
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}></div>
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
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}></div>
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
                  className={styles.callAgainBtn}
                  onClick={() => navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path)}
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
                  className={styles.callAgainBtn}
                  onClick={() => navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path)}
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
                  <div className={styles.dividerLine}></div>
                  <span className={styles.dividerMoon}>☾</span>
                  <div className={styles.dividerLine}></div>
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
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}></div>
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
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerMoon}>☾</span>
              <div className={styles.dividerLine}></div>
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
                  <span className={styles.star}>⭐</span>
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
                  className={styles.connectBtn}
                  onClick={() => handleConnectClick(astrologer)}
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
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}></div>
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
              style={{ background: "#AF6115" }}
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
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerMoon}>☾</span>
                <div className={styles.dividerLine}></div>
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

      {/* Connect Astrologer Popup */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={handleClosePopup}
        astrologer={selectedAstrologer}
        onChatStart={handleChatStart}
        onCallStart={handleCallStart}
      />

      {/* Kundli modal from hook */}
      <KundliSelectModal
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        onSelect={handleAfterKundliSelect}
      />

      {/* Recharge modal from hook */}
      {hookOpenModal.recharge && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <p style={{ textAlign: 'center', marginBottom: '20px' }}>
              Minimum balance of 5 minutes (₹{" "}
              {(selectedAstrologer?.price?.chatRate?.amount || 1) * 5}) is
              required to start chat with
              {` ${selectedAstrologer?.firstName || "Astrologer"}`}.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                onClick={() =>
                  hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
                }
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(PATH.privateRoutes.RECHARGE.path)}
              >
                Recharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
