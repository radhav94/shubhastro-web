import styles from "./HomeV2.module.scss";
import { AppIcons } from "../../../utils/appImages";
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserFromStorage } from "../../../utils/authStorage";
import { Toast } from "../../../component";
import { useGetAiSuitesQuery, useGetNewHomeDetailsQuery } from "../../../services/appServices/homeServices";
import { useGetBlogQuery } from "../../../services/appServices/blogService";
import { useGetCurrentMahadashaFullQuery } from "../../../redux/api/kundli/dashaApi";
import { useFetchAdvancePanchangQuery } from "../../../redux/api/panchang/panchangApi";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useAstrologerConnection } from "../home/hooks/useAstrologerConnection";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import PanditAIBubble from "../../../component/panditAI/PanditAIBubble";

// Lazy-load below-the-fold components
const ProfileModals = lazy(() => import("../../private/kundli/components/ProfileModals"));
const EmergencySessionModal = lazy(() => import("../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal"));
const AstrologersSection = lazy(() => import("../home/components/AstrologersSection"));
const BlogsSection = lazy(() => import("../home/components/BlogsSection"));
const MobileAppModal = lazy(() => import("../../private/aiwow/components/MobileAppModal"));
const MySessionsSection = lazy(() => import("./MySessionsSection"));
const AgenticCalendarV2 = lazy(() => import("./AgenticCalendarV2"));

// Left card images
import kundliImg from "../../../assets/images/home-hero-kundli.png";
import astrologerImg from "../../../assets/images/home-hero-astrologer.png";
import horoscopeImg from "../../../assets/images/home-hero-horoscope.png";

// Hero BG
const heroBg = "https://shubhastroassets.s3.ap-south-1.amazonaws.com/images/1778659743-240854750.png";

// WOW icons
import vastuIcon from "../../../assets/aiwow/wow-vastu.svg";
import palmIcon from "../../../assets/aiwow/wow-palmistry.svg";
import faceIcon from "../../../assets/aiwow/wow-face.svg";
import signatureIcon from "../../../assets/aiwow/wow-signature.svg";

import astrologerMaleImg from "../../../assets/default-img/astrologer male_v.1.png";
import laalKitaabImg from "../../../assets/images/laal-kitaab.png";
import occultWorldImg from "../../../assets/images/occult-world.png";
import aiPanditMic from "../../../assets/images/ai-pandit-mic.png";
import avatar1 from "../../../assets/images/community-avatar-1.png";
import avatar2 from "../../../assets/images/community-avatar-2.png";
import avatar3 from "../../../assets/images/community-avatar-3.png";
import avatar4 from "../../../assets/images/community-avatar-4.png";
import avatar5 from "../../../assets/images/community-avatar-5.png";
import liveCommunityBg from "../../../assets/images/live-community-bg.png";
import sectionBg from "../../../assets/images/section-bg.png";

// Muhurat icons
import abhijitIcon from "../../../assets/images/Abhijit-Muhurat 1.png";
import rahuKaalIcon from "../../../assets/images/Crucial Muhurats.png";
import gulikaIcon from "../../../assets/images/Gulika-icon 1.png";
import yamakantaIcon from "../../../assets/images/Crucial Muhurats (1).png";

const HomeV2 = () => {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);
  const name = selectedKundli?.name?.split(" ")[0] || user?.firstName || "Guest";

  // Random online count: random 100-500, increments by 30-50 each refresh, resets when exceeds 500
  const [onlineCount] = useState(() => {
    const stored = sessionStorage.getItem("liveCommunityCount");
    if (stored) {
      const increment = Math.floor(Math.random() * 21) + 30; // +30 to +50
      const newCount = Number(stored) + increment;
      if (newCount > 500) {
        // Reset to a new random number between 100-500
        const reset = Math.floor(Math.random() * 401) + 100;
        sessionStorage.setItem("liveCommunityCount", reset);
        return reset;
      }
      sessionStorage.setItem("liveCommunityCount", newCount);
      return newCount;
    }
    const initial = Math.floor(Math.random() * 401) + 100;
    sessionStorage.setItem("liveCommunityCount", initial);
    return initial;
  });

  // Add body class for footer text override on this page only
  useEffect(() => {
    document.body.classList.add('home-v2-page');
    return () => document.body.classList.remove('home-v2-page');
  }, []);

  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [pendingConnectionType, setPendingConnectionType] = useState(null);

  // Fetch real home data for astrologers
  const { data: newHomeData } = useGetNewHomeDetailsQuery();
  const homeList = newHomeData?.data?.list;

  // API 2: AI Suites (WOW Suite icons) — all 3 sections
  const { data: aiSuitesData } = useGetAiSuitesQuery();
  const wowSections = useMemo(() => {
    const list = aiSuitesData?.data?.list || [];
    if (list.length > 0) return list;
    // Fallback while loading
    return [
      {
        title: "WOW SUITE",
        content: [
          { icon: vastuIcon, title: "AR Vastu\nScanner", slug: "ar-vastu-scanner" },
          { icon: palmIcon, title: "Ai Palmistry\nScanner", slug: "ai-palmistry" },
          { icon: faceIcon, title: "Astro Face\nReading", slug: "astro-face-reading" },
          { icon: signatureIcon, title: "AI Signature\nAnalysis", slug: "ai-signature" },
        ],
      },
    ];
  }, [aiSuitesData]);

  // Keep wowSuiteItems for the header title (first section)
  const wowSuiteItems = useMemo(() => ({
    title: wowSections[0]?.title || "WOW SUITE",
  }), [wowSections]);

  const [showMobileAppModal, setShowMobileAppModal] = useState(false);

  const handleWowCardClick = (item) => {
    if (!item.slug) return;
    if (item.slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      const authRequiredSlugs = [
        "ai-palmistry-scanner",
        "astro-face-reading",
        "signature-analysis",
        "clothes-colour-analysis",
        "gemstone-authenticity",
        "aura-photography",
      ];
      const path = authRequiredSlugs.includes(item.slug) ? `/${item.slug}` : `/aiwow/${item.slug}`;
      
      // Free features that don't require login
      const freeAccessSlugs = ["agentic-calendar"];
      
      // Require login for all protected features (camera-based and AI Wow)
      if (!freeAccessSlugs.includes(item.slug)) {
        const token = localStorage.getItem("shubhtalk_customer_token");
        if (!token) {
          localStorage.setItem("shubhtalk_redirect_after_login", path);
          window.location.href = "/login?skip=welcome";
          return;
        }
      }
      
      navigate(path);
    }
  };


  // API 1: Current Mahadasha — use selected kundli profile
  const selectedProfile = useSelector(s => s.aiwow?.selectedKundliProfile);
  const kundliParams = useMemo(() => {
    if (!selectedProfile) return null;
    return {
      dob: selectedProfile.dob,
      tob: selectedProfile.tob,
      lat: selectedProfile.lat,
      lon: selectedProfile.lon,
      tz: selectedProfile.tz || 5.5,
      lang: "en",
    };
  }, [selectedProfile]);

  const { data: mahadashaData } = useGetCurrentMahadashaFullQuery(kundliParams, {
    skip: !kundliParams,
  });
  const currentMahadasha = mahadashaData?.response?.mahadasha?.find(m => {
    const now = Date.now();
    return new Date(m.start).getTime() <= now && new Date(m.end).getTime() >= now;
  });

  // Extract astrologer section from home API — slug: top-rated-astrologer
  const astrologerSection = useMemo(() => {
    return homeList?.find(s => s.slug === "top-rated-astrologer");
  }, [homeList]);
  const astrologers = astrologerSection?.content || [];

  // Live muhurat data from panchang API
  const panchangPayload = useMemo(() => {
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    return { day: pad(now.getDate()), month: pad(now.getMonth() + 1), year: now.getFullYear(), hour: pad(now.getHours()), min: pad(now.getMinutes()), lat: 19.132, lon: 72.342, tzone: 5.5 };
  }, []);
  const { data: panchangData } = useFetchAdvancePanchangQuery(panchangPayload);
  const panchangResponse = panchangData?.response;
  const muhurats = useMemo(() => {
    if (!panchangResponse) return [
      { name: "Abhijit Muhurat", start: "—", end: "—" },
      { name: "Rahu Kaal", start: "—", end: "—" },
      { name: "Gulika Kaal", start: "—", end: "—" },
      { name: "Yamakanta Kaal", start: "—", end: "—" },
    ];
    const fmt = (t) => {
      const val = t?.trim();
      if (!val) return "—";
      // Remove seconds as we are getting from API (e.g. "12:14:20 PM" → "12:14 PM")
      return val.replace(/(\d{1,2}:\d{2}):\d{2}/, "$1");
    };
    return [
      { name: "Abhijit Muhurat", start: fmt(panchangResponse?.advanced_details?.abhijit_muhurta?.start), end: fmt(panchangResponse?.advanced_details?.abhijit_muhurta?.end) },
      { name: "Rahu Kaal", start: fmt(panchangResponse?.rahukaal?.split("to")[0]), end: fmt(panchangResponse?.rahukaal?.split("to")[1]) },
      { name: "Gulika Kaal", start: fmt(panchangResponse?.gulika?.split("to")[0]), end: fmt(panchangResponse?.gulika?.split("to")[1]) },
      { name: "Yamakanta Kaal", start: fmt(panchangResponse?.yamakanta?.split("to")[0]), end: fmt(panchangResponse?.yamakanta?.split("to")[1]) },
    ];
  }, [panchangResponse]);
  const blogSection = useMemo(() => {
    return homeList?.find(s => s.display_type === "blog");
  }, [homeList]);

  // Fetch blogs from separate API
  const { data: blogApiData } = useGetBlogQuery({ page: 1, limit: 6 });
  const blogList = blogApiData?.data?.blogs || blogApiData?.data || [];

  // Extract ai-powered-astrology hero section
  const aiPoweredSection = useMemo(() => {
    return homeList?.find(s => s.display_type === "ai-powered-astrology");
  }, [homeList]);

  // Extract ai-services section (feature cards)
  const aiServicesSection = useMemo(() => {
    return homeList?.find(s => s.slug === "ai-services");
  }, [homeList]);
  const aiServicesItems = aiServicesSection?.content || [];

  // Extract quick-link-section
  const quickLinkItems = useMemo(() => {
    return homeList?.find(s => s.slug === "quick-link-section")?.content || [];
  }, [homeList]);

  // Quick link carousel tracking
  useEffect(() => {
    const el = document.getElementById('quickGridRow');
    if (!el) return;
    return () => {};
  }, [quickLinkItems]);  // Extract complementary services (left cards)
  const complementaryServices = useMemo(() => {
    const apiData = homeList?.find(s => s.slug === "complementary-services")?.content;
    if (apiData?.length > 0) return apiData;
    // Fallback — show immediately while API loads
    return [
      { title: "Generate My Kundli",      slug: "free-kundli",          description: "Get your free birth chart", image_url: kundliImg },
      { title: "Talk to an Astrologer",   slug: "talk-to-astrologer",   description: "Connect with experts",      image_url: astrologerImg },
      { title: "Explore Horoscope",       slug: "daily-horoscope",      description: "Daily predictions",         image_url: horoscopeImg },
    ];
  }, [homeList]);

  // Extract astrologers by category
  const categoriesSection = useMemo(() => {
    return homeList?.find(s => s.display_type === "astrologers-by-category");
  }, [homeList]);
  const categoriesData = categoriesSection?.content || [];

  // Extract discover more
  const discoverMoreSection = useMemo(() => {
    return homeList?.find(s => s.display_type === "discover-more");
  }, [homeList]);
  const discoverMoreData = discoverMoreSection?.content || [];

  // Extract muhurat section
  const muhuratSection = useMemo(() => {
    return homeList?.find(s => s.slug === "todays-muharat");
  }, [homeList]);

  // Extract live tracking stats
  const liveTrackingSection = useMemo(() => {
    return homeList?.find(s => s.slug === "live-tracking" || s.slug === "total-count");
  }, [homeList]);

  const liveTrackingCounts = liveTrackingSection?.content?.[0] || {};

  // Extract connect-astrologer CTA section
  const connectSection = useMemo(() => {
    return homeList?.find(s => s.slug === "connect-astrologer");
  }, [homeList]);

  // Extract popular astrologers
  const popularAstrologers = useMemo(() => {
    return homeList?.find(s => s.slug === "popular-astrologers")?.content || [];
  }, [homeList]);

  const { profiles, isCreating, showAddProfile, showEditProfile, formData, editFormData,
    setShowAddProfile, setShowEditProfile, setFormData, setEditFormData,
    handleAddProfile, handleSubmitProfile, handleSubmitEditProfile, formatProfileDisplay,
  } = useProfileManager();

  const { handleChatStart, handleCallStart, handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal, setOpenModal: hookSetOpenModal,
    selectedAstrologer: hookSelectedAstrologer, activeCallAstroRef, hasKundli, kundliRef,
  } = useAstrologerConnect();

  const { WaitingList, callWaitingList, connectionType, localSelectedProfile,
    setLocalSelectedProfile, resetCallState, setSelectedAstrologer: setAstrologerRef,
  } = useAstrologerConnection(activeCallAstroRef, kundliRef.current);

  const handleProfileManagerStartCall = (selectedProfile) => {
    if (selectedAstrologer && pendingConnectionType) {
      if (pendingConnectionType === "chat") handleChatStart(selectedAstrologer);
      else handleCallStart(selectedAstrologer, "audio");
      setPendingConnectionType(null);
    }
  };

  const handleConnectClick = async (astrologer, connType, isEmergency = false) => {
    if (!requireAuth()) return;
    if (WaitingList || callWaitingList) {
      Toast.error("You are already waiting for an astrologer. Please cancel the current request first.");
      return;
    }
    setSelectedAstrologer(astrologer);
    setAstrologerRef(astrologer);
    if (hasKundli) {
      let result;
      if (connType === "chat") result = await handleChatStart(astrologer, true, isEmergency);
      else result = await handleCallStart(astrologer, "audio", isEmergency);
      if (result?.emergencyAvailable) { setShowEmergencyModal(true); return; }
    } else {
      setPendingConnectionType(connType);
      hookSetOpenModal(prev => ({ ...prev, kundli: true }));
    }
  };

  return (
    <>
    <div className={styles.page}>
      <section className={styles.heroRow}>
        {/* LEFT — Quick Action Cards + Laal Kitaab */}
        <div className={styles.leftCards}>
          {/* Top 3 quick cards */}
          {complementaryServices.map((card, i) => {
            const slugPaths = {
              "free-kundli": "/kundli",
              "talk-to-astrologer": "/chat-to-astrologer",
              "daily-horoscope": "/daily-horoscope",
            };
            const path = slugPaths[card.slug] || "/";
            return (
              <div key={i} className={styles.qCard} onClick={() => navigate(path)}>
                <div className={styles.qText}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <div className={styles.qImgWrap}>
                  <div className={styles.qImgGlow} />
                  <img src={card.image_url || card.icon} alt={card.title} loading="eager" fetchPriority="high" />
                </div>
              </div>
            );
          })}

          {/* Laal Kitaab — special card at bottom of left col (desktop only) */}
          <div
            className={`${styles.qCardLaal}`}
            onClick={() => navigate('/laal-kitab')}
          >
            <div className={styles.laalKitaabLeftCh}>
              <span className={styles.featureTag}>New</span>
              <h3>{aiServicesItems[0]?.display_title || aiServicesItems[0]?.title || "Laal Kitaab"}</h3>
              <p>{aiServicesItems[0]?.description || aiServicesItems[0]?.short_description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}</p>
              <button className={styles.featureCta}>Explore Laal Kitaab &gt;</button>
            </div>
            <img
              src={aiServicesItems[0]?.image_url_web || aiServicesItems[0]?.icon || laalKitaabImg}
              alt="Laal Kitaab"
              className={styles.laalKitaabImgLeft}
              loading="lazy"
            />
          </div>
        </div>

        {/* CENTER — Hero + WOW + 2 feature cards */}
        <div className={styles.center}>
          <div className={styles.centerCard}>
            {/* Hero part */}
            <div className={styles.heroBanner}>
              <div className={styles.heroContent}>
                <p className={styles.greeting} key={`greeting-${name}`}>Hello, {name}! 👋</p>
                <h1>
                  {aiPoweredSection?.title
                    ? <>{aiPoweredSection.title.replace(" AI", "")} <span className={styles.ai}>AI</span></>
                    : <>Experience Astrology<br />Powered by <span className={styles.ai}>AI</span></>
                  }
                </h1>
                {/* <p className={styles.heroDesc}>
                  {aiPoweredSection?.description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
                </p> */}
                {currentMahadasha && (
                  <div className={styles.mahadashaTag}>
                    🪐 Current Mahadasha: <strong>{currentMahadasha.name}</strong>
                  </div>
                )}
              </div>
              <div className={styles.heroBgImg}>
                <div className={styles.heroBgGlow}></div>
                <img src={heroBg} alt="" loading="eager" fetchPriority="high" width="350" height="350" decoding="async" />
              </div>
            </div>

            {/* WOW Suite */}
            <div className={styles.wowInner}>
              <div className={styles.wowGlow} />
              <div className={styles.wowHeader}>
                <div className={`${styles.titleWithBottomDevider}`}>
                  <h4 className={styles.wowTitle}>{wowSuiteItems.title}</h4>
                  <div className={styles.BottomDevider}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                      <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                    </svg>
                  </div>
                </div>
                {/* <button className={styles.wowViewMore} onClick={() => navigate('/ai-wow')}>View More &rsaquo;</button> */}
              </div>

              {/* All sections from API — continuous grid */}
              <div className={styles.wowGrid}>
                {wowSections.flatMap((section, si) =>
                  (section.content || []).map((item, i) => (
                    <div
                      key={`${si}-${i}`}
                      className={styles.wowCard}
                      onClick={() => handleWowCardClick(item)}
                      style={{ cursor: item.slug ? 'pointer' : 'default' }}
                    >
                      <div className={styles.wowIconBox}>
                        <img src={item.icon || item.iconUrl || item.icon_url} alt={item.title} loading="lazy" />
                      </div>
                      <span>{item.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom 2 feature cards — Occult World + AI Pandit — outside centerCard (desktop only) */}
          <div className={`${styles.centerFeatureRow} ${styles.desktopOnly}`}>
            {/* Occult World */}
            <div className={`${styles.centerFeatureCard} ${styles.occultWorld}`} onClick={() => navigate('/occult')} style={{ cursor: 'pointer' }}>
              <div className={styles.occultEllipse} />
              <span className={styles.featureTag}>New</span>
              <div className={styles.fcTop}>
                <h3>{aiServicesItems[1]?.display_title || aiServicesItems[1]?.title || "Occult World"}</h3>
                <p>{aiServicesItems[1]?.description || aiServicesItems[1]?.short_description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}</p>
              </div>
              <button className={styles.fcCtaLight} onClick={() => navigate('/occult')}>Explore Occult &gt;</button>
              {(aiServicesItems[1]?.image_url_web || aiServicesItems[1]?.icon || occultWorldImg) && (
                <img src={aiServicesItems[1]?.image_url_web || aiServicesItems[1]?.icon || occultWorldImg} alt="Occult World" className={styles.fcCardImg} loading="lazy" />
              )}
            </div>

            {/* AI Pandit Voice */}
            <div className={`${styles.centerFeatureCard} ${styles.aiPanditVoice}`} onClick={() => navigate('/pandit-ai-voice')} style={{ cursor: 'pointer' }}>
              <div className={styles.panditEllipse} />
              <span className={styles.featureTag}>New</span>
              <div className={styles.fcTop}>
                <h3>{aiServicesItems[2]?.display_title || aiServicesItems[2]?.title || "AI Pandit (Voice)"}</h3>
                <p>{aiServicesItems[2]?.description || aiServicesItems[2]?.short_description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}</p>
              </div>
              <button className={styles.panditTalkBtn}>Talk Now &rsaquo;</button>
              {/* Image from API or fallback mic UI */}
              {(aiServicesItems[2]?.image_url_web || aiServicesItems[2]?.icon || aiPanditMic) ? (
                <img
                  src={aiServicesItems[2]?.image_url_web || aiServicesItems[2]?.icon || aiPanditMic}
                  alt="AI Pandit"
                  className={styles.fcCardImg}
                  loading="lazy"
                />
              ) : (
                <div className={styles.panditMicWrap}>
                  <div className={styles.panditWave} />
                  <div className={styles.panditMicCircle}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="#fff"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="19" x2="12" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="23" x2="16" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Crucial Muhurats + Live Community (separate cards) */}
        <div className={styles.rightCol}>
          {/* Crucial Muhurats box */}
          <div className={styles.rightPanel}>
            <h4>{ muhuratSection?.title || "CRUCIAL MUHURATS"}</h4>
            <div className={styles.muhuratGrid}>
              {muhurats.map((m, i) => {
                const iconBgs = ["#FEF0E4", "#F4ECFB", "#E9F2EF", "#EBF2FB"];
                const muhuratIcons = [abhijitIcon, rahuKaalIcon, gulikaIcon, yamakantaIcon];
                return (
                  <div key={i} className={styles.muhuratItem}>
                    <div className={styles.muhuratTop}>
                      <div className={styles.muhuratIcon}>
                        <img src={muhuratIcons[i % 4]} alt={m.name} width="40" height="40" loading="lazy" />
                      </div>
                      <h5>{m.name}</h5>
                    </div>
                    <p className={styles.muhuratTime}>{m.start} – {m.end}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Community card — outside Muhurats box (desktop only) */}
          <div className={`${styles.liveCommunityCard} ${styles.desktopOnly}`} onClick={() => navigate('/live')}>
            <span className={styles.featureTag}>New</span>
            <h4 className={styles.liveCommunityTitle}>
              {aiServicesItems[3]?.display_title || aiServicesItems[3]?.title || "ShubhAsrto Live Community"}
            </h4>
            <p className={styles.liveCommunityDesc}>
              {aiServicesItems[3]?.description || aiServicesItems[3]?.short_description || "Lorem Ipsum is simply dummy text of"}
            </p>
            <button className={styles.liveCommunityBtn}>Join Live Chat &rsaquo;</button>
            {/* Circular avatar cluster */}
            <div className={styles.avatarCluster}>
              <div className={styles.avatarClusterInner}>
                <img src={avatar1} alt="" className={`${styles.clusterAvatar} ${styles.ca1}`} loading="lazy" />
                <img src={avatar2} alt="" className={`${styles.clusterAvatar} ${styles.ca2}`} loading="lazy" />
                <img src={avatar3} alt="" className={`${styles.clusterAvatar} ${styles.ca3}`} loading="lazy" />
                <img src={avatar4} alt="" className={`${styles.clusterAvatar} ${styles.ca4}`} loading="lazy" />
                <img src={avatar5} alt="" className={`${styles.clusterAvatar} ${styles.ca5}`} loading="lazy" />
                <div className={`${styles.clusterAvatar} ${styles.ca6} ${styles.clusterCount}`}>
                  <span>+{onlineCount}</span>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MOBILE ONLY — AI Services 2×2 Grid ═══ */}
      {aiServicesItems.length > 0 && (
      <section className={styles.mobileAiGrid}>
        <div className={`${styles.titleWithBottomDevider}`}>
          <h4 className={styles.wowTitle}>{aiServicesSection?.title || "AI SERVICES"}</h4>
          <div className={styles.BottomDevider}>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
            </svg>
          </div>
        </div>
        <div className={styles.mobileAiGridRow}>
          {/* Laal Kitaab */}
          <div className={`${styles.mobileAiCard} ${styles.laalKitaab}`} onClick={() => navigate('/laal-kitab')}>
            <span className={styles.featureTag}>New</span>
            <h3>{aiServicesItems[0]?.display_title || aiServicesItems[0]?.title || "Laal Kitaab"}</h3>
            <button className={styles.featureCta}>Explore Laal Kitaab &gt;</button>
            <img src={aiServicesItems[0]?.image_url_web || aiServicesItems[0]?.icon || laalKitaabImg} alt="Laal Kitaab" className={styles.mobileAiCardImg} loading="lazy" />
          </div>
          {/* Occult World */}
          <div className={`${styles.mobileAiCard} ${styles.occultWorld}`} onClick={() => navigate('/occult')}>
            <div className={styles.occultEllipse} />
            <span className={styles.featureTag}>New</span>
            <h3>{aiServicesItems[1]?.display_title || aiServicesItems[1]?.title || "Occult World"}</h3>
            <button className={styles.fcCtaLight}>Explore Occult &gt;</button>
            {(aiServicesItems[1]?.image_url_web || aiServicesItems[1]?.icon || occultWorldImg) && (
              <img src={aiServicesItems[1]?.image_url_web || aiServicesItems[1]?.icon || occultWorldImg} alt="Occult World" className={styles.mobileAiCardImg} loading="lazy" />
            )}
          </div>
          {/* AI Pandit */}
          <div className={`${styles.mobileAiCard} ${styles.aiPanditVoice}`} onClick={() => navigate('/pandit-ai-voice')}>
            <span className={styles.featureTag}>New</span>
            <h3>{aiServicesItems[2]?.display_title || aiServicesItems[2]?.title || "AI Pandit (Voice)"}</h3>
            <button className={styles.panditTalkBtn}>Talk Now &rsaquo;</button>
            {(aiServicesItems[2]?.image_url_web || aiServicesItems[2]?.icon || aiPanditMic) ? (
              <img src={aiServicesItems[2]?.image_url_web || aiServicesItems[2]?.icon || aiPanditMic} alt="AI Pandit" className={styles.mobileAiCardImg} loading="lazy" />
            ) : (
              <div className={styles.panditMicWrap}>
                <div className={styles.panditWave} />
                <div className={styles.panditMicCircle}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="#fff"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="19" x2="12" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="23" x2="16" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
          {/* Live Community */}
          <div className={`${styles.mobileAiCard}`} onClick={() => navigate('/live')}>
            <span className={styles.featureTag}>New</span>
            <h3>{aiServicesItems[3]?.display_title || aiServicesItems[3]?.title || "ShubhAsrto Live Community"}</h3>
            <button className={styles.liveCommunityBtn}>Join Live Now &rsaquo;</button>
            <div className={styles.liveCommunityAvatars}>
              {[avatar1, avatar2, avatar3, avatar4].map((av, i) => (
                <img key={i} src={av} alt="" className={styles.liveCommunityAvatarImg} loading="lazy" />
              ))}
              <span className={styles.liveCommunityCount}>+{onlineCount}<br/>Online</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ═══ SECTION 2 — Quick Actions Grid ═══ */}
      {quickLinkItems.length > 0 && (
      <section className={styles.quickGrid}>
        <div className={styles.quickGridHeader}>
          <div className={`${styles.titleWithBottomDevider}`}>
            <h4 className={styles.wowTitle}>{homeList?.find(s => s.slug === "quick-link-section")?.title || "QUICK LINKS"}</h4>
            <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.quickScrollWrap}>
          <button className={styles.quickArrow} onClick={() => {
            const el = document.getElementById('quickGridRow');
            if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
          }}>‹</button>

          <div className={styles.gridRow} id="quickGridRow">
            {quickLinkItems.map((a, i) => {
              const navFn = () => {
                if (a.is_internal === true || a.is_internal === "true") {
                  // Internal route — use redirect_url or slug as path
                  const path = a.redirect_url || a.slug;
                  if (path) navigate(path.startsWith('/') ? path : `/${path}`);
                } else if (a.redirect_url) {
                  // External URL
                  window.open(a.redirect_url, '_blank', 'noopener,noreferrer');
                } else {
                  // Fallback: use slug as internal route
                  const slug = a.slug || a.title?.toLowerCase().replace(/\s+/g, '-') || '';
                  if (slug.includes('horoscope'))                                    return navigate('/daily-horoscope');
                  if (slug.includes('dasha'))                                        return navigate('/kundli?tab=dasha');
                  if (slug.includes('sade-sati') || slug.includes('sade sati'))      return navigate('/shani-sade-sati-calculator');
                  if (slug.includes('numerology'))                                   return navigate('/numerology-calculator');
                  if (slug.includes('remed'))                                        return navigate('/kundli?tab=free-report&subtab=remedies');
                  if (slug.includes('birth') || slug.includes('kundli'))             return navigate('/kundli');
                  if (slug.includes('match'))                                        return navigate('/match-making');
                  if (slug.includes('session') || slug.includes('order'))            return navigate('/profile', { state: { activeTab: 'Order History' } });
                  if (slug.includes('talk') || slug.includes('consult') || slug.includes('astrologer')) return navigate('/chat-to-astrologer');
                  if (slug) navigate(`/${slug}`);
                }
              };
              return (
                <div key={i} className={styles.gridItem} onClick={navFn} style={{ cursor: 'pointer' }}>
                  <div className={styles.gridIconBox}>
                    {(a.image_url_web || a.image_url || a.icon) && (
                      <img src={a.image_url_web || a.image_url || a.icon} alt={a.title} loading="lazy" />
                    )}
                  </div>
                  <span>{a.title}</span>
                </div>
              );
            })}
          </div>

          <button className={styles.quickArrow} onClick={() => {
            const el = document.getElementById('quickGridRow');
            if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
          }}>›</button>
        </div>

      </section>
      )}

      {/* ═══ SECTION 4 — Top Rated Astrologers ═══ */}
      {astrologers.length > 0 && (
      <section className={styles.astrologerSection} style={{ backgroundColor: `#FFE9E5`,paddingBottom:'1px',paddingTop:'16px',paddingRight:'0px'}}>
        <div className={styles.sectionHeader} style={{marginBottom:"0px"}}>
          <div className={styles.sectionTitleBlock}>
            <h2 className={styles.sectionTitle}>{astrologerSection?.title || "TOP RATED ASTROLOGERS FOR YOU"}</h2>
          </div>
          <button className={styles.viewAllBtn} style={{marginRight:"16px"}} onClick={() => navigate('/chat-to-astrologer')}>View All →</button>
        </div>
        <Suspense fallback={null}>
          <AstrologersSection
            title=""
            className={`${styles.astrologerCard1} ${styles.anotherClass}`}
            astrologers={astrologers}
            onConnect={handleConnectClick}
          />
        </Suspense>
      </section>
      )}

      {/* ═══ SECTION 5 — Explore by Category + Agentic Calendar + Discover More ═══ */}
      {(categoriesData.length > 0 || discoverMoreData.length > 0) && (
      <section className={styles.threeColSection}>

        {/* LEFT — Explore by Category */}
        <div className={styles.categoryBox}>
          <div className={`${styles.titleWithBottomDevider}`}>
            <h4 className={styles.wowTitle}>{categoriesSection?.title || "EXPLORE BY CATEGORY"}</h4>
            <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </div>
          </div>
          <div className={styles.catGrid}>
            {(categoriesData.length > 0 ? categoriesData : [
              { title: "Love &\nRelationship", slug: "love-relationships" },
              { title: "Career &\nBusiness", slug: "career-business" },
              { title: "Health &\nWellness", slug: "health-wellness" },
              { title: "Money &\nFinance", slug: "money-finance" },
              { title: "Marriage &\nFamily", slug: "marriage-family" },
              { title: "Child &\nEducation", slug: "child-education" },
            ]).map((c, i) => {
              const catColors = ["#FFF0"];
              return (
                <div key={i} className={styles.catItem} onClick={() => navigate('/chat-to-astrologer', { state: { selectedType: c.slug } })} style={{ cursor: 'pointer' }}>
                  <div
                    className={styles.catIconBox}
                    style={{
                      background: c.image_url
                        ? `url(${c.image_url}) center/100% no-repeat,${catColors[i % catColors.length]}`
                        : catColors[i % catColors.length],
                    }}
                  />
                  <span>{c.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER — Agentic Calendar */}
        <div className={styles.calendarBox}>
          <Suspense fallback={null}>
            <AgenticCalendarV2 styles={styles} />
          </Suspense>
        </div>

        {/* RIGHT — Discover More */}
        <div className={styles.discoverBox}>
          <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
            <h4 className={styles.wowTitle}>{discoverMoreSection?.title || "DISCOVER MORE"}</h4>
            <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </div>
          </div>
          <div className={styles.discoverGrid}>
            {(discoverMoreData.length > 0 ? discoverMoreData : [
              { title: "Vedic Kundli",    slug: "vedic-kundli",   redirect_url: "/kundli" },
              { title: "Numerology",      slug: "numerology",     redirect_url: "/numerology" },
              { title: "Tarot",           slug: "tarot",          redirect_url: "/tarot" },
              { title: "Match-making",    slug: "matchmaking",    redirect_url: "/match-making" },
            ]).map((item, i) => {
              const discoverBgs = ["#ffe4e400","#fff3e400","#e4eeff00","#f0e4ff00"];
              // Slug-based route map for API items
              const slugRoutes = {
                "vedic-kundli": "/kundli",
                "kundli": "/kundli",
                "numerology": "/numerology",
                "tarot": "/tarot",
                "tarot-reading": "/tarot",
                "matchmaking": "/match-making",
                "match-making": "/match-making",
                "kundli-matching": "/match-making",
                "panchang": "/panchang",
              };
              const route = item.redirect_url || slugRoutes[item.slug] || (item.slug ? `/${item.slug}` : null);
              return (
                <div
                  key={i}
                  className={styles.discoverItem}
                  onClick={() => route && navigate(route)}
                  style={{ cursor: route ? 'pointer' : 'default' }}
                >
                  <div
                    className={styles.discoverIconBox}
                    style={{
                      background: item.image_url
                        ? `url(${item.image_url}) center/100% no-repeat, ${discoverBgs[i % 4]}`
                        : discoverBgs[i % 4],
                    }}
                  />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>

      </section>
      )}

      {/* ═══ SECTION 5b — News / Blog ═══ */}
      {(blogSection?.content?.length > 0 || blogList.length > 0) && (
        <section className={styles.blogSection} style={{ paddingRight:'0px'}}>
          <Suspense fallback={null}>
            <BlogsSection
              blogData={blogSection?.content?.length > 0 ? blogSection.content : blogList}
              title={blogSection?.title || "NEWS / BLOGS"}
              showMore={true}
            />
          </Suspense>
        </section>
      )}

      {/* ═══ SECTION 6 — My Sessions ═══ */}
      <Suspense fallback={null}>
        <MySessionsSection
          userId={user?.id}
          navigate={navigate}
          styles={styles}
          astrologerMaleImg={astrologerMaleImg}
        />
      </Suspense>

      {/* ═══ SECTION 7 — Real Consultations (Live Tracking + CTA) ═══ */}
      <section className={styles.liveSection}>

        {/* Live Tracking badge */}
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          {liveTrackingSection?.quick_message || "LIVE TRACKING"}
        </div>

        {/* Heading */}
        <h2 className={styles.liveHeading}>
          {liveTrackingSection?.title || "Real People. Real Consultations. Right Now."}
        </h2>
        <p className={styles.liveSubtitle}>{liveTrackingSection?.description || "Live updates from ShubhAstro community"}</p>

        {/* 4 Stat Cards */}
        <div className={styles.liveStats}>
          {(liveTrackingSection?.content?.length > 0
            ? liveTrackingSection.content
            : [
                { count: 234, description: "users in active consultations" },
                { count: 47,  description: "Kundlis generated today" },
                { count: 8,   description: "Lal Kitab remedies tried tonight" },
                { count: 12,  description: "new chats started in the last hour" },
              ]
          ).map((s, i) => {
            const colors = ["#FEF0E4", "#F4ECFB", "#E9F2EF", "#EBF2FB"];
            return (
              <div key={i} className={styles.statCard}>
                <div className={styles.circleAndCount}>
                  {s.icon ? (
                    <img src={s.icon} alt="" className={styles.statIcon} loading="lazy" />
                  ) : (
                    <div className={styles.statCircle} />
                  )}
                  <span className={styles.statNum}>{(s.count ?? 0).toLocaleString()}</span>
                </div>
                {/* <div className={styles.statText}> */}
                  <span className={styles.statLabel}>{s.description}</span>
                {/* </div> */}
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className={styles.ctaBanner}>
          {/* Left */}
          <div className={styles.ctaLeft}>
            <div className={styles.ctaTag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f75801"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              {connectSection?.quick_message || "Don't Wait. Get Clarity Now."}
            </div>
            <h3 className={styles.ctaHeading}>{connectSection?.title || "Your Answers Are Waiting."}</h3>
            <p className={styles.ctaOrange}>{connectSection?.sub_title || "Connect with an Astrologer Now!"}</p>
            <p className={styles.ctaDesc}>{connectSection?.description || "Talk to verified astrologers and get clarity on love, career, health, finance and more."}</p>
            <div className={styles.ctaAvatarRow}>
              <div className={styles.ctaAvatars}>
                {[avatar1, avatar2, avatar3, avatar4].map((av, i) => (
                  <img key={i} src={av} alt="" className={styles.ctaAvatar} loading="lazy" />
                ))}
                <span className={styles.ctaAvatarCount}>50+</span>
              </div>
              <span className={styles.ctaOnline}>
                <span className={styles.ctaOnlineDot} />
                50+ Expert Astrologers Online
              </span>
            </div>
          </div>

          {/* Right */}
          <div className={styles.ctaRight}>
            <button className={styles.ctaBtnPrimary} onClick={() => navigate('/chat-to-astrologer')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M10.625 23.75H10C5 23.75 2.5 22.5 2.5 16.25V10C2.5 5 5 2.5 10 2.5H20C25 2.5 27.5 5 27.5 10V16.25C27.5 21.25 25 23.75 20 23.75H19.375C18.9875 23.75 18.6125 23.9375 18.375 24.25L16.5 26.75C15.675 27.85 14.325 27.85 13.5 26.75L11.625 24.25C11.425 23.975 10.9625 23.75 10.625 23.75Z" stroke="#FEFEFE" strokeWidth="1.8" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.75 10H21.25" stroke="#FEFEFE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.75 16.25H16.25" stroke="#FEFEFE" strokeWidth="1.77938" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {connectSection?.action_btn?.[0] || "Start Chat Consultation"}
            </button>
            <button className={styles.ctaBtnSecondary} onClick={() => navigate('/chat-to-astrologer')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M27.4625 22.9125C27.4625 23.3625 27.3625 23.825 27.15 24.275C26.9375 24.725 26.6625 25.15 26.3 25.55C25.6875 26.225 25.0125 26.7125 24.25 27.025C23.5 27.3375 22.6875 27.5 21.8125 27.5C20.5375 27.5 19.175 27.2 17.7375 26.5875C16.3 25.975 14.8625 25.15 13.4375 24.1125C12 23.0625 10.6375 21.9 9.3375 20.6125C8.05 19.3125 6.8875 17.95 5.85 16.525C4.825 15.1 4 13.675 3.4 12.2625C2.8 10.8375 2.5 9.475 2.5 8.175C2.5 7.325 2.65 6.5125 2.95 5.7625C3.25 5 3.725 4.3 4.3875 3.675C5.1875 2.8875 6.0625 2.5 6.9875 2.5C7.3375 2.5 7.6875 2.575 8 2.725C8.325 2.875 8.6125 3.1 8.8375 3.425L11.7375 7.5125C11.9625 7.825 12.125 8.1125 12.2375 8.3875C12.35 8.65 12.4125 8.9125 12.4125 9.15C12.4125 9.45 12.325 9.75 12.15 10.0375C11.9875 10.325 11.75 10.625 11.45 10.925L10.5 11.9125C10.3625 12.05 10.3 12.2125 10.3 12.4125C10.3 12.5125 10.3125 12.6 10.3375 12.7C10.375 12.8 10.4125 12.875 10.4375 12.95C10.6625 13.3625 11.05 13.9 11.6 14.55C12.1625 15.2 12.7625 15.8625 13.4125 16.525C14.0875 17.1875 14.7375 17.8 15.4 18.3625C16.05 18.9125 16.5875 19.2875 17.0125 19.5125C17.075 19.5375 17.15 19.575 17.2375 19.6125C17.3375 19.65 17.4375 19.6625 17.55 19.6625C17.7625 19.6625 17.925 19.5875 18.0625 19.45L19.0125 18.5125C19.325 18.2 19.625 17.9625 19.9125 17.8125C20.2 17.6375 20.4875 17.55 20.8 17.55C21.0375 17.55 21.2875 17.6 21.5625 17.7125C21.8375 17.825 22.125 17.9875 22.4375 18.2L26.575 21.1375C26.9 21.3625 27.125 21.625 27.2625 21.9375C27.3875 22.25 27.4625 22.5625 27.4625 22.9125Z" stroke="url(#paint0_linear_12974_46590)" strokeWidth="1.8" strokeMiterlimit="10"/>
                <path d="M19.375 7.5H25.625" stroke="url(#paint1_linear_12974_46590)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22.5 10.625V4.375" stroke="url(#paint2_linear_12974_46590)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="paint0_linear_12974_46590" x1="2.5" y1="15" x2="27.4625" y2="15" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/>
                    <stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear_12974_46590" x1="19.375" y1="8" x2="25.625" y2="8" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/>
                    <stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                  <linearGradient id="paint2_linear_12974_46590" x1="22.5" y1="7.5" x2="23.5" y2="7.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/>
                    <stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
              {connectSection?.action_btn?.[1] || "Connect with Astrologer"}
            </button>
            <div className={styles.ctaTrust}>
              {(connectSection?.tag_label || ["100% Secure", "Verified Experts", "Privacy Protected"]).map((label, i) => {
                const icons = [
                  <svg key="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <g clipPath="url(#clip0_12974_46595)">
                      <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM9 8V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9Z" fill="url(#paint0_linear_12974_46595)"/>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_12974_46595" x1="4" y1="11.5" x2="20" y2="11.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F75801"/>
                        <stop offset="1" stopColor="#D43400"/>
                      </linearGradient>
                      <clipPath id="clip0_12974_46595">
                        <rect width="24" height="24" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>,
                  <svg key="verified" xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 22 21" fill="none">
                    <path d="M22 10.5L19.56 7.71L19.9 4.02L16.29 3.2L14.4 0L11 1.46L7.6 0L5.71 3.19L2.1 4L2.44 7.7L0 10.5L2.44 13.29L2.1 16.99L5.71 17.81L7.6 21L11 19.53L14.4 20.99L16.29 17.8L19.9 16.98L19.56 13.29L22 10.5ZM8.38 14.51L6 12.11C5.61 11.72 5.61 11.09 6 10.7L6.07 10.63C6.46 10.24 7.1 10.24 7.49 10.63L9.1 12.25L14.25 7.09C14.64 6.7 15.28 6.7 15.67 7.09L15.74 7.16C16.13 7.55 16.13 8.18 15.74 8.57L9.82 14.51C9.41 14.9 8.78 14.9 8.38 14.51Z" fill="url(#paint0_linear_12974_46607)"/>
                    <defs>
                      <linearGradient id="paint0_linear_12974_46607" x1="0" y1="10.5" x2="22" y2="10.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F75801"/>
                        <stop offset="1" stopColor="#D43400"/>
                      </linearGradient>
                    </defs>
                  </svg>,
                  <svg key="shield" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <g clipPath="url(#clip0_12974_46610)">
                      <path d="M11.3 2.26007L5.3 4.51007C4.52 4.81007 4 5.55007 4 6.39007V11.0901C4 15.9201 7.13 20.4601 11.43 21.8401C11.8 21.9601 12.2 21.9601 12.57 21.8401C16.87 20.4601 20 15.9301 20 11.0901V6.39007C20 5.56007 19.48 4.81007 18.7 4.52007L12.7 2.27007C12.25 2.09007 11.75 2.09007 11.3 2.26007Z" fill="url(#paint0_linear_12974_46610)"/>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_12974_46610" x1="4" y1="12.0319" x2="20" y2="12.0319" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F75801"/>
                        <stop offset="1" stopColor="#D43400"/>
                      </linearGradient>
                      <clipPath id="clip0_12974_46610">
                        <rect width="24" height="24" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>,
                ];
                return (
                  <span key={i} className={styles.ctaTrustItem}>
                    {icons[i % 3]}
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </section>

      {/* ═══ SECTION 8 — Explore Blogs (removed — now in threeColSection) ═══ */}


    </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <ProfileModals
          profiles={profiles}
          isCreating={isCreating}
          showAddProfile={showAddProfile}
          showEditProfile={showEditProfile}
          formData={formData}
          editFormData={editFormData}
          setShowAddProfile={setShowAddProfile}
          setShowEditProfile={setShowEditProfile}
          setFormData={setFormData}
          setEditFormData={setEditFormData}
          handleAddProfile={handleAddProfile}
          handleSubmitProfile={handleSubmitProfile}
          handleSubmitEditProfile={handleSubmitEditProfile}
          formatProfileDisplay={formatProfileDisplay}
          openModal={hookOpenModal}
          setOpenModal={hookSetOpenModal}
          selectedAstrologer={hookSelectedAstrologer}
          localSelectedProfile={localSelectedProfile}
          setLocalSelectedProfile={setLocalSelectedProfile}
          onContinue={handleProfileManagerStartCall}
          connectionType={connectionType}
        />
        <EmergencySessionModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          astrologer={selectedAstrologer}
          onChatNow={(a) => handleConnectClick(a, "chat", true)}
          onCallNow={(a) => handleConnectClick(a, "audio", true)}
        />
        <MobileAppModal isOpen={showMobileAppModal} onClose={() => setShowMobileAppModal(false)} />
      </Suspense>
      <PanditAIBubble />
    </>
  );
};

export default HomeV2;
