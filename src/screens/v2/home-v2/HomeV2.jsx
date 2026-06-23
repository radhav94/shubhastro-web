import styles from "./HomeV2.module.scss";
import { useState, useMemo, useEffect, useCallback, lazy, Suspense, Fragment } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import SeoHelmet from "../../../component/SeoHelmet";
import { getUserFromStorage } from "../../../utils/authStorage";
import { useGetAiSuitesQuery, useGetNewHomeDetailsQuery } from "../../../services/appServices/homeServices";
import { useGetCurrentMahadashaFullQuery } from "../../../redux/api/kundli/dashaApi";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useAstrologerConnection } from "../home/hooks/useAstrologerConnection";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import PanditAIBubble from "../../../component/panditAI/PanditAIBubble";
import PanditAIVoiceBubble from "../../../component/panditAI/PanditAIVoiceBubble";
import RechargeModal from "../../../component/recharge-modal/RechargeModal";
import WelcomeBonusModal from "../../../component/UI/modal/WelcomeBonusModal/WelcomeBonusModal";

// Dynamic section rendering
import { sortSections, sortContentByOrder, buildRenderPlan, renderStandaloneSection } from "./sectionRendererV2";
import { ComplementaryServicesSection, AiServicesSection, MuhuratSectionV2, AstrologersByCategorySection, DiscoverMoreSectionV2, LiveSessionCard } from "./sections";

// Lazy-load below-the-fold components
const ProfileModals = lazy(() => import("../../private/kundli/components/ProfileModals"));
const EmergencySessionModal = lazy(() => import("../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal"));
const MobileAppModal = lazy(() => import("../../private/aiwow/components/MobileAppModal"));
const AgenticCalendarV2 = lazy(() => import("./AgenticCalendarV2"));

// Fallback images
import kundliImg from "../../../assets/images/home-hero-kundli.png";
import astrologerImg from "../../../assets/images/home-hero-astrologer.png";
import horoscopeImg from "../../../assets/images/home-hero-horoscope.png";
import vastuIcon from "../../../assets/aiwow/wow-vastu.svg";
import palmIcon from "../../../assets/aiwow/wow-palmistry.svg";
import faceIcon from "../../../assets/aiwow/wow-face.svg";
import signatureIcon from "../../../assets/aiwow/wow-signature.svg";
import astrologerMaleImg from "../../../assets/default-img/astrologer male_v.1.png";

// Community avatars — loaded lazily via URL (below-the-fold, decorative)
const COMMUNITY_AVATARS = [
  new URL("../../../assets/images/community-avatar-1.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-2.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-3.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-4.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-5.png", import.meta.url).href,
];
const heroBg = "https://assets.shubhastro.ai/images/1778659743-240854750.png";

// ─── Hero Group Renderer ──────────────────────────────────────────────────────

const HeroGroupLayout = ({ sections, styles, navigate, name, currentMahadasha, wowSections, wowSuiteItems, handleWowCardClick, getWowCardPath, onlineCount }) => {
  // Sort sections by list_order to determine column placement
  // 1st by list_order → LEFT, 2nd → CENTER, 3rd → RIGHT
  // ai-services is special: it distributes across columns (laal kitaab left, occult/pandit center, community right)
  const sorted = useMemo(() => [...sections].sort((a, b) => (a.list_order || 0) - (b.list_order || 0)), [sections]);

  // Separate ai-services (it spans all columns) from the main 3 positional sections
  const aiServicesData = sorted.find(s => s.display_type === "ai-services");
  const positionalSections = sorted.filter(s => s.display_type !== "ai-services");

  // Assign columns by sorted position: [0]=left, [1]=center, [2]=right
  const leftSection = positionalSections[0] || null;
  const centerSection = positionalSections[1] || null;
  const rightSection = positionalSections[2] || null;

  const aiServicesItems = useMemo(() => sortContentByOrder(aiServicesData?.content || []), [aiServicesData]);

  // Render a section's UI based on its display_type, regardless of which column it's in
  const renderSectionContent = (section) => {
    if (!section) return null;
    switch (section.display_type) {
      case "complementary-services": {
        const content = section.content?.length > 0 ? sortContentByOrder(section.content) : [
          { title: "Generate My Kundli", slug: "free-kundli", description: "Get your free birth chart", image_url: kundliImg, list_order: 1 },
          { title: "Talk to an Astrologer", slug: "talk-to-astrologer", description: "Connect with experts", image_url: astrologerImg, list_order: 2 },
          { title: "Explore Horoscope", slug: "daily-horoscope", description: "Daily predictions", image_url: horoscopeImg, list_order: 3 },
        ];
        return <ComplementaryServicesSection sectionData={{ content }} styles={styles} />;
      }
      case "ai-powered-astrology":
        return (
          <div className={styles.centerCard}>
            <div className={styles.heroBanner}>
              <div className={styles.heroContent}>
                <p className={styles.greeting} key={`greeting-${name}`}>Hello, {name}! 👋</p>
                <h1>
                  {section.title
                    ? <>{section.title.replace(" AI", "")} <span className={styles.ai}>AI</span></>
                    : <>Experience Astrology<br />Powered by <span className={styles.ai}>AI</span></>
                  }
                </h1>
                {currentMahadasha && (
                  <div className={styles.mahadashaTag}>🪐 Current Mahadasha: <strong>{currentMahadasha.name}</strong></div>
                )}
              </div>
              <div className={styles.heroBgImg}>
                <div className={styles.heroBgGlow} />
                <img src={heroBg} alt="" loading="eager" fetchPriority="high" width="350" height="350" decoding="async" />
              </div>
            </div>
            <div className={styles.wowInner}>
              <div className={styles.wowGlow} />
              <div className={styles.wowHeader}>
                <div className={styles.titleWithBottomDevider}>
                  {/* <h4 className={styles.wowTitle}>{wowSuiteItems.title}</h4> */}
                  <h2 className={styles.wowTitle}>Your AI Suite</h2>
                  <div className={styles.BottomDevider}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                      <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                    </svg>
                  </div>
                </div>
                {/* <button className={styles.wowViewMore} onClick={() => navigate('/ai-wow')}>View More &rsaquo;</button> */}
              </div>
              <div className={styles.wowGrid}>
                {wowSections.flatMap((sec, si) =>
                  (sec.content || []).map((item, i) => {
                    const path = getWowCardPath(item);
                    return path ? (
                      <Link key={`${si}-${i}`} className={styles.wowCard} to={path} onClick={(e) => handleWowCardClick(item, e)} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                        <div className={styles.wowIconBox}>
                          <img src={item.icon || item.iconUrl || item.icon_url} alt={item.title} width="40" height="40" loading="lazy" />
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <div key={`${si}-${i}`} className={styles.wowCard} onClick={(e) => handleWowCardClick(item, e)} style={{ cursor: item.slug ? 'pointer' : 'default' }}>
                        <div className={styles.wowIconBox}>
                          <img src={item.icon || item.iconUrl || item.icon_url} alt={item.title} width="40" height="40" loading="lazy" />
                        </div>
                        <span>{item.title}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      case "muharat-widget":
        return <MuhuratSectionV2 sectionData={section} styles={styles} />;
      default:
        return null;
    }
  };

  return (
    <>
      <section className={styles.heroRow}>
        {/* LEFT column */}
        <div className={styles.leftCards}>
          {renderSectionContent(leftSection)}
          {/* Laal Kitaab from ai-services — always in left column */}
          {aiServicesItems[0] && (
            <div className={styles.qCardLaal} onClick={() => { const url = aiServicesItems[0]?.redirect_url || aiServicesItems[0]?.link; if (url) navigate(url); }} style={{ cursor: aiServicesItems[0]?.redirect_url || aiServicesItems[0]?.link ? 'pointer' : 'default' }}>
              <span className={styles.featureTag}>New</span>
              <h3>{aiServicesItems[0]?.display_title || aiServicesItems[0]?.title}</h3>
              {aiServicesItems[0]?.description && <p>{aiServicesItems[0].description}</p>}
              {aiServicesItems[0]?.action_btn && <button className={styles.featureCta}>{aiServicesItems[0].action_btn}</button>}
              {(aiServicesItems[0]?.image_url_web || aiServicesItems[0]?.icon) && <img src={aiServicesItems[0].image_url_web || aiServicesItems[0].icon} alt={aiServicesItems[0]?.title || ""} width="120" height="120" className={styles.laalKitaabImgLeft} loading="lazy" />}
            </div>
          )}
        </div>

        {/* CENTER column */}
        <div className={styles.center}>
          {renderSectionContent(centerSection)}
          {/* Occult + AI Pandit from ai-services — always in center column */}
          {aiServicesItems.length > 1 && (
            <div className={`${styles.centerFeatureRow} ${styles.desktopOnly}`}>
              {aiServicesItems[1] && (
                <div className={`${styles.centerFeatureCard} ${styles.occultWorld}`} onClick={() => { const url = aiServicesItems[1]?.redirect_url || aiServicesItems[1]?.link; if (url) navigate(url); }} style={{ cursor: aiServicesItems[1]?.redirect_url || aiServicesItems[1]?.link ? 'pointer' : 'default' }}>
                  <div className={styles.occultEllipse} />
                  <span className={styles.featureTag}>New</span>
                  <div className={styles.fcTop}>
                    <h3>{aiServicesItems[1]?.display_title || aiServicesItems[1]?.title}</h3>
                    {aiServicesItems[1]?.description && <p>{aiServicesItems[1].description}</p>}
                  </div>
                  {aiServicesItems[1]?.action_btn && <button className={styles.fcCtaLight}>{aiServicesItems[1].action_btn}</button>}
                  {(aiServicesItems[1]?.image_url_web || aiServicesItems[1]?.icon) && <img src={aiServicesItems[1].image_url_web || aiServicesItems[1].icon} alt={aiServicesItems[1]?.title || ""} width="100" height="100" className={styles.fcCardImg} loading="lazy" />}
                </div>
              )}
              {aiServicesItems[2] && (
                <div className={`${styles.centerFeatureCard} ${styles.aiPanditVoice}`} onClick={() => { const url = aiServicesItems[2]?.redirect_url || aiServicesItems[2]?.link; if (url) navigate(url); }} style={{ cursor: aiServicesItems[2]?.redirect_url || aiServicesItems[2]?.link ? 'pointer' : 'default' }}>
                  <div className={styles.panditEllipse} />
                  <span className={styles.featureTag}>New</span>
                  <div className={styles.fcTop}>
                    <h3>{aiServicesItems[2]?.display_title || aiServicesItems[2]?.title}</h3>
                    {aiServicesItems[2]?.description && <p>{aiServicesItems[2].description}</p>}
                  </div>
                  {aiServicesItems[2]?.action_btn && <button className={styles.panditTalkBtn}>{aiServicesItems[2].action_btn}</button>}
                  {(aiServicesItems[2]?.image_url_web || aiServicesItems[2]?.icon) && <img src={aiServicesItems[2].image_url_web || aiServicesItems[2].icon} alt={aiServicesItems[2]?.title || ""} width="100" height="100" className={styles.fcCardImg} loading="lazy" />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div className={styles.rightCol}>
          {renderSectionContent(rightSection)}
          {/* Live Community from ai-services — always in right column */}
          {aiServicesItems[3] && (
            <div className={`${styles.liveCommunityCard} ${styles.desktopOnly}`} onClick={() => { const url = aiServicesItems[3]?.redirect_url || aiServicesItems[3]?.link; if (url) navigate(url); }} style={{ cursor: aiServicesItems[3]?.redirect_url || aiServicesItems[3]?.link ? 'pointer' : 'default' }}>
              <span className={styles.featureTag}>New</span>
              <h3 className={styles.liveCommunityTitle}>{aiServicesItems[3]?.display_title || aiServicesItems[3]?.title}</h3>
              {aiServicesItems[3]?.description && <p className={styles.liveCommunityDesc}>{aiServicesItems[3].description}</p>}
              {aiServicesItems[3]?.action_btn && <button className={styles.liveCommunityBtn}>{aiServicesItems[3].action_btn}</button>}
              <div className={styles.avatarCluster}>
                <div className={styles.avatarClusterInner}>
                  {COMMUNITY_AVATARS.map((src, i) => (
                    <img key={i} src={src} alt="" width="36" height="36" className={`${styles.clusterAvatar} ${styles[`ca${i + 1}`]}`} loading="lazy" />
                  ))}
                  <div className={`${styles.clusterAvatar} ${styles.ca6} ${styles.clusterCount}`}>
                    <span>+{onlineCount}</span>
                    <span>Online</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile AI Services grid */}
      {aiServicesItems.length > 0 && (
        <AiServicesSection sectionData={aiServicesData} styles={styles} onlineCount={onlineCount} />
      )}
    </>
  );
};

// ─── Three-Col Group Renderer ─────────────────────────────────────────────────

const ThreeColGroupLayout = ({ sections, styles }) => {
  // Sort by list_order to determine column placement
  const sorted = useMemo(() => [...sections].sort((a, b) => (a.list_order || 0) - (b.list_order || 0)), [sections]);

  if (!sorted.length) return null;

  const renderThreeColContent = (section) => {
    if (!section) return null;
    switch (section.display_type) {
      case "astrologers-by-category":
        return <AstrologersByCategorySection sectionData={section} styles={styles} />;
      case "ai-agentic":
        return (
          <div className={styles.calendarBox}>
            <Suspense fallback={null}><AgenticCalendarV2 styles={styles} /></Suspense>
          </div>
        );
      case "discover-more":
        return <DiscoverMoreSectionV2 sectionData={section} styles={styles} />;
      case "live-widget":
        return <LiveSessionCard styles={styles} />;
      default:
        return null;
    }
  };

  return (
    <section className={styles.threeColSection}>
      {sorted.map(section => (
        <Fragment key={section._id || section.list_order}>
          {renderThreeColContent(section)}
        </Fragment>
      ))}
    </section>
  );
};

// ─── Standalone Renderers for Hero/ThreeCol types when ungrouped ──────────────

const renderUngroupedHeroSection = (section, props) => {
  const { styles, navigate, name, currentMahadasha, wowSections, wowSuiteItems, handleWowCardClick, onlineCount } = props;
  const dt = section.display_type;
  const key = `ungrouped-${section.list_order}-${dt}`;

  switch (dt) {
    case "complementary-services": {
      const content = sortContentByOrder(section.content || []);
      if (!content.length) return null;
      return <div key={key}><ComplementaryServicesSection sectionData={{ content }} styles={styles} /></div>;
    }
    case "ai-powered-astrology":
      return (
        <section key={key} className={styles.heroBanner} style={{ margin: '16px 0' }}>
          <div className={styles.heroContent}>
            <p className={styles.greeting}>Hello, {name}! 👋</p>
            <h1>{section.title ? <>{section.title.replace(" AI", "")} <span className={styles.ai}>AI</span></> : <>Experience Astrology<br />Powered by <span className={styles.ai}>AI</span></>}</h1>
            {currentMahadasha && <div className={styles.mahadashaTag}>🪐 Current Mahadasha: <strong>{currentMahadasha.name}</strong></div>}
          </div>
          <div className={styles.heroBgImg}>
            <div className={styles.heroBgGlow} />
            <img src={heroBg} alt="" loading="eager" fetchPriority="high" width="350" height="350" decoding="async" />
          </div>
        </section>
      );
    case "muharat-widget":
      return <div key={key}><MuhuratSectionV2 sectionData={section} styles={styles} /></div>;
    case "ai-services": {
      const items = sortContentByOrder(section.content || []);
      if (!items.length) return null;
      return <div key={key}><AiServicesSection sectionData={section} styles={styles} onlineCount={onlineCount} /></div>;
    }
    default:
      return null;
  }
};

const renderUngroupedThreeColSection = (section, props) => {
  const { styles } = props;
  const dt = section.display_type;
  const key = `ungrouped-${section.list_order}-${dt}`;

  switch (dt) {
    case "astrologers-by-category":
      return <div key={key}><AstrologersByCategorySection sectionData={section} styles={styles} /></div>;
    case "ai-agentic":
      return <div key={key} className={styles.calendarBox}><Suspense fallback={null}><AgenticCalendarV2 styles={styles} /></Suspense></div>;
    case "discover-more":
      return <div key={key}><DiscoverMoreSectionV2 sectionData={section} styles={styles} /></div>;
    case "live-widget":
      return <div key={key}><LiveSessionCard styles={styles} /></div>;
    default:
      return null;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HomeV2 = () => {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);
  const name = selectedKundli?.name?.split(" ")[0] || user?.firstName || "Guest";

  const [onlineCount] = useState(() => {
    const stored = sessionStorage.getItem("liveCommunityCount");
    if (stored) {
      const increment = Math.floor(Math.random() * 21) + 30;
      const newCount = Number(stored) + increment;
      if (newCount > 500) { const reset = Math.floor(Math.random() * 401) + 100; sessionStorage.setItem("liveCommunityCount", reset); return reset; }
      sessionStorage.setItem("liveCommunityCount", newCount);
      return newCount;
    }
    const initial = Math.floor(Math.random() * 401) + 100;
    sessionStorage.setItem("liveCommunityCount", initial);
    return initial;
  });

  useEffect(() => { document.body.classList.add('home-v2-page'); return () => document.body.classList.remove('home-v2-page'); }, []);

  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [pendingConnectionType, setPendingConnectionType] = useState(null);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const { data: newHomeData, isLoading: isHomeLoading } = useGetNewHomeDetailsQuery();
  const homeList = newHomeData?.data?.list;

  const sortedSections = useMemo(() => sortSections(homeList), [homeList]);
  const renderPlan = useMemo(() => buildRenderPlan(sortedSections), [sortedSections]);

  const { data: aiSuitesData } = useGetAiSuitesQuery();
  const wowSections = useMemo(() => {
    const list = aiSuitesData?.data?.list || [];
    if (list.length > 0) return list;
    return [{ title: "WOW SUITE", content: [
      { icon: vastuIcon, title: "AR Vastu\nScanner", slug: "ar-vastu-scanner" },
      { icon: palmIcon, title: "Ai Palmistry\nScanner", slug: "ai-palmistry" },
      { icon: faceIcon, title: "Astro Face\nReading", slug: "astro-face-reading" },
      { icon: signatureIcon, title: "AI Signature\nAnalysis", slug: "ai-signature" },
    ]}];
  }, [aiSuitesData]);
  const wowSuiteItems = useMemo(() => ({ title: wowSections[0]?.title || "WOW SUITE" }), [wowSections]);

  const getWowCardPath = useCallback((item) => {
    if (!item.slug) return null;
    if (item.slug === "ar-vastu-scanner") return null;
    return `/ai-wow/${item.slug}`;
  }, []);

  const handleWowCardClick = useCallback((item, e) => {
    if (!item.slug) return;
    if (e) e.preventDefault();
    if (item.slug === "ar-vastu-scanner") { setShowMobileAppModal(true); return; }
    const path = `/ai-wow/${item.slug}`;
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) { localStorage.setItem("shubhtalk_redirect_after_login", path); window.location.href = "/login?skip=welcome"; return; }
    navigate(path);
  }, [navigate]);

  // Mahadasha
  const kundliProfile = useSelector(s => s.aiwow?.selectedKundliProfile);
  const kundliParams = useMemo(() => {
    if (!kundliProfile) return null;
    return { dob: kundliProfile.dob, tob: kundliProfile.tob, lat: kundliProfile.lat, lon: kundliProfile.lon, tz: kundliProfile.tz || 5.5, lang: "en" };
  }, [kundliProfile]);
  const { data: mahadashaData } = useGetCurrentMahadashaFullQuery(kundliParams, { skip: !kundliParams });
  const currentMahadasha = mahadashaData?.response?.mahadasha?.find(m => { const now = Date.now(); return new Date(m.start).getTime() <= now && new Date(m.end).getTime() >= now; });

  // ─── Connection Hooks ─────────────────────────────────────────────────────
  const { profiles, isCreating, showAddProfile, showEditProfile, formData, editFormData, setShowAddProfile, setShowEditProfile, setFormData, setEditFormData, handleAddProfile, handleSubmitProfile, handleSubmitEditProfile, formatProfileDisplay } = useProfileManager();
  const { handleChatStart, handleCallStart, openModal: hookOpenModal, setOpenModal: hookSetOpenModal, selectedAstrologer: hookSelectedAstrologer, activeCallAstroRef, hasKundli, kundliRef } = useAstrologerConnect();
  const { connectionType, localSelectedProfile, setLocalSelectedProfile, setSelectedAstrologer: setAstrologerRef } = useAstrologerConnection(activeCallAstroRef, kundliRef.current);

  const handleProfileManagerStartCall = useCallback(() => {
    if (selectedAstrologer && pendingConnectionType) {
      if (pendingConnectionType === "chat") handleChatStart(selectedAstrologer);
      else handleCallStart(selectedAstrologer, "audio");
      setPendingConnectionType(null);
    }
  }, [selectedAstrologer, pendingConnectionType, handleChatStart, handleCallStart]);

  const handleConnectClick = useCallback(async (astrologer, connType, isEmergency = false) => {
    if (!requireAuth()) return;
    setSelectedAstrologer(astrologer);
    setAstrologerRef(astrologer);
    if (hasKundli) {
      let result;
      if (connType === "chat") result = await handleChatStart(astrologer, true, isEmergency);
      else result = await handleCallStart(astrologer, "audio", isEmergency);
      if (result?.emergencyAvailable) { setShowEmergencyModal(true); return; }
    } else { setPendingConnectionType(connType); hookSetOpenModal(prev => ({ ...prev, kundli: true })); }
  }, [requireAuth, hasKundli, handleChatStart, handleCallStart, setAstrologerRef, hookSetOpenModal]);

  // ─── Memoized modal handlers ──────────────────────────────────────────────
  const handleEmergencyClose = useCallback(() => setShowEmergencyModal(false), []);
  const handleEmergencyChatNow = useCallback((a) => handleConnectClick(a, "chat", true), [handleConnectClick]);
  const handleEmergencyCallNow = useCallback((a) => handleConnectClick(a, "audio", true), [handleConnectClick]);
  const handleMobileAppClose = useCallback(() => setShowMobileAppModal(false), []);
  const handleRechargeClose = useCallback(() => hookSetOpenModal((prev) => ({ ...prev, recharge: false })), [hookSetOpenModal]);

  // ─── Shared props for group renderers ─────────────────────────────────────
  const heroProps = { styles, navigate, name, currentMahadasha, wowSections, wowSuiteItems, handleWowCardClick, getWowCardPath, onlineCount };
  const standaloneOptions = { styles, onConnect: handleConnectClick, navigate, userId: user?.id, astrologerMaleImg };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isHomeLoading || !renderPlan.length) {
    return (
      <div className={styles.page} style={{ minHeight: "100vh" }}>
        {/* Hidden LCP image for browser preload — visible only to paint engine */}
        <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
          <img src={heroBg} alt="" loading="eager" fetchPriority="high" width="350" height="350" decoding="async" />
        </div>
      </div>
    );
  }

  return (
    <>
      <SeoHelmet data={newHomeData?.data} />
      <WelcomeBonusModal />
      <div className={styles.page}>
        {renderPlan.map((block, idx) => {
          switch (block.type) {
            case "hero-group":
              return <HeroGroupLayout key={`hero-${idx}`} sections={block.sections} {...heroProps} />;

            case "three-col-group":
              return <ThreeColGroupLayout key={`threecol-${idx}`} sections={block.sections} styles={styles} />;

            case "standalone": {
              const section = block.section;
              const family = getStandaloneFamily(section.display_type);

              if (family === "hero") return renderUngroupedHeroSection(section, heroProps);
              if (family === "three-col") return renderUngroupedThreeColSection(section, { styles });
              return renderStandaloneSection(section, standaloneOptions);
            }

            default:
              return null;
          }
        })}
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <ProfileModals profiles={profiles} isCreating={isCreating} showAddProfile={showAddProfile} showEditProfile={showEditProfile} formData={formData} editFormData={editFormData} setShowAddProfile={setShowAddProfile} setShowEditProfile={setShowEditProfile} setFormData={setFormData} setEditFormData={setEditFormData} handleAddProfile={handleAddProfile} handleSubmitProfile={handleSubmitProfile} handleSubmitEditProfile={handleSubmitEditProfile} formatProfileDisplay={formatProfileDisplay} openModal={hookOpenModal} setOpenModal={hookSetOpenModal} selectedAstrologer={hookSelectedAstrologer} localSelectedProfile={localSelectedProfile} setLocalSelectedProfile={setLocalSelectedProfile} onContinue={handleProfileManagerStartCall} connectionType={connectionType} />
        <EmergencySessionModal isOpen={showEmergencyModal} onClose={handleEmergencyClose} astrologer={selectedAstrologer} onChatNow={handleEmergencyChatNow} onCallNow={handleEmergencyCallNow} />
        <MobileAppModal isOpen={showMobileAppModal} onClose={handleMobileAppClose} />
      </Suspense>
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={handleRechargeClose}
        astrologer={hookSelectedAstrologer}
        connectionType={pendingConnectionType || "chat"}
      />
      <PanditAIBubble />
      <PanditAIVoiceBubble />
    </>
  );
};

// Helper to determine family for standalone rendering
function getStandaloneFamily(displayType) {
  if (["complementary-services", "ai-powered-astrology", "muharat-widget", "ai-services"].includes(displayType)) return "hero";
  if (["astrologers-by-category", "ai-agentic", "discover-more"].includes(displayType)) return "three-col";
  return "standalone";
}

export default HomeV2;
