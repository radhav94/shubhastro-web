import styles from "./HomeV2.module.scss";
import { AppIcons } from "../../../utils/appImages";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserFromStorage } from "../../../utils/authStorage";
import { Toast } from "../../../component";
import { useGetHomeDetailsQuery, useGetAiSuitesQuery, useGetNewHomeDetailsQuery } from "../../../services/appServices/homeServices";
import { useGetCurrentMahadashaFullQuery } from "../../../redux/api/kundli/dashaApi";
import { useFetchAdvancePanchangQuery } from "../../../redux/api/panchang/panchangApi";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useAstrologerConnection } from "../home/hooks/useAstrologerConnection";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import ProfileModals from "../../private/kundli/components/ProfileModals";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
import AstrologersSection from "../home/components/AstrologersSection";
import BlogsSection from "../home/components/BlogsSection";
import PanditAIBubble from "../../../component/panditAI/PanditAIBubble";
import MobileAppModal from "../../private/aiwow/components/MobileAppModal";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";

// Left card images
import kundliImg from "../../../assets/images/home-hero-kundli.png";
import astrologerImg from "../../../assets/images/home-hero-astrologer.png";
import horoscopeImg from "../../../assets/images/home-hero-horoscope.png";

// Hero BG
import heroBg from "../../../assets/images/home-hero-bg.png";

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

const HomeV2 = () => {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const name = user?.firstName || "Guest";

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

  // API 2: AI Suites (WOW Suite icons)
  const { data: aiSuitesData } = useGetAiSuitesQuery();
  const wowSuiteItems = useMemo(() => {
    const section = aiSuitesData?.data?.list?.find(s => s.display_type === "wow-suite");
    return section?.content || [];
  }, [aiSuitesData]);

  const [showMobileAppModal, setShowMobileAppModal] = useState(false);

  const handleWowCardClick = (item) => {
    if (!item.slug) return;
    if (item.slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      navigate(`/aiwow/${item.slug}`);
    }
  };
  const [wowIndex, setWowIndex] = useState(0);
  const wowScrollRef = useRef(null);
  const wowAllItems = useMemo(() => wowSuiteItems.length > 0 ? wowSuiteItems : [
    { icon: vastuIcon, title: "AR Vastu\nScanner" },
    { icon: palmIcon, title: "Ai Palmistry\nScanner" },
    { icon: faceIcon, title: "Astro Face\nReading" },
    { icon: signatureIcon, title: "AI Signature\nAnalysis" },
  ], [wowSuiteItems]);

  const scrollWow = (dir) => {
    const container = wowScrollRef.current;
    if (!container) return;
    const cardWidth = container.children[0]?.offsetWidth + 16; // card + gap
    const next = Math.max(0, Math.min(wowAllItems.length - 4, wowIndex + dir));
    setWowIndex(next);
    container.scrollTo({ left: next * cardWidth, behavior: 'smooth' });
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
    const fmt = (t) => t?.trim() || "—";
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

  // Extract ai-services section (feature cards)
  const aiServicesSection = useMemo(() => {
    return homeList?.find(s => s.slug === "ai-services");
  }, [homeList]);
  const aiServicesItems = aiServicesSection?.content || [];

  // Extract quick-link-section
  const quickLinkItems = useMemo(() => {
    return homeList?.find(s => s.slug === "quick-link-section")?.content || [];
  }, [homeList]);

  // Extract complementary services (left cards)
  const complementaryServices = useMemo(() => {
    return homeList?.find(s => s.slug === "complementary-services")?.content || [];
  }, [homeList]);

  // Extract astrologers by category
  const categoriesData = useMemo(() => {
    return homeList?.find(s => s.display_type === "astrologers-by-category")?.content || [];
  }, [homeList]);

  // Extract discover more
  const discoverMoreData = useMemo(() => {
    return homeList?.find(s => s.display_type === "discover-more")?.content || [];
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
        {/* LEFT — Quick Action Cards */}
        <div className={styles.leftCards}>
          {complementaryServices.map((card, i) => {
            const slugPaths = {
              "free-kundli": "/kundli",
              "talk-to-astrologer": "/chat-with-astrologers",
              "daily-horoscope": "/horoscopes/daily-horoscope",
            };
            const path = slugPaths[card.slug] || "/";
            return (
              <div key={i} className={styles.qCard} onClick={() => navigate(path)}>
                <div className={styles.qText}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {/* <button className={styles.qArrow}>→</button> */}
                </div>
                <div className={styles.qImgWrap}>
                  <div className={styles.qImgGlow} />
                  <img src={card.image_url || card.icon} alt={card.title} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CENTER — Hero + WOW (single card) */}
        <div className={styles.center}>
          <div className={styles.centerCard}>
            {/* Hero part */}
            <div className={styles.heroBanner}>
              <div className={styles.heroContent}>
                <p className={styles.greeting}>Hello, {name}! 👋</p>
                <h1>Experience Astrology<br />Powered by <span className={styles.ai}>AI</span></h1>
                <p className={styles.heroDesc}>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                {currentMahadasha && (
                  <div className={styles.mahadashaTag}>
                    🪐 Current Mahadasha: <strong>{currentMahadasha.name}</strong>
                  </div>
                )}
              </div>
              <div className={styles.heroBgImg}>
                <div className={styles.heroBgGlow} />
                <img src={heroBg} alt="" />
              </div>
            </div>

            {/* Divider */}
            {/* <div className={styles.centerDivider} /> */}

            {/* WOW Suite */}
            <div className={styles.wowInner}>
              {/* Glow blob */}
              <div className={styles.wowGlow} />

              {/* Header row: title left, View More right */}
              <div className={styles.wowHeader}>
                <div className={`${styles.titleWithBottomDevider}`}>
                  <h4 className={styles.wowTitle}>{wowSuiteItems[0]?.section_title || "LOREM IPSUM"}</h4>
                  <div className={styles.BottomDevider}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                      <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                    </svg>
                  </div>
                </div>
                <button className={styles.wowViewMore} onClick={() => navigate('/aiwow')}>View More &rsaquo;</button>
              </div>

              <div className={styles.wowRow}>
                <button className={styles.wowArrow} onClick={() => scrollWow(-1)} disabled={wowIndex === 0}>‹</button>
                <div className={styles.wowCards} ref={wowScrollRef}>
                  {wowAllItems.map((item, i) => (
                    <div key={i} className={styles.wowCard} onClick={() => handleWowCardClick(item)} style={{ cursor: item.slug ? 'pointer' : 'default' }}>
                      <div className={styles.wowIconBox}>
                        <img src={item.icon || item.iconUrl || item.icon_url} alt={item.title} />
                      </div>
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
                <button className={styles.wowArrow} onClick={() => scrollWow(1)} disabled={wowIndex >= wowAllItems.length - 1}>›</button>
              </div>
              {/* Pagination dots */}
              <div className={styles.wowDots}>
                {wowAllItems.map((_, i) => (
                  <span key={i} className={i === wowIndex ? styles.dotFilled : styles.dotEmpty} onClick={() => scrollWow(i - wowIndex)} style={{ cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Crucial Muhurats */}
        <div className={styles.rightPanel}>
          <h4>CRUCIAL MUHURATS</h4>
          <div className={styles.muhuratGrid}>
            {muhurats.map((m, i) => {
              const iconBgs = ["#FEF0E4", "#F4ECFB", "#E9F2EF", "#EBF2FB"];
              const iconColors = ["#F75801", "#9333ea", "#16a34a", "#2563eb"];
              const icons = [
                // Sun/muhurat icon
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill={iconColors[0]}/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={iconColors[0]} strokeWidth="2" strokeLinecap="round"/></svg>,
                // Rahu — moon/shadow icon
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={iconColors[1]}/></svg>,
                // Gulika — clock icon
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={iconColors[2]} strokeWidth="2"/><path d="M12 7v5l3 3" stroke={iconColors[2]} strokeWidth="2" strokeLinecap="round"/></svg>,
                // Yamakanta — star icon
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={iconColors[3]}/></svg>,
              ];
              return (
                <div key={i} className={styles.muhuratItem}>
                  <div className={styles.muhuratTop}>
                    <div className={styles.muhuratIcon} style={{ background: iconBgs[i % 4] }}>
                      {icons[i % 4]}
                    </div>
                    <h5>{m.name}</h5>
                  </div>
                  <p className={styles.muhuratTime}>{m.start} – {m.end}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — Feature Cards (LOREM IPSUM AI) ═══ */}
      <section className={styles.featureSection}>
        <div className={`${styles.titleWithBottomDevider}`}>
          <h4 className={styles.wowTitle}>{aiServicesSection?.display_title || "LOREM IPSUM AI"}</h4>
          <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
          </div>
        </div>
        <div className={styles.featureRow}>
          {/* Laal Kitaab — special card with image */}
          <div
            className={`${styles.featureCard} ${styles.laalKitaab}`}
            onClick={() => navigate('/lal-kitab')}
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.featureTag}>New</span>
            <h3>{aiServicesItems[0]?.display_title || aiServicesItems[0]?.title || "Laal Kitaab"}</h3>
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            <button className={styles.featureCta}>Explore Laal Kitaab &gt;</button>
            {(aiServicesItems[0]?.icon || laalKitaabImg) && (
              <img
                src={aiServicesItems[0]?.icon || laalKitaabImg}
                alt="Laal Kitaab"
                className={styles.laalKitaabImg}
              />
            )}
          </div>
          {/* Occult World */}
          <div className={`${styles.featureCard} ${styles.occultWorld}`}>
            <div className={styles.occultEllipse} />
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>{aiServicesItems[1]?.display_title || aiServicesItems[1]?.title || "Occult World"}</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <button className={styles.fcCtaLight}>Explore Occult &gt;</button>
            {(aiServicesItems[1]?.icon || occultWorldImg) && (
              <img src={aiServicesItems[1]?.icon || occultWorldImg} alt="Occult World" className={styles.fcCardImg} />
            )}
          </div>

          {/* AI Pandit Voice */}
          <div className={`${styles.featureCard} ${styles.aiPanditVoice}`} onClick={() => window.dispatchEvent(new CustomEvent("panditai:ask", { detail: { query: "" } }))} style={{ cursor: 'pointer' }}>
            <div className={styles.panditEllipse} />
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>{aiServicesItems[2]?.display_title || aiServicesItems[2]?.title || "AI Pandit (Voice)"}</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <button className={styles.fcCtaLight}>Talk Now &gt;</button>
            {(aiServicesItems[2]?.icon || aiPanditMic) && (
              <img src={aiServicesItems[2]?.icon || aiPanditMic} alt="AI Pandit" className={styles.fcCardImg} />
            )}
          </div>

          {/* Live Community */}
          <div className={`${styles.featureCard} ${styles.liveCommunity}`} onClick={() => navigate('/live')} style={{ cursor: 'pointer' }}>
            <div className={styles.liveEllipse} />
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>{aiServicesItems[3]?.display_title || aiServicesItems[3]?.title || "ShubhAstro Live Community"}</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <button className={styles.fcCtaLight}>Join Live Chat &gt;</button>
            {(aiServicesItems[3]?.icon) && (
              <img src={aiServicesItems[3]?.icon} alt="Live Community" className={styles.fcCardImg} />
            )}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — Quick Actions Grid ═══ */}
      <section className={styles.quickGrid}>
        <div className={styles.quickGridHeader}>
          <div className={`${styles.titleWithBottomDevider}`}>
            <h4 className={styles.wowTitle}>{homeList?.find(s => s.slug === "quick-link-section")?.display_title || "LOREM IPSUM AI"}</h4>
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
            {(quickLinkItems.length > 0 ? quickLinkItems : [
              { title: "Horoscope\nSection",    redirect_url: "/horoscopes/daily-horoscope", icon: AppIcons.Astrology },
              { title: "Consult\nAstrologer",   redirect_url: "/chat-with-astrologers",      icon: AppIcons.Chat },
              { title: "Future\nPredictions",   redirect_url: "/chat-with-astrologers",      icon: AppIcons.Star },
              { title: "Dasha\nTimeline",       redirect_url: "/kundli",                     icon: AppIcons.Kundali },
              { title: "Birth\nDetails",        redirect_url: "/kundli",                     icon: AppIcons.Education },
              { title: "Talk to\nAstrologer",   redirect_url: "/talk-to-astrologers",        icon: AppIcons.Call },
              { title: "Top Rated\nAstrologer", redirect_url: "/chat-with-astrologers",      icon: AppIcons.Trophy },
              { title: "My\nSessions",          redirect_url: "/profile",                    icon: AppIcons.Message },
            ]).map((a, i) => {
              const iconBgs = [
                "linear-gradient(116.1deg, #FBF3F1 0%, #F7E0DA 100%)",
                "linear-gradient(116.1deg, #F3F1FD 0%, #EBE5FC 100%)",
                "linear-gradient(116.1deg, #FAECFF 0%, #F9E7FF 100%)",
                "linear-gradient(116.1deg, #FFFFFF 0%, #CBE9FC 100%)",
                "linear-gradient(116.1deg, #F3F1FD 0%, #EBE5FC 100%)",
                "linear-gradient(116.1deg, #FBF3F1 0%, #F7E0DA 100%)",
                "linear-gradient(116.1deg, #FAECFF 0%, #F9E7FF 100%)",
                "linear-gradient(116.1deg, #FFFFFF 0%, #CBE9FC 100%)",
              ];
              return (
                <div key={i} className={styles.gridItem} onClick={() => a.redirect_url && navigate(a.redirect_url)} style={{ cursor: a.redirect_url ? 'pointer' : 'default' }}>
                  <div
                    className={styles.gridIconBox}
                    style={{
                      ...(a.image_url_web || a.image_url || a.icon ? {
                        background: `url(${a.image_url_web || a.image_url || a.icon}) center/60% no-repeat, ${iconBgs[i % iconBgs.length]}`,
                      } : {
                        background: iconBgs[i % iconBgs.length],
                      })
                    }}
                  />
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

        {/* Dots */}
        <div className={styles.quickDots}>
          {[0,1,2,3,4].map((_, i) => (
            <span key={i} className={i === 0 ? styles.quickDotFilled : styles.quickDotEmpty} />
          ))}
        </div>
      </section>

      {/* ═══ SECTION 4 — Top Rated Astrologers ═══ */}
      <section className={styles.astrologerSection} style={{ backgroundColor: `#FFE9E5`,paddingBottom:'1px',paddingTop:'16px'}}>
        <div className={styles.sectionHeader} style={{marginBottom:"0px"}}>
          <div className={styles.sectionTitleBlock}>
            <h2 className={styles.sectionTitle}>{astrologerSection?.display_title || "TOP RATED ASTROLOGERS FOR YOU"}</h2>
          </div>
          <button className={styles.viewAllBtn} onClick={() => navigate('/chat-with-astrologers')}>View all →</button>
        </div>
        <AstrologersSection
          title=""
          className={`${styles.astrologerCard1} ${styles.anotherClass}`}
          astrologers={astrologers}
          onConnect={handleConnectClick}
        />
      </section>

      {/* ═══ SECTION 5 — Explore by Category + Agentic Calendar + Discover More ═══ */}
      <section className={styles.threeColSection}>

        {/* LEFT — Explore by Category */}
        <div className={styles.categoryBox}>
          <div className={`${styles.titleWithBottomDevider}`}>
            <h4 className={styles.wowTitle}>EXPLORE BY CATEGORY</h4>
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
            ]).map((c, i) => (
              <div key={i} className={styles.catItem} onClick={() => navigate('/chat-with-astrologers', { state: { selectedType: c.slug } })} style={{ cursor: 'pointer' }}>
                <div
                  className={styles.catIconBox}
                  style={{
                    ...(c.image_url ? {
                      background: `url(${c.image_url}) center/50% no-repeat, linear-gradient(135deg, #FCF8F7 0%, #FCDBD9 100%)`,
                    } : {})
                  }}
                />
                <span>{c.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Agentic Calendar */}
        <div className={styles.calendarBox}>
          <div className={styles.calHead}>
            <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
              <h4 className={styles.wowTitle}>AGENTIC CALENDAR</h4>
              <div className={styles.BottomDevider}>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                  <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                </svg>
              </div>
            </div>
            <button className={styles.viewAllBtn} style={{ color: '#f75801' }}>›</button>
          </div>
          <div className={styles.calBody}>
            {/* Occasions */}
            <div className={styles.calOccasions}>
              <p className={styles.calLabel}>Select Occasions</p>
              <div className={styles.calChips}>
                <button className={styles.calChipActive}>Buy New Car <span className={styles.calChipX}>✕</span></button>
                {["Engagement", "Divorce", "Room Rent"].map((chip, i) => (
                  <button key={i} className={styles.calChip}>{chip}</button>
                ))}
                <button className={styles.calChipAdd}>+ Add Custom</button>
              </div>
              <p className={styles.calHint}>Select one or more occasions to view Muhurat</p>
            </div>

            {/* Divider */}
            <div className={styles.calDivider} />

            {/* Date filter */}
            <div className={styles.calDateRow}>
              {["Today", "Tomorrow", "This Week", "This Month"].map((d, i) => (
                <button key={i} className={i === 0 ? styles.calDateActive : styles.calDateChip}>{d}</button>
              ))}
              <button className={styles.calChipAdd}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f75801" style={{flexShrink:0}}>
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                </svg>
                Date
              </button>
            </div>

            {/* CTA */}
            <button className={styles.calCta}>View Muhuratas</button>
          </div>
        </div>

        {/* RIGHT — Discover More */}
        <div className={styles.discoverBox}>
          <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
            <h4 className={styles.wowTitle}>DISCOVER MORE</h4>
            <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </div>
          </div>
          <div className={styles.discoverGrid}>
            {(discoverMoreData.length > 0 ? discoverMoreData : [
              { title: "Panchang" },
              { title: "Kundli Matching" },
              { title: "Numerology" },
              { title: "Tarot Reading" },
            ]).map((item, i) => {
              const discoverBgs = [
                "linear-gradient(116.1deg, #FBF3F1 0%, #F7E0DA 100%)",
                "linear-gradient(116.1deg, #FFF0F0 0%, #FFE0E0 100%)",
                "linear-gradient(116.1deg, #F3F1FD 0%, #EBE5FC 100%)",
                "linear-gradient(116.1deg, #FAECFF 0%, #F9E7FF 100%)",
              ];
              return (
                <div key={i} className={styles.discoverItem}>
                  <div
                    className={styles.discoverIconBox}
                    style={{
                      ...(item.image_url ? {
                        background: `url(${item.image_url}) center/50% no-repeat, ${discoverBgs[i % 4]}`,
                      } : { background: discoverBgs[i % 4] })
                    }}
                  />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* ═══ SECTION 6 — My Sessions ═══ */}
      <section className={styles.mySessionsSection}>
        <div className={styles.mySessionsHeader}>
          <div className={`${styles.titleWithBottomDevider}`}>
            <h4 className={styles.wowTitle}>MY SESSIONS</h4>
            <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </div>
          </div>
          <button className={styles.viewAllBtn} onClick={() => navigate('/profile')}>View all &rsaquo;</button>
        </div>

        {/* Horizontally scrollable cards */}
        <div className={styles.sessionScroll}>
          {[1,2,3,4].map((_, idx) => (
            <div key={idx} className={styles.sessionCard}>
              {/* Avatar */}
              <div className={styles.sessionAvatar}>
                <img src={astrologerMaleImg} alt="Astrologer" />
                <span className={styles.sessionOnlineDot} />
              </div>

              {/* Info */}
              <div className={styles.sessionInfo}>
                <h3 className={styles.sessionName}>Jane Doe</h3>
                <div className={styles.sessionMeta}>
                  <span className={styles.sessionDate}>29 Apr, 2029</span>
                  <span className={styles.sessionDivider}>|</span>
                  <span className={styles.sessionType}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#f75801"/>
                    </svg>
                    Call Session
                  </span>
                </div>

                {/* Bottom row */}
                <div className={styles.sessionActions}>
                  {/* Voice player */}
                  <div className={styles.sessionPlayer}>
                    <button className={styles.sessionPlayBtn}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#f75801">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    <div className={styles.sessionWave}>
                      {[4, 8, 14, 18, 22, 16, 22, 18, 14, 8, 4].map((h, i) => (
                        <span key={i} className={styles.sessionWaveBar} style={{ height: `${h}px` }} />
                      ))}
                    </div>
                  </div>
                  {/* Call Again */}
                  <button className={styles.sessionCallBtn}>Call Again</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 7 — Real Consultations (Live Tracking + CTA) ═══ */}
      <section className={styles.liveSection}>

        {/* Live Tracking badge */}
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          LIVE TRACKING
        </div>

        {/* Heading */}
        <h2 className={styles.liveHeading}>
          Real People. Real Consultations. <span className={styles.liveOrange}>Right Now.</span>
        </h2>
        <p className={styles.liveSubtitle}>Live updates from ShubhAstro community</p>

        {/* 4 Stat Cards */}
        <div className={styles.liveStats}>
          {[
            { num: "234", label: "users in active consultations",  color: "#FEF0E4" },
            { num: "47",  label: "Kundlis generated today",        color: "#F4ECFB" },
            { num: "8",   label: "Lal Kitab remedies tried tonight", color: "#E9F2EF" },
            { num: "12",  label: "new chats started in the last hour", color: "#EBF2FB" },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statCircle} style={{ background: s.color }} />
              <div className={styles.statText}>
                <span className={styles.statNum}>{s.num}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className={styles.ctaBanner}>
          {/* Left */}
          <div className={styles.ctaLeft}>
            <div className={styles.ctaTag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f75801"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              Don't Wait. Get Clarity Now.
            </div>
            <h3 className={styles.ctaHeading}>Your Answers Are Waiting.</h3>
            <p className={styles.ctaOrange}>Connect with an Astrologer Now!</p>
            <p className={styles.ctaDesc}>Talk to verified astrologers and get clarity on love, career, health, finance and more.</p>
            <div className={styles.ctaAvatarRow}>
              <div className={styles.ctaAvatars}>
                {[avatar1, avatar2, avatar3, avatar4].map((av, i) => (
                  <img key={i} src={av} alt="" className={styles.ctaAvatar} />
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
            <button className={styles.ctaBtnPrimary} onClick={() => navigate('/chat-with-astrologers')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              Start Chat Consultation
            </button>
            <button className={styles.ctaBtnSecondary} onClick={() => navigate('/chat-with-astrologers')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f75801"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              Connect with Astrologer
            </button>
            <div className={styles.ctaTrust}>
              <span className={styles.ctaTrustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f75801"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                100% Secure
              </span>
              <span className={styles.ctaTrustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f75801"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Verified Experts
              </span>
              <span className={styles.ctaTrustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f75801"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                Privacy Protected
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* ═══ SECTION 8 — Explore Blogs ═══ */}
      <section className={styles.blogSection}>
        <BlogsSection
          blogData={blogSection?.content || []}
          title={blogSection?.display_title || "EXPLORE BLOGS"}
          showMore={true}
        />
      </section>


    </div>

      {/* Modals */}
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
      <PanditAIBubble />
      <MobileAppModal isOpen={showMobileAppModal} onClose={() => setShowMobileAppModal(false)} />
    </>
  );
};

export default HomeV2;
