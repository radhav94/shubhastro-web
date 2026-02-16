import { useState, useEffect } from "react";
import styles from "./AIWow.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import FeatureCard from "./components/FeatureCard";
import ComingSoonCard from "./components/ComingSoonCard";
import MobileAppModal from "./components/MobileAppModal";
import { ProfileManager } from "../../../component/UI/Profile";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetAiWowPageDataQuery } from "../../../redux/api/aiwow/aiwowApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";

const AIWow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // Get current user ID
  const currentUserId =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_id")
      : localStorage.getItem("shubhtalk_customer_id");

  // API Hooks
  const { data, isLoading, isFetching } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });

  // Fetch Explore Page Data
  const { data: aiwowData, isLoading: isLoadingAiWow } =
    useGetAiWowPageDataQuery();

  // Get profiles from API
  const profiles = data?.data || [];

  // Get explore page sections
  const aiwowSections = aiwowData?.data?.list || [];

  // Auto-select first profile on load - only after data is fetched
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile && !isFetching) {
      setSelectedProfile(profiles[0]);
      // Store selected profile
      localStorage.setItem(
        "selectedKundliProfile",
        JSON.stringify(profiles[0]),
      );
    }
  }, [profiles, selectedProfile, isFetching]);

  // Clear selected profile when user changes (on refresh after login)
  useEffect(() => {
    if (currentUserId && selectedProfile) {
      const profileBelongsToCurrentUser = profiles.some(
        (profile) => profile._id === selectedProfile._id,
      );

      if (!profileBelongsToCurrentUser) {
        setSelectedProfile(null);
      }
    }
  }, [currentUserId, profiles]);

  // Scroll to section if hash is present in URL
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location]);

  const handleARVastuClick = () => {
    setShowMobileAppModal(true);
  };

  const handleFeatureClick = (route) => {
    // Navigate directly with selected profile already stored
    if (selectedProfile) {
      navigate(route);
    } else {
      // If no profile selected, open profile selector
      setShowProfileModal(true);
    }
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    // Store selected profile
    localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
    setShowProfileModal(false);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  // WOW Suite - Visual & Immersive Experiences
  // const wowSuite = [
  //   {
  //     id: "ar-vastu",
  //     badge: "New",
  //     badgeType: "new",
  //     title: "AR Vastu Scanner",
  //     description:
  //       "Scan your space with augmented reality for instant Vastu analysis",
  //     icon: "vastu",
  //     onClick: handleARVastuClick,
  //   },
  //   {
  //     id: "palmistry",
  //     badge: "Popular",
  //     badgeType: "popular",
  //     title: "AI Palmistry Scanner",
  //     description:
  //       "AI-powered palm reading analyzing life, heart, and fate lines",
  //     icon: "palm",
  //     onClick: () => handleFeatureClick("/aiwow/palmistry"),
  //   },
  //   {
  //     id: "face-reading",
  //     badge: "Popular",
  //     badgeType: "popular",
  //     title: "Astro Face Reading",
  //     description: "Facial analysis revealing personality traits and destiny",
  //     icon: "face",
  //     onClick: () => handleFeatureClick("/aiwow/face-reading"),
  //   },
  //   {
  //     id: "signature",
  //     badge: "Popular",
  //     badgeType: "popular",
  //     title: "Signature Analysis",
  //     description:
  //       "Analyze personality traits and behavioral patterns through handwriting",
  //     icon: "signature",
  //     onClick: () => handleFeatureClick("/aiwow/signature"),
  //   },
  //   {
  //     id: "cloth-color",
  //     badge: "New",
  //     badgeType: "new",
  //     title: "Clothes Colour Analysis",
  //     description:
  //       "Discover your lucky colors based on astrological influences",
  //     icon: "clothes",
  //     onClick: () => handleFeatureClick("/aiwow/cloth-color"),
  //   },
  //   {
  //     id: "gemstone",
  //     badge: "Beta",
  //     badgeType: "beta",
  //     title: "Gemstone Authenticity",
  //     description:
  //       "Verify gemstone authenticity and check astrological significance",
  //     icon: "gemstone",
  //     onClick: () => handleFeatureClick("/aiwow/gemstone"),
  //   },
  //   {
  //     id: "aura-photography",
  //     badge: "New",
  //     badgeType: "new",
  //     title: "Aura Photography",
  //     description:
  //       "Capture and analyze your aura based on your energy and emotions",
  //     icon: "aura",
  //     onClick: () => handleFeatureClick("/aiwow/aura"),
  //   },
  // ];

  // Companion Suite - Conversational AI Assistants
  // const companionSuite = [
  //   {
  //     id: "talk-to-kundli",
  //     badge: "New",
  //     badgeType: "new",
  //     title: "Talk to your Kundli",
  //     description:
  //       "Chat with AI that knows your birth chart history and can answer questions",
  //     icon: "chat",
  //     onClick: () => handleFeatureClick("/aiwow/talk-to-kundli"),
  //   },
  //   {
  //     id: "cosmic-chat",
  //     badge: "Popular",
  //     badgeType: "popular",
  //     title: "Cosmic Chat",
  //     description:
  //       "AI-powered astrology assistant in English, Hindi, and Marathi",
  //     icon: "message",
  //     onClick: () => handleFeatureClick("/aiwow/cosmic-chat"),
  //   },
  //   {
  //     id: "daily-briefing",
  //     badge: "New",
  //     badgeType: "new",
  //     title: "Daily Cosmic Briefing",
  //     description: "Your personalized daily astrological weather report",
  //     icon: "sun",
  //     onClick: () => handleFeatureClick("/aiwow/daily-cosmic-briefing"),
  //   },
  //   {
  //     id: "dream-interpreter",
  //     badge: "Popular",
  //     badgeType: "popular",
  //     title: "Dream Interpreter",
  //     description:
  //       "Decode your dreams with psychological and astrological insights",
  //     icon: "moon",
  //     onClick: () => handleFeatureClick("/aiwow/dream-interpreter"),
  //   },
  // ];

  // Action Suite - Utility & Bio-Tech Tools
  // const actionSuite = [
  //   {
  //     id: "smart-matchmaking",
  //     badge: "Premium",
  //     badgeType: "premium",
  //     title: "Smart Matchmaking",
  //     description: "AI-enhanced compatibility analysis for relationships",
  //     icon: "heart",
  //     onClick: () => handleFeatureClick("/aiwow/smart-matchmaking"),
  //   },
  //   {
  //     id: "agentic-calendar",
  //     badge: "Beta",
  //     badgeType: "beta",
  //     title: "Agentic Calendar",
  //     description: "Intelligent scheduling based on astrological timing",
  //     icon: "calendar",
  //     onClick: () => handleFeatureClick("/aiwow/agentic-calendar"),
  //   },
  //   // {
  //   //   id: "karmic-debt-tracker",
  //   //   badge: "New",
  //   //   badgeType: "new",
  //   //   title: "Karmic Debt Tracker",
  //   //   description: "Track and understand your karmic patterns and life lessons",
  //   //   icon: "health",
  //   //   onClick: () => handleFeatureClick("/aiwow/karmic-debt-tracker"),
  //   // },
  //   // {
  //   //   id: "astro-vitals",
  //   //   badge: "Beta",
  //   //   badgeType: "beta",
  //   //   title: "AstroVitals",
  //   //   description: "Health insights through astrological analysis",
  //   //   icon: "health",
  //   //   onClick: () => handleFeatureClick("/aiwow/astro-vitals"),
  //   // },
  // ];

  const handleClick = (slug) => {
    if (slug == "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      setShowMobileAppModal(false);
      navigate(`/aiwow/${slug}`);
    }
    
  };

  // Coming Soon Features - Empty array since Aura Photography is now unlocked
  const comingSoonFeatures = [];

  const renderSection = (title, description, features) => {
    if (!features || features.length === 0) return null;

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              badge={feature.badge}
              badgeType={feature.badgeType}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              onStartNow={feature.onClick}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {isLoading && <PrimaryLoader />}

      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <span class={styles.headerBack}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* <h1 className={styles.title}>AI WOW</h1> */}
          </span>
          <div
            className={styles.profileSelector}
            onClick={() => setShowProfileModal(true)}
          >
            <span className={styles.selectLabel}>Select Profile</span>
            <span className={styles.profileName}>
              {selectedProfile ? selectedProfile.name : "Select Profile"}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  display: "inline-block",
                  marginLeft: "4px",
                  verticalAlign: "middle",
                }}
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroBadge}>Powered by Advanced AI</div>
          <h2 className={styles.heroTitle}>AI Experiences</h2>
          <p className={styles.heroSubtitle}>
            Explore the future of astrology with our cutting-edge AI-powered
            tools and experiences
          </p>
        </div>

        {aiwowSections?.length > 0 &&
          aiwowSections?.map((section) => {
            return (
              <>
                {section?.status && (
                  <div className={styles.section} key={section?.ID}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>{section?.title}</h2>
                      <p className={styles.sectionDescription}>
                        {section?.description}
                      </p>
                    </div>
                    <div className={styles.featureGrid}>
                      {section?.content?.length > 0 &&
                        section?.content.map((feature) => (
                          <>
                            {feature?.publishStatus && (
                              <FeatureCard
                                key={feature.id}
                                badge={feature.badge}
                                badgeType={feature.badgeType}
                                title={feature.title}
                                description={feature.description}
                                icon={feature.icon}
                                onStartNow={()=>handleClick(feature?.slug)}
                              />
                            )}
                          </>
                        ))}
                    </div>
                  </div>
                )}
              </>
            );
          })}

        {/* WOW Suite */}
        {/* {renderSection("WOW Suite", "Visual & Immersive Experiences", wowSuite)} */}

        {/* Companion Suite */}
        {/* <div id="companion-suite">
          {renderSection(
            "Companion Suite",
            "Conversational AI Assistants",
            companionSuite,
          )}
        </div> */}

        {/* Action Suite */}
        {/* {renderSection("Action Suite", "Utility & Bio-Tech Tools", actionSuite)} */}

        {/* Coming Soon Section - Only show if there are features */}
        {comingSoonFeatures.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Coming Soon</h2>
              <p className={styles.sectionDescription}>
                Exciting new features on the horizon
              </p>
            </div>
            <div className={styles.featureGrid}>
              {comingSoonFeatures.map((feature) => (
                <ComingSoonCard
                  key={feature.id}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Manager - Handles all profile operations */}
      <ProfileManager
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        onProfileSelect={handleProfileSelect}
        selectedProfileId={selectedProfile?._id}
        title="Select Profile"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Mobile App Download Modal */}
      <MobileAppModal
        isOpen={showMobileAppModal}
        onClose={() => setShowMobileAppModal(false)}
      />
    </div>
  );
};

export default AIWow;
