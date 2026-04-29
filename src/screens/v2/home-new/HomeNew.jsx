import styles from "./HomeNew.module.scss";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserFromStorage } from "../../../utils/authStorage";
import { Toast } from "../../../component";
import { useGetHomeDetailsQuery, useGetAiSuitesQuery } from "../../../services/appServices/homeServices";
import { useGetCurrentMahadashaFullQuery } from "../../../redux/api/kundli/dashaApi";
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
  const { data } = useGetHomeDetailsQuery();
  const homeList = data?.data?.list;

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

  // Extract blog section from home API
  const blogSection = useMemo(() => {
    return homeList?.find(s => s.display_type === "blog");
  }, [homeList]);

  // Extract complementary services (left cards)
  const complementaryServices = useMemo(() => {
    return homeList?.find(s => s.display_type === "complementary-services")?.content || [];
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
          {[
            { title: "Generate\nMy Kundli", desc: "Lorem ipsum is simply dummy text", img: kundliImg, path: "/kundli" },
            { title: "Talk To\nAstrologer", desc: "Lorem ipsum is simply dummy text", img: astrologerImg, path: "/chat-with-astrologers" },
            { title: "Explore\nHoroscopes", desc: "Lorem ipsum is simply dummy text", img: horoscopeImg, path: "/horoscopes/daily-horoscope" },
          ].map((card, i) => (
            <div key={i} className={styles.qCard} onClick={() => navigate(card.path)}>
              <div className={styles.qText}>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
              <div className={styles.qImgWrap}>
                <img src={card.img} alt="" />
              </div>
            </div>
          ))}
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
                <img src={heroBg} alt="" />
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
            {[
              { name: "Abhijit Muhurat", start: "12:29 PM", end: "07:13 PM" },
              { name: "Rahu Kaal", start: "12:29 PM", end: "07:13 PM" },
              { name: "Gulika Kaal", start: "12:29 PM", end: "07:13 PM" },
              { name: "Yamakanta Kaal", start: "12:29 PM", end: "07:13 PM" },
            ].map((m, i) => (
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
          <h4 className={styles.wowTitle}>LOREM IPSUM AI</h4>
          <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
          </div>
        </div>
        <div className={styles.featureRow}>
          {/* Laal Kitaab — special card with image */}
          <div className={`${styles.featureCard} ${styles.laalKitaab}`} onClick={() => navigate('/lal-kitab')} style={{ cursor: 'pointer' }}>
            <span className={styles.featureTag}>New</span>
            <h3>Laal Kitaab</h3>
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            <button className={styles.featureCta}>Explore Laal Kitaab &gt;</button>
            <img src={laalKitaabImg} alt="Laal Kitaab" className={styles.laalKitaabImg} />
          </div>
          {/* Occult World */}
          <div className={`${styles.featureCard} ${styles.occultWorld}`}>
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>Occult World</h3>
              <p>Explore the mystical &amp; hidden sciences for deeper insights into your life.</p>
            </div>
            <button className={styles.fcCtaLight}>Explore Occult &gt;</button>
            <img src={occultWorldImg} alt="Occult World" className={styles.fcImg} />
          </div>

          {/* AI Pandit Voice */}
          <div className={`${styles.featureCard} ${styles.aiPanditVoice}`} onClick={() => window.dispatchEvent(new CustomEvent("panditai:ask", { detail: { query: "" } }))} style={{ cursor: 'pointer' }}>
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>AI Pandit (Voice)</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <div className={styles.fcMicIcon}>
              {/* <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130" fill="none" className={styles.glowCircle}>
                <g filter="url(#filter0_f_12155_25282)">
                  <circle cx="65" cy="65" r="50" fill="url(#paint0_radial_12155_25282)"/>
                </g>
                <defs>
                  <filter id="filter0_f_12155_25282" x="0" y="0" width="130" height="130" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feGaussianBlur stdDeviation="7.5" result="effect1_foregroundBlur_12155_25282"/>
                  </filter>
                  <radialGradient id="paint0_radial_12155_25282" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(65 65) rotate(90) scale(72)">
                    <stop stopColor="#351664"/>
                    <stop offset="1" stopColor="#4E2E7E"/>
                  </radialGradient>
                </defs>
              </svg> */}
              {/* <img src={aiPanditMic} alt="mic" className={styles.micImg} /> */}
              <div className={styles.micWrap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path d="M31.9996 37.3333C36.4263 37.3333 39.9996 33.7599 39.9996 29.3333V13.3333C39.9996 8.90659 36.4263 5.33325 31.9996 5.33325C27.573 5.33325 23.9996 8.90659 23.9996 13.3333V29.3333C23.9996 33.7599 27.573 37.3333 31.9996 37.3333ZM47.7596 29.3333C46.453 29.3333 45.3596 30.2933 45.1463 31.5999C44.053 37.8666 38.5863 42.6666 31.9996 42.6666C25.413 42.6666 19.9463 37.8666 18.853 31.5999C18.6396 30.2933 17.5463 29.3333 16.2396 29.3333C14.613 29.3333 13.333 30.7733 13.573 32.3733C14.8796 40.3733 21.2796 46.6399 29.333 47.7866V53.3333C29.333 54.7999 30.533 55.9999 31.9996 55.9999C33.4663 55.9999 34.6663 54.7999 34.6663 53.3333V47.7866C42.7196 46.6399 49.1196 40.3733 50.4263 32.3733C50.693 30.7733 49.3863 29.3333 47.7596 29.3333Z" fill="white"/>
                </svg>
              </div>
            </div>
            <button className={styles.fcCtaLight}>Talk Now &gt;</button>
          </div>

          {/* Live Community */}
          <div className={`${styles.featureCard} ${styles.liveCommunity}`} onClick={() => navigate('/live')} style={{ cursor: 'pointer' }}>
            <span className={styles.featureTag}>New</span>
            <div className={styles.fcTop}>
              <h3>ShubhAstro Live Community</h3>
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <div className={styles.fcAvatars}>
              {[avatar1, avatar2, avatar3, avatar4, avatar5].map((av, i) => (
                <img key={i} src={av} alt="" className={styles.fcAvatar} style={{ zIndex: 5 - i }} />
              ))}
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
          <button className={styles.viewAllBtn} onClick={() => navigate('/chat-with-astrologers')}>View all →</button>
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
          <h4 className={styles.wowTitle}>LOREM IPSUM AI</h4>
          <div className={styles.BottomDevider}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
          </div>
        </div>
        <div className={styles.gridRow}>
          {[
            { label: "Horoscope\nSection",    bg: "#fef3c7" },
            { label: "Consult\nAstrologer",   bg: "#fef2f2" },
            { label: "Future\nPredictions",   bg: "#f5f3ff" },
            { label: "Dasha\nTimeline",       bg: "#fff7ed" },
            { label: "Birth\nDetails",        bg: "#fff7ed" },
            { label: "Talk to\nAstrologer",   bg: "#ede9fe" },
            { label: "Top Rated\nAstrologer", bg: "#fefce8" },
            { label: "My\nSessions",          bg: "#eef2ff" },
          ].map((a, i) => (
            <div key={i} className={styles.gridItem}>
              <div className={styles.gridIconBox} style={{ background: a.bg }} />
              <span>{a.label}</span>
            </div>
          ))}
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
                <div key={i} className={styles.catItem} onClick={() => navigate('/chat-with-astrologers', { state: { selectedType: c.slug } })} style={{ cursor: 'pointer' }}>
                  <div className={styles.catIconBox} style={{ background: '#fff' }} />
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
              <h4 className={styles.wowTitle}>AGENTIC CALENDAR</h4>
              <div className={styles.BottomDevider}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                    <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                  </svg>
              </div>
            </div>
            <button className={styles.viewAllBtn}>View More →</button>
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
                  <div className={styles.discoverIconBox} style={{ background: item.bg || bgs[i % 4] }} />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.popularBox}>
          <div className={styles.calHeader}>
            <h2 className={styles.sectionTitle}>Popular Astrologers</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/chat-with-astrologers')}>View All →</button>
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
      <MobileAppModal isOpen={showMobileAppModal} onClose={() => setShowMobileAppModal(false)} />
    </>
  );
};

export default HomeNew;
