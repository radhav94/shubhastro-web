import styles from "./HomeNew.module.scss";
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
import PanditAIVoiceBubble from "../../../component/panditAI/PanditAIVoiceBubble";
import MobileAppModal from "../../private/aiwow/components/MobileAppModal";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";

// Left card images
import kundliImg from "../../../assets/images/home-hero-kundli.png";
import astrologerImg from "../../../assets/images/home-hero-astrologer.png";
import horoscopeImg from "../../../assets/images/home-hero-horoscope.png";

// Hero BG
const heroBg = "https://assets.shubhastro.ai/images/1778659743-240854750.png";

// WOW icons
import vastuIcon from "../../../assets/aiwow/wow-vastu.svg";
import palmIcon from "../../../assets/aiwow/wow-palmistry.svg";
import faceIcon from "../../../assets/aiwow/wow-face.svg";
import signatureIcon from "../../../assets/aiwow/wow-signature.svg";

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

const HomeNew = () => {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const name = user?.firstName || "Guest";

  // Add body class for footer text override on this page only
  useEffect(() => {
    document.body.classList.add('home-new-page');
    return () => document.body.classList.remove('home-new-page');
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
      const rootLevelSlugs = [
        "ai-palmistry-scanner",
        "astro-face-reading",
        "signature-analysis",
        "clothes-colour-analysis",
        "gemstone-authenticity",
        "aura-photography",
      ];
      const path = rootLevelSlugs.includes(item.slug) ? `/${item.slug}` : `/aiwow/${item.slug}`;
      navigate(path);
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
                  <img src={card.image_url || card.icon} alt={card.title} width="80" height="80" loading="lazy" />
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
                <p className={styles.greeting} key={`greeting-${name}`}>Hello, {name}! 👋</p>
                <h1>Experience Astrology<br />Powered by <span className={styles.ai}>AI</span></h1>
                <p className={styles.heroDesc}>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                {currentMahadasha && (
                  <div className={styles.mahadashaTag}>
                    🪐 Current Mahadasha: <strong>{currentMahadasha.name}</strong>
                  </div>
                )}
              </div>
              <div className={styles.heroBgImg}>
                <img src={heroBg} alt="" width="350" height="350" loading="eager" fetchPriority="high" decoding="async" />
              </div>
            </div>

            {/* Divider */}
            {/* <div className={styles.centerDivider} /> */}

            {/* WOW Suite */}
            <div className={styles.wowInner}>
              {/* Glow blob */}
              <div className={styles.wowGlow} />

              <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginLeft}`}>
                <h4 className={styles.wowTitle}>WOW SUITE</h4>
                <div className={styles.BottomDevider}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                      <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                    </svg>
                </div>
              </div>

              {/* <div className={styles.wowUnderline}><span className={styles.wowLine} /><span className={styles.wowDot}>●</span></div> */}
              <div className={styles.wowRow}>
                <button className={styles.wowArrow} onClick={() => scrollWow(-1)} disabled={wowIndex === 0}>‹</button>
                <div className={styles.wowCards} ref={wowScrollRef}>
                  {wowAllItems.map((item, i) => (
                    <div key={i} className={styles.wowCard} onClick={() => handleWowCardClick(item)} style={{ cursor: item.slug ? 'pointer' : 'default' }}>
                      <div className={styles.wowIconBox}>
                        <img src={item.icon || item.iconUrl || item.icon_url} alt={item.title} width="40" height="40" loading="lazy" />
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
            {muhurats.map((m, i) => (
              <div key={i} className={styles.muhuratItem}>
                <h5>{m.name}</h5>
                <div className={styles.timeRow}><span className={styles.greenBar} /><span className={styles.label}>Start</span><span className={styles.time}>{m.start}</span></div>
                <div className={styles.timeRow}><span className={styles.redBar} /><span className={styles.labelRed}>End</span><span className={styles.time}>{m.end}</span></div>
              </div>
            ))}
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
            onClick={() => { if (!requireAuth()) return; navigate('/laal-kitab'); }}
            style={{
              cursor: 'pointer',
              backgroundImage: `url(${aiServicesItems[0]?.image_url_web || aiServicesItems[0]?.images_for_web || aiServicesItems[0]?.image_url || laalKitaabImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <span className={styles.featureTag}>New</span>
            <h3>{aiServicesItems[0]?.display_title || aiServicesItems[0]?.title || "Laal Kitaab"}</h3>
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            <button className={styles.featureCta}>Explore Laal Kitaab &gt;</button>
          </div>
          {/* Occult World */}
          <div className={`${styles.featureCard} ${styles.occultWorld}`}
            onClick={() => { if (!requireAuth()) return; navigate('/occult'); }}
            style={{ cursor: 'pointer', ...(aiServicesItems[1]?.image_url_web ? { backgroundImage: `url(${aiServicesItems[1].image_url_web})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}
          >
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>{aiServicesItems[1]?.display_title || aiServicesItems[1]?.title || "Occult World"}</h3>
              <p>Explore the mystical &amp; hidden sciences for deeper insights into your life.</p>
            </div>
            <button className={styles.fcCtaLight}>Explore Occult &gt;</button>
          </div>

          {/* AI Pandit Voice */}
          <div className={`${styles.featureCard} ${styles.aiPanditVoice}`} onClick={() => window.dispatchEvent(new CustomEvent("panditai-voice:open"))} style={{ cursor: 'pointer', ...(aiServicesItems[2]?.image_url_web ? { backgroundImage: `url(${aiServicesItems[2].image_url_web})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}>
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>{aiServicesItems[2]?.display_title || aiServicesItems[2]?.title || "AI Pandit (Voice)"}</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <button className={styles.fcCtaLight}>Talk Now &gt;</button>
          </div>

          {/* Live Community */}
          <div className={`${styles.featureCard} ${styles.liveCommunity}`} onClick={() => navigate('/live')} style={{ cursor: 'pointer', ...(aiServicesItems[3]?.image_url_web ? { backgroundImage: `url(${aiServicesItems[3].image_url_web})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}>
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>{aiServicesItems[3]?.display_title || aiServicesItems[3]?.title || "ShubhAstro Live Community"}</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <button className={styles.fcCtaLight}>Join Live Now &gt;</button>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — Top Rated Astrologers ═══ */}
      <section className={styles.astrologerSection} style={{ backgroundColor: `#FFE9E5`,paddingBottom:'1px',paddingTop:'24px'}}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleBlock}>
            <h2 className={styles.sectionTitle}>{astrologerSection?.display_title || "TOP RATED ASTROLOGERS FOR YOU"}</h2>
          </div>
          <button className={styles.viewAllBtn} onClick={() => navigate('/chat-to-astrologer')}>View All →</button>
        </div>
        <AstrologersSection
          title=""
          className={`${styles.astrologerCard1} ${styles.anotherClass}`}
          astrologers={astrologers}
          onConnect={handleConnectClick}
        />
      </section>

      {/* ═══ SECTION 4 — Quick Actions Grid ═══ */}
      <section className={styles.quickGrid}>
        <div className={`${styles.titleWithBottomDevider}`}>
          <h4 className={styles.wowTitle}>{homeList?.find(s => s.slug === "quick-link-section")?.display_title || "QUICK LINKS"}</h4>
          <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
          </div>
        </div>
        <div className={styles.gridRow}>
          {(quickLinkItems.length > 0 ? quickLinkItems : [
            { title: "Horoscope\nSection",    redirect_url: "/daily-horoscope" },
            { title: "Consult\nAstrologer",   redirect_url: "/chat-to-astrologer" },
            { title: "Future\nPredictions",   redirect_url: "/chat-to-astrologer" },
            { title: "Dasha\nTimeline",       redirect_url: "/kundli" },
            { title: "Birth\nDetails",        redirect_url: "/kundli" },
            { title: "Talk to\nAstrologer",   redirect_url: "/talk-to-astrologer" },
            { title: "Top Rated\nAstrologer", redirect_url: "/chat-to-astrologer" },
            { title: "My\nSessions",          redirect_url: "/profile" },
          ]).map((a, i) => {
            const bgs = ["#fef3c7","#fef2f2","#f5f3ff","#fff7ed","#fff7ed","#ede9fe","#fefce8","#eef2ff"];
            return (
              <div key={i} className={styles.gridItem} onClick={() => {
                if (a.redirect_url) return navigate(a.redirect_url);
                const slug = (a.slug || a.title?.toLowerCase().replace(/\s+/g, '-') || '');
                if (slug.includes('sade-sati') || slug.includes('sade sati')) return navigate('/shani-sade-sati-calculator');
                if (slug.includes('numerology')) return navigate('/numerology-calculator');
                if (slug.includes('remed')) return navigate('/remedies');
              }} style={{ cursor: 'pointer' }}>
                <div
                  className={styles.gridIconBox}
                  style={{
                    background: '#FFF1E4',
                    ...(a.image_url_web || a.image_url || a.icon ? {
                      backgroundImage: `url(${a.image_url_web || a.image_url || a.icon})`,
                      backgroundSize: '65%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    } : {})
                  }}
                />
                <span>{a.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ SECTION 5 — Explore by Category + Agentic Calendar ═══ */}
      <section className={styles.twoColEqual}>
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
            ]).map((c, i) => {
              return (
                <div key={i} className={styles.catItem} onClick={() => navigate('/chat-to-astrologer', { state: { selectedType: c.slug } })} style={{ cursor: 'pointer' }}>
                  <div
                    className={styles.catIconBox}
                    style={{
                      background: '#fff',
                      ...(c.image_url ? {
                        backgroundImage: `url(${c.image_url})`,
                        backgroundSize: '50%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      } : {})
                    }}
                  />
                  <span>{c.title}</span>
                </div>
              );
            })}
          </div>
          {/* <button className={styles.viewAllLink}>View All Categories →</button> */}
        </div>

        <div className={styles.calendarBox}>
          <div className={styles.calHead}>
            <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
              <h4 className={styles.wowTitle}>MUHURAT CALENDAR</h4>
              <div className={styles.BottomDevider}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                    <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                  </svg>
              </div>
            </div>
            <button className={styles.viewAllBtn}>View All →</button>
          </div>
          <div className={styles.calBody}>
            <div className={styles.calOccasions}>
              <p className={styles.calLabel}>Select Occasions</p>
              <div className={styles.calChips}>
                {["Marriage", "Engagement", "Divorce", "Room Rent"].map((chip, i) => (
                  <button key={i} className={styles.calChip}>{chip}</button>
                ))}
                <button className={styles.calChipAdd}>+ Add Custom</button>
              </div>
            </div>
            <p className={styles.calHint}>Select one or more occasions to view Muhurat</p>
            <button className={styles.calCta}>View Muhuratas</button>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — Discover More + Popular Astrologers ═══ */}
      <section className={styles.twoColSection} style={{ backgroundImage: `url(${sectionBg})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '20px' }}>
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
              { title: "Panchang",        bg: "#ffedd5" },
              { title: "Kundli Matching", bg: "#fef2f2" },
              { title: "Numerology",      bg: "#f5f3ff" },
              { title: "Tarot Reading",   bg: "#fecaca" },
            ]).map((item, i) => {
              const bgs = ["#ffedd5", "#fef2f2", "#f5f3ff", "#fecaca"];
              return (
                <div key={i} className={styles.discoverItem}>
                  <div
                    className={styles.discoverIconBox}
                    style={{
                      background: bgs[i % 4],
                      ...(item.image_url ? {
                        backgroundImage: `url(${item.image_url})`,
                        backgroundSize: '50%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      } : {})
                    }}
                  />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.popularBox}>
          <div className={styles.calHeader}>
            <h2 className={styles.sectionTitle}>Popular Astrologers</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/chat-to-astrologer')}>View All →</button>
          </div>
          <AstrologersSection
            title=""
            astrologers={popularAstrologers}
            onConnect={handleConnectClick}
          />
        </div>
      </section>

      {/* ═══ SECTION 7 — Explore Blogs ═══ */}
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
      <PanditAIVoiceBubble />
      <MobileAppModal isOpen={showMobileAppModal} onClose={() => setShowMobileAppModal(false)} />
    </>
  );
};

export default HomeNew;
