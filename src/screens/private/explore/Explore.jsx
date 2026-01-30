import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ChevronLeft, Edit, ChevronRight } from "lucide-react";
import styles from "./Explore.module.scss";
import ProfileListingModal from "../../../component/UI/Profile/ProfileListingModal";
import AddProfileModal from "../../../component/UI/Profile/AddProfileModal";
import { 
  useGetAllKundlisQuery,
  useCreateKundliMutation 
} from "../../../services/appServices/kundliServicesNew";
import { useGetExplorePageDataQuery } from "../../../redux/api/explore/exploreApi";
import { setForm } from "../../../redux/kundliform/formSlice";
import { Toast } from "../../../component";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";

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

const Explore = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // API Hooks
  const { data, isLoading, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  
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

  const handleAddProfile = () => {
    setShowSelectProfile(false);
    setShowAddProfile(true);
  };

  const handleSubmitProfile = async (formData) => {
    try {
      const dateObj = new Date(formData.birthDate);
      const timeObj = formData.birthTime ? formData.birthTime.split(":") : ["12", "0"];

      const payload = {
        name: formData.name,
        gender: formData.identity.toLowerCase(),
        relation: formData.relation,
        day: dateObj.getDate(),
        month: dateObj.getMonth() + 1,
        year: dateObj.getFullYear(),
        hour: formData.unknownBirthTime ? 12 : parseInt(timeObj[0]),
        min: formData.unknownBirthTime ? 0 : parseInt(timeObj[1]),
        second: 0,
        place: formData.birthPlace,
        lat: parseFloat(formData.latitude) || 0,
        lon: parseFloat(formData.longitude) || 0,
        tzone: 5.5,
      };

      const result = await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");
      setShowAddProfile(false);
      refetch();

      // Select the newly created profile
      if (result?.data) {
        setSelectedProfile(result.data);
      }
    } catch (err) {
      console.error("Error creating profile:", err);
      Toast.error(err?.data?.message || "Failed to add profile");
    }
  };

  // Helper function to get section data by display_type
  const getSectionByType = (type) => {
    return exploreSections.find(section => section.display_type === type);
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

  const handleCardClick = (card) => {
    // Since API doesn't return redirect_url, we'll use title to determine navigation
    // Map card titles to their routes
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
    
    const redirectUrl = titleToRouteMap[card.title] || card.redirect_url || card.redirectUrl || card.url || card.link;
    
    // Special handling for Kundli card - pass selected profile
    if (redirectUrl?.includes('/kundli') && selectedProfile) {
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
    }
  };

  // Show loading state
  if (isLoadingExplore) {
    return (
      <div className={styles.explorePage}>
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
        <PrimaryLoader />
      </div>
    );
  }

  return (
    <div className={styles.explorePage}>
      {/* Header */}
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

      {/* Main Content */}
      <div className={styles.content}>
        {/* Render sections dynamically based on API data */}
        {Array.isArray(exploreSections) && exploreSections.map((section, index) => {
          const sectionContent = Array.isArray(section.content) ? section.content : [];

          // Render "all-about-you" section
          if (section.display_type === "all-about-you") {
            return (
              <section key={index} className={styles.section}>
                <h1 className={styles.mainTitle}>{section.title || "All About You"}</h1>
                <p className={styles.subtitle}>
                  {section.description || "An ever growing library on the story of you"}
                </p>

                <div className={styles.topCardsGrid}>
                  {sectionContent.slice(0, 3).map((card, idx) => (
                    <div
                      key={idx}
                      className={styles.topCard}
                      style={{ backgroundColor: card.bg_color || "#E56329" }}
                      onClick={() => handleCardClick(card)}
                    >
                      <h3 className={styles.cardTitle}>{card.title}</h3>
                      <img
                        src={card.imageUrl || defaultImages.horoscope}
                        alt={card.title}
                        className={styles.cardIcon}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // Render "discover-your-kundli" section
          if (section.display_type === "discover-your-kundli") {
            return (
              <section key={index} className={styles.section}>
                <div className={styles.kundliSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      {section.title?.toUpperCase() || "DISCOVER YOUR KUNDLI"}
                    </h2>
                    <ChevronRight size={24} className={styles.sectionArrow} />
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
                            src={card.imageUrl || defaultImages.vedic}
                            alt={card.title}
                            className={styles.chartImage}
                          />
                        </div>
                        <div className={styles.kundliCardContent}>
                          <h3 className={styles.kundliCardTitle}>{card.title}</h3>
                          <ChevronRight size={20} className={styles.cardArrow} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // Render "explore-your-destiny" section
          if (section.display_type === "explore-your-destiny") {
            return (
              <section key={index} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {section.title?.toUpperCase() || "EXPLORE YOUR DESTINY"}
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
                        <p className={styles.destinyCardSubtitle}>{card.description}</p>
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

                {/* Gemstones Banner - if exists in content */}
                {sectionContent.find(c => c.title?.toLowerCase().includes('gemstone')) && (
                  <div className={styles.gemstonesBanner}>
                    <div className={styles.gemstonesContent}>
                      <h3 className={styles.gemstonesTitle}>Gemstones</h3>
                      <p className={styles.gemstonesText}>
                        Smart recommendations aligned with your birth chart
                      </p>
                    </div>
                    <img
                      src={remediesImg}
                      alt="Gemstones"
                      className={styles.gemstonesIcon}
                    />
                  </div>
                )}
              </section>
            );
          }

          // Render "blog" section
          if (section.display_type === "blog") {
            return (
              <section key={index} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {section.title?.toUpperCase() || "EXPLORE BLOGS"}
                  </h2>
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
                          src={blog.imageUrl || defaultImages.news}
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

          // Render "news" section
          if (section.display_type === "news") {
            return (
              <section key={index} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {section.title?.toUpperCase() || "IN THE NEWS"}
                  </h2>
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
                          src={news.imageUrl || defaultImages.news}
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

          // Render matchmaking banner if exists
          if (section.display_type === "matchmaking") {
            const matchmakingData = sectionContent[0];
            return (
              <div key={index} className={styles.matchmakingBanner}>
                <div className={styles.matchmakingContent}>
                  <h3 className={styles.matchmakingTitle}>
                    {matchmakingData?.title || "Matchmaking"}
                  </h3>
                  <p className={styles.matchmakingText}>
                    {matchmakingData?.description || "Measures emotional alignment and long-term compatibility"}
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

          return null;
        })}
      </div>

      {/* Select Profile Modal */}
      <ProfileListingModal
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        profiles={profiles}
        selectedProfileId={selectedProfile?._id}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        title="Select Profile"
        showAddButton={true}
        showDeleteButton={false}
        emptyMessage="No profiles found. Add a profile to get started."
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfile}
        onClose={() => setShowAddProfile(false)}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
        showProfileListing={false}
      />
    </div>
  );
};

export default Explore;
