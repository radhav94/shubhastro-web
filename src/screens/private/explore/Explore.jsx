import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ChevronLeft, Edit, ChevronRight } from "lucide-react";
import styles from "./Explore.module.scss";
import { 
  useGetAllKundlisQuery,
} from "../../../services/appServices/kundliServicesNew";
import { useGetExplorePageDataQuery } from "../../../redux/api/explore/exploreApi";
import { setForm } from "../../../redux/kundliform/formSlice";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { getRouteFromSlug, requiresProfileData } from "../../../utils/constanats/exploreRouteConfig";
import { ProfileManager } from "../../../component/UI/Profile";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import toast from "react-hot-toast";

// Import default images as fallback
import horoscopeImg from "../../../assets/explore/horoscope.png";
import kundliReportsImg from "../../../assets/icons/kundali.png";
import remediesImg from "../../../assets/explore/remedies.png";
import vedicImg from "../../../assets/explore/vedic.png";
import dashaImg from "../../../assets/explore/dasha.png";
import kpImg from "../../../assets/explore/kp.png";
import ashtakvargaImg from "../../../assets/explore/ashtakvarga.png";
import matchmakingImg from "../../../assets/explore/matchmaking.png";
import tarotImg from "../../../assets/explore/tarot.png";
import newsImg from "../../../assets/explore/news.png";
import numerology from "../../../assets/images/numerology.svg";
import { DefaultImages } from "../../../utils/appImages";

// Reusable Section Title with Divider Component
const SectionTitleWithDivider = ({ title }) => (
  <div>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <div className={styles.dividerContainer}>
      <div className={styles.dividerLine}>
        <svg xmlns="http://www.w3.org/2000/svg" width="104" height="1" viewBox="0 0 104 1" fill="none">
          <path d="M103.803 0.406393C103.803 0.630933 101.504 0.812789 98.669 0.812789C95.8336 0.812789 0 0.630933 0 0.406393C0 0.181853 95.8342 0 98.669 0C101.504 0 103.803 0.181853 103.803 0.406393Z" fill="#030303"></path>
        </svg>
      </div>
      <span>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 4 5" fill="none">
          <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"></path>
        </svg>
      </span>
      <div className={styles.dividerLine}>
        <svg xmlns="http://www.w3.org/2000/svg" width="104" height="1" viewBox="0 0 104 1" fill="none">
          <path d="M-4.48009e-06 0.406393C-4.48009e-06 0.630933 2.29856 0.812789 5.13401 0.812789C7.96946 0.812789 103.803 0.630933 103.803 0.406393C103.803 0.181853 7.96885 0 5.13401 0C2.29856 0 -4.48009e-06 0.181853 -4.48009e-06 0.406393Z" fill="#030303"></path>
        </svg>
      </div>
    </div>
  </div>
);

const Explore = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showSelectProfile, setShowSelectProfile] = useState(false);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // API Hooks
  const { data, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  
  // Fetch Explore Page Data
  const { data: exploreData, isLoading: isLoadingExplore } = useGetExplorePageDataQuery();

  // Get profiles from API
  const profiles = data?.data || [];
  
  // Get explore page sections
  const exploreSections = exploreData?.data?.list || [];

  // Auto-select first profile on load
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile]);

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setShowSelectProfile(false);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to get destiny card colors (same as home page category colors)
  const getDestinyCardColor = (index) => {
    const colors = [
      "linear-gradient(135deg, #FFE4BA 0%, #FFD89B 100%)",
      "linear-gradient(135deg, #FFE4E1 0%, #FFC0CB 100%)",
      "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
      "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
      "linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)",
      "linear-gradient(135deg, #FFCCBC 0%, #FFAB91 100%)",
      "linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)",
      "linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)",
      "linear-gradient(135deg, #F8BBD0 0%, #F48FB1 100%)",
    ];
    return colors[index % colors.length];
  };

  // Render section based on display_type and slug
  const renderSection = (section, index) => {
    const sectionContent = Array.isArray(section.content) ? section.content : [];
    const displayType = section.display_type;
    const slug = section.slug;

    // Don't render section if there's no content
    if (!sectionContent || sectionContent.length === 0) {
      return null;
    }

    // All About You - Hero cards
    if (displayType === "all-about-you") {
      return (
        <section key={index} className={styles.section}>
          <h1 className={styles.mainTitle}>{section.display_title || section.title || "All About You"}</h1>
          <p className={styles.subtitle}>
            {section.description || "An ever growing library on the story of you"}
          </p>

          <div className={`${styles.topCardsGrid} ${sectionContent.length > 3 ? styles.scrollable : ''}`}>
            {sectionContent.map((card, idx) => (
              <div
                key={idx}
                className={styles.topCard}
                style={{ backgroundColor: card.bg_color || "#E56329" }}
                onClick={() => handleCardClick(card, "all-about-you")}
              >
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <img
                  src={card.imageUrl || DefaultImages.HoroscopeDefault}
                  alt={card.title}
                  className={styles.cardIcon}
                />
              </div>
            ))}
          </div>
        </section>
      );
    }

    // Discover More - Grid layout (for Kundli section)
    if (displayType === "discover-more" && slug === "discover-your-kundli") {
      return (
        <section key={index} className={styles.section}>
          <div className={styles.kundliSection}>
            <div className={styles.sectionHeader}>
              <SectionTitleWithDivider 
                title={(section.display_title || section.title || "").toUpperCase()} 
              />
              {/* <ChevronRight size={24} className={styles.sectionArrow} /> */}
            </div>

            <div className={styles.kundliGrid}>
              {sectionContent.slice(0, 4).map((card, idx) => (
                <div
                  key={idx}
                  className={styles.kundliCard}
                  onClick={() => handleCardClick(card)}
                >
                  <div className={styles.kundliCardImage}>
                    <img
                      src={card.imageUrl || DefaultImages.VedicKundliDefault}
                      alt={card.title}
                      className={styles.chartImage}
                    />
                  </div>
                  <div className={styles.kundliCardContent}>
                    <h3 className={styles.kundliCardTitle}>{card.title}</h3>
                    {card.description && (
                      <p className={styles.kundliCardDescription}>{card.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // Discover More - Scrollable cards (for Destiny and other sections)
    if (displayType === "discover-more") {
      return (
        <section key={index} className={styles.section}>
          <div className={styles.sectionHeader}>
            <SectionTitleWithDivider 
              title={(section.display_title || section.title || "").toUpperCase()} 
            />
            <ChevronRight size={24} className={styles.sectionArrow} />
          </div>

          <div className={styles.destinyGrid}>
            {sectionContent.map((card, idx) => (
              <div
                key={idx}
                className={styles.destinyCard}
                style={{ background: getDestinyCardColor(idx) }}
                onClick={() => handleCardClick(card)}
              >
                <div className={styles.destinyCardContent}>
                  <h3 className={styles.destinyCardTitle}>{card.title}</h3>
                  <p className={styles.destinyCardSubtitle}>{card.description}</p>
                </div>
                {card.image_url && (
                  <img
                    src={card.image_url || DefaultImages.VedicKundliDefault}
                    alt={card.title}
                    className={styles.destinyCardImage}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    // Blog section
    if (displayType === "blog" && slug === "blog") {
      return (
        <section key={index} className={styles.section}>
          <div className={styles.sectionHeader}>
            <SectionTitleWithDivider 
              title={(section.display_title || section.title || "EXPLORE BLOGS").toUpperCase()} 
            />
            <ChevronRight size={24} className={styles.sectionArrow} />
          </div>

          <div className={styles.blogsScroll}>
            {sectionContent.map((blog, idx) => (
              <div
                key={idx}
                className={styles.blogCard}
                onClick={() => {
                  // Use blogId or ID field for navigation
                  const blogId = blog.blogId || blog.ID || blog.id || blog._id;
                  if (blogId) {
                    navigate(`/blog/${blogId}`);
                  }
                }}
              >
                <div className={styles.blogImage}>
                  <img
                    src={blog.imageUrl || DefaultImages.BlogsDefault}
                    alt={blog.title}
                    className={styles.blogBgImage}
                  />
                  <span className={styles.blogDate}>
                    {formatDate(blog.publishDate || blog.date)}
                  </span>
                </div>
                <h4 className={styles.blogTitle}>{blog.title}</h4>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // News section (display_type: "blog" with slug: "news")
    if (displayType === "blog" && slug === "news") {
      return (
        <section key={index} className={styles.section}>
          <div className={styles.sectionHeader}>
            <SectionTitleWithDivider 
              title={(section.display_title || section.title || "IN THE NEWS").toUpperCase()} 
            />
            <ChevronRight size={24} className={styles.sectionArrow} />
          </div>

          <div className={styles.blogsScroll}>
            {sectionContent.map((news, idx) => (
              <div
                key={idx}
                className={styles.blogCard}
                onClick={() => {
                  if (news.redirect_url) {
                    window.open(news.redirect_url, '_blank');
                  }
                }}
              >
                <div className={styles.blogImage}>
                  <img
                    src={news.imageUrl || DefaultImages.NewBlogsDefault}
                    alt={news.title}
                    className={styles.blogBgImage}
                  />
                  <span className={styles.blogDate}>
                    {formatDate(news.date)}
                  </span>
                </div>
                <h4 className={styles.blogTitle}>{news.title}</h4>
                {news.news_channel && (
                  <p className={styles.newsChannel}>{news.news_channel}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    // Matchmaking banner
    if (displayType === "matchmaking") {
      const matchmakingData = sectionContent[0];
      return (
        <div key={index} className={styles.matchmakingBanner}>
          <div className={styles.matchmakingContent}>
            <h3 className={styles.matchmakingTitle}>
              {matchmakingData?.title || section.title || "Matchmaking"}
            </h3>
            <p className={styles.matchmakingText}>
              {matchmakingData?.description || section.description || "Measures emotional alignment and long-term compatibility"}
            </p>
          </div>
          <img
            src={matchmakingData?.imageUrl || matchmakingImg}
            alt="Matchmaking"
            className={styles.matchmakingIcon}
          />
        </div>
      );
    }

    // Default fallback - render as scrollable cards
    return (
      <section key={index} className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {(section.display_title || section.title || "").toUpperCase()}
          </h2>
          <ChevronRight size={24} className={styles.sectionArrow} />
        </div>

        <div className={styles.destinyGrid}>
          {sectionContent.map((card, idx) => (
            <div
              key={idx}
              className={styles.destinyCard}
              style={{ background: getDestinyCardColor(idx) }}
              onClick={() => handleCardClick(card)}
            >
              <div className={styles.destinyCardContent}>
                <h3 className={styles.destinyCardTitle}>{card.title}</h3>
                {card.description && (
                  <p className={styles.destinyCardSubtitle}>{card.description}</p>
                )}
              </div>
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className={styles.destinyCardImage}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Fallback data for default images
  const defaultImages = {
    horoscope: horoscopeImg,
    kundli: kundliReportsImg,
    remedies: remediesImg,
    vedic: vedicImg,
    dasha: dashaImg,
    kp: kpImg,
    ashtakvarga: ashtakvargaImg,
    matchmaking: matchmakingImg,
    tarot: tarotImg,
    numerology: numerology,
    news: newsImg,
  };

  const handleCardClick = (card, sectionType = null) => {
    let redirectUrl = null;
    
    // Use slug-based routing ONLY for "All About You" section
    if (sectionType === "all-about-you" && card.slug) {
      redirectUrl = getRouteFromSlug(card.slug);
    }
    
    // For all other sections, use title-based mapping or direct URL
    if (!redirectUrl) {
      const titleToRouteMap = {
        // All About You section
        "Explore Your Horoscope": "/horoscopes/daily-horoscope",
        "Explore Your Kundli": "/kundli",
        "Kundli Reports": "/kundli?tab=free-report",
        "Remedies For You": "/remedies",
        "Remedies": "/remedies",
        
        // Discover Your Kundli section
        "Vedic Kundli": "/kundli?tab=kundli",
        "Vedic Kundali": "/kundli?tab=kundli",
        "KP Chart": "/kundli?tab=kp",
        "KP": "/kundli?tab=kp",
        "Dasha": "/kundli?tab=dasha",
        "Ashtakvarga Chart": "/kundli?tab=ashtakvarga",
        "Ashtakvarga": "/kundli?tab=ashtakvarga",
        
        // Explore Your Destiny section
        "Tarot": "/tarot",
        "Numerology": "/numerology",
        "Gemstones": "/gemstones",
        "Gemstone": "/gemstones",
      };
      
      redirectUrl = titleToRouteMap[card.title] || card.redirect_url || card.redirectUrl || card.url || card.link;
    }
    
    // 🔹 SECTION: "ALL ABOUT YOU"
    // 1️⃣ Explore Daily Horoscope - No login required (no changes)
    // 2️⃣ Kundli Reports and Remedies For You - Requires auth + kundali check
    if (sectionType === "all-about-you") {
      const cardTitle = card.title || "";
      
      // Explore Daily Horoscope - No auth required
      if (cardTitle.includes("Horoscope")) {
        // No changes - proceed directly
        if (redirectUrl) {
          navigate(redirectUrl);
        }
        return;
      }
      
      // Kundli Reports and Remedies For You - Requires auth + kundali
      if (cardTitle.includes("Kundli") || cardTitle.includes("Remedies")) {
        // Check authentication first
        if (!requireAuth()) return;
        
        // Check if kundali profile exists
        if (!profiles || profiles.length === 0) {
          toast.error("Please add a Kundali profile to proceed.");
          setShowSelectProfile(true);
          return;
        }
        
        // Proceed with navigation
        if (redirectUrl) {
          navigate(redirectUrl);
        }
        return;
      }
    }
    
    // 🔹 SECTION: "DISCOVER YOUR KUNDLI"
    // All four cards: Vedic Kundli, Dasha, Ashtakvarga Chart, KP Chart
    // Requires auth + kundali check
    const kundliCards = ["Vedic Kundli", "Vedic Kundali", "Dasha", "Ashtakvarga Chart", "Ashtakvarga", "KP Chart", "KP"];
    if (kundliCards.includes(card.title)) {
      // Check authentication first
      if (!requireAuth()) return;
      
      // Check if kundali profile exists
      if (!profiles || profiles.length === 0) {
        toast.error("Please add a Kundali profile to proceed.");
        setShowSelectProfile(true);
        return;
      }
      
      // Proceed with navigation (existing logic below will handle profile data)
    }
    
    // 🔹 SECTION: "EXPLORE YOUR DESTINY"
    // 1️⃣ Tarot - No login required (no changes)
    // 2️⃣ Numerology - Requires auth + kundali check
    // 3️⃣ Gemstone - No login required (no changes)
    if (card.title === "Numerology") {
      // Check authentication first
      if (!requireAuth()) return;
      
      // Check if kundali profile exists
      if (!profiles || profiles.length === 0) {
        toast.error("Please add a Kundali profile to proceed.");
        setShowSelectProfile(true);
        return;
      }
      
      // Proceed with navigation
      if (redirectUrl) {
        navigate(redirectUrl);
      }
      return;
    }
    
    // Tarot and Gemstone - No auth required (no changes)
    if (card.title === "Tarot" || card.title === "Gemstones" || card.title === "Gemstone") {
      // No changes - proceed directly
      if (redirectUrl) {
        navigate(redirectUrl);
      }
      return;
    }
    
    // OLD LOGIC (kept for reference and other cards):
    // Special handling for Kundli card - pass selected profile if needed
    const needsProfile = (sectionType === "all-about-you" && card.slug) 
      ? requiresProfileData(card.slug) 
      : redirectUrl?.includes('/kundli');
    
    if (needsProfile && selectedProfile) {
      // Convert profile data to the format expected by formSlice
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      
      const meridiem = selectedProfile.hour >= 12 ? "PM" : "AM";
      const hour12 =
        selectedProfile.hour > 12
          ? selectedProfile.hour - 12
          : selectedProfile.hour === 0
            ? 12
            : selectedProfile.hour;

      const profilePayload = {
        name: selectedProfile.name,
        gender:
          selectedProfile.gender === "male"
            ? "Male"
            : selectedProfile.gender === "female"
              ? "Female"
              : "Others",
        day: String(selectedProfile.day),
        month: months[selectedProfile.month - 1],
        year: String(selectedProfile.year),
        hour: String(hour12),
        minute: String(selectedProfile.min),
        meridiem,
        birthPlace: selectedProfile.place,
        latitude: selectedProfile.lat,
        longitude: selectedProfile.lon,
      };
      
      // Dispatch setForm action
      dispatch(setForm(profilePayload));
    }
    
    // Navigate to the URL
    if (redirectUrl) {
      navigate(redirectUrl);
    } else {
      console.warn(`No route found for card:`, card);
    }
  };

  // Show loading state
  if (isLoadingExplore) {
    return (
      <div className={styles.explorePage}>
        <div className={styles.headerWrap}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <ChevronLeft size={24} />
            </button>
            <div className={styles.profileSelector}>
              <span className={styles.selectLabel}>Select Profile</span>
              <div className={styles.profileName}>
                {selectedProfile ? selectedProfile.name : "Select Profile"}
              </div>
            </div>
            <button className={styles.editButton}>
              <Edit size={20} />
            </button>
          </div>
        </div>
        <PrimaryLoader />
      </div>
    );
  }

  return (
    <div className={styles.explorePage}>
      {/* Header */}
      <div className={styles.headerWrap}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div 
          className={styles.profileSelector}
          onClick={() => setShowSelectProfile(true)}
        >
          <span className={styles.selectLabel}>Select Profile</span>
          <div className={styles.profileName}>
            {selectedProfile ? selectedProfile.name : "Select Profile"}
            <ChevronRight size={20} className={styles.dropdownIcon} />
          </div>
        </div>
        <button className={styles.editButton}>
          <Edit size={20} />
        </button>
      </div>
    </div>
      {/* Main Content */}
      <div className={styles.content}>
        {/* Render sections dynamically based on API data */}
        {Array.isArray(exploreSections) && exploreSections.map((section, index) => {
          return renderSection(section, index);
        })}
      </div>

      {/* Profile Manager - Handles all profile operations */}
      <ProfileManager
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        onProfileSelect={handleSelectProfile}
        selectedProfileId={selectedProfile?._id}
        title="Select Profile"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />
    </div>
  );
};

export default Explore;
