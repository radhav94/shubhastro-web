import { useState, useEffect } from "react";
import styles from "./AIWow.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import FeatureCard from "./components/FeatureCard";
import ComingSoonCard from "./components/ComingSoonCard";
import MobileAppModal from "./components/MobileAppModal";
import { ProfileManager } from "../../../component/UI/Profile";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetAiWowPageDataQuery } from "../../../redux/api/aiwow/aiwowApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { setSelectedKundliProfile } from "../../../redux/aiwow/aiwowSlice";
import { logout } from "../../../redux/auth/authSlice";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import Footer from "../../../layouts/Footer";
import { PATH } from "../../../utils/routes/Paths";

const AIWow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  
  // Get selected profile from Redux
  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);

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


  // Initialize from localStorage and validate against API profiles
  useEffect(() => {
    if (isFetching) return;

    // Handle case when all profiles are deleted
    if (profiles.length === 0) {
      dispatch(setSelectedKundliProfile(null));
      localStorage.removeItem("selectedKundliProfile");
      return;
    }

    const saved = localStorage.getItem("selectedKundliProfile");
    let parsed = null;

    try {
      parsed = saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error parsing saved profile:", error);
      localStorage.removeItem("selectedKundliProfile");
    }

    // If saved profile exists & belongs to this user → restore it
    if (parsed && profiles.some(p => p._id === parsed._id)) {
      dispatch(setSelectedKundliProfile(parsed));
      return;
    }

    // Otherwise fallback to first profile
    const first = profiles[0];
    dispatch(setSelectedKundliProfile(first));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(first));
  }, [profiles, isFetching, dispatch]);

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
    dispatch(setSelectedKundliProfile(profile));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
    setShowProfileModal(false);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleClick = (slug) => {
    // Check if user is logged in
    if (!requireAuth()) return;

    // Check if user has selected a Kundli/Profile
    if (!selectedProfile) {
      toast.error("Please select one Kundli to proceed.");
      return;
    }

    if (slug == "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      setShowMobileAppModal(false);
      navigate(`/aiwow/${slug}`);
    }
    
  };

  const handleProfileClick = () => {
    // ✅ Authentication check - redirect to login if not authenticated
    if (!requireAuth()) return null;
    setShowProfileModal(true);
  };

  // Coming Soon Features - Empty array since Aura Photography is now unlocked
  // const comingSoonFeatures = [];

  

  return (
    <>
    <div className={styles.container}>
      {isLoading && <PrimaryLoader />}

      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <span class={styles.headerBack}>
            <button className={styles.backButton} onClick={() => navigate(PATH.privateRoutes.HOME.path)}>
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
            onClick={handleProfileClick}
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

        
        {/* Coming Soon Section - Only show if there are features */}
        {/* {comingSoonFeatures.length > 0 && (
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
        )} */}
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
    <Footer />
    </>
  );
};

export default AIWow;
