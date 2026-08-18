import styles from "./HomeV2.module.scss";
import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import SeoHelmet from "../../../component/SeoHelmet";
import { getUserFromStorage } from "../../../utils/authStorage";
import { getToken } from "../../../utils/token";
import {
  homeApi,
  useGetNewHomeDetailsQuery,
  useLazyGetNewHomeSectionsQuery,
  HOME_FIRST_PAGE_ARG,
  HOME_SECTIONS_PAGE_SIZE,
  HOME_SECTIONS_MAX_PAGES,
} from "../../../services/appServices/homeServices";
import { useGetCurrentMahadashaFullQuery } from "../../../redux/api/kundli/dashaApi";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useAstrologerConnection } from "../home/hooks/useAstrologerConnection";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import { useLazyGetSubscriptionStatusQuery } from "../../../redux/api/subscription/subscriptionApi";
// Both bubbles are `position: fixed` launchers, so they are always in the
// viewport and always compete to be the LCP element — Lighthouse reported the
// Pandit AI bubble as LCP. Their SCSS also pulls ~108KB of decorative
// background SVG (AiPanditBg.svg + wire-bg.svg) into the critical path, and a
// CSS background can never be discovered from the initial HTML nor given
// fetchpriority. Loading them after first paint takes them out of the LCP race
// entirely so real content wins it.
const PanditAIBubble = lazy(() => import("../../../component/panditAI/PanditAIBubble"));
const PanditAIVoiceBubble = lazy(() => import("../../../component/panditAI/PanditAIVoiceBubble"));
import { useGuestConnectFlow } from "../../public/guestChat/useGuestConnectFlow";
import RechargeModal from "../../../component/recharge-modal/RechargeModal";

// Dynamic section rendering
import { sortSections, sortContentByOrder, buildRenderPlan, renderStandaloneSection } from "./sectionRendererV2";
import { ComplementaryServicesSection, AiServicesSection, MuhuratSectionV2, AstrologersByCategorySection, DiscoverMoreSectionV2, LiveSessionCard } from "./sections";

// Below-the-fold components (static — shared with many other pages)
import ProfileModals from "../../private/kundli/components/ProfileModals";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
import MobileAppModal from "../../private/aiwow/components/MobileAppModal";
// Statically imported on purpose. Eight other modules (the AI-Wow result
// screens, useAIWowSubscriptionGate and the user Profile screen) import this
// statically, so it lands in the main chunk regardless — a lazy() here bought
// no split and only made Vite warn about the mixed import.
import SubscriptionModal from "../../../component/UI/modal/SubscriptionModal/SubscriptionModal";
import { GuestKundliAuthModal } from "../../../component/UI/Profile";

/*
 * Identity of a CMS section, used to drop anything already held while paging.
 *
 * `_id` is what the CMS sends; the display_type/list_order pair is a fallback for
 * a payload that omits it. This matters for more than tidiness: if the backend
 * ignores pageNo and returns the same full list for every page, the duplicates
 * are what tells HomeV2 to stop paging instead of appending the whole list again.
 */
const sectionIdentity = (section) => {
  if (!section) return null;
  return section._id || `${section.display_type || ""}#${section.list_order ?? ""}`;
};
import HomeIntroPopup from "./HomeIntroPopup";
const AgenticCalendarV2 = lazy(() => import("./AgenticCalendarV2"));

// Fallback images
import kundliImg from "../../../assets/images/home-hero-kundli.png";
import astrologerImg from "../../../assets/images/home-hero-astrologer.png";
import horoscopeImg from "../../../assets/images/home-hero-horoscope.png";
import defaultSquareImg from "../../../assets/images/default_image_square_500x500.png";

// Community avatars — loaded lazily via URL (below-the-fold, decorative)
const COMMUNITY_AVATARS = [
  new URL("../../../assets/images/community-avatar-1.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-2.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-3.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-4.png", import.meta.url).href,
  new URL("../../../assets/images/community-avatar-5.png", import.meta.url).href,
];
const heroBg = "https://assets.shubhastro.ai/images/ai-suite.png";

/**
 * "Sign in" affordance inside the guest greeting.
 *
 * This used to be an onClick + underline on the whole `<p>`, with the hint as a
 * 12px inline span. The handler worked, but the actual target was a short run of
 * small text inside a paragraph — so a near-miss landed on the surrounding
 * padding and did nothing, which is how it shows up as a dead click on the one
 * element a guest reaches for to sign in. As a real button it gets a padded hit
 * area, keyboard access and a proper accessible name.
 */
const GuestSignInLink = ({ onClick }) => (
  <button type="button" className={styles.guestSignInLink} onClick={onClick}>
    Sign in
  </button>
);

// ─── Hero Group Renderer ──────────────────────────────────────────────────────

const HeroGroupLayout = ({ sections, styles, navigate, name, currentMahadasha, handleWowCardClick, getWowCardPath, onlineCount, onPaidCardClick, onLiveCommunityClick, onRequireGuestAuth }) => {
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
                <p className={styles.greeting} key={`greeting-${name}`}>
                  Hello, {name}! 👋 {name === "Guest" && <GuestSignInLink onClick={() => navigate("/login")} />}
                </p>
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
                  <h2 className={styles.wowTitle}>{section.sub_title || "Your AI Suite"}</h2>
                  <div className={styles.BottomDevider}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
                      <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
                    </svg>
                  </div>
                </div>
                {/* <button className={styles.wowViewMore} onClick={() => navigate('/ai-wow')}>View More &rsaquo;</button> */}
              </div>
              <div className={styles.wowGrid}>
                {sortContentByOrder(section.content || []).map((item, i) => {
                  const path = getWowCardPath(item);
                  const iconSrc = item.icon || item.image_url_web || item.iconUrl || item.icon_url || item.image_url_app;
                  // Show the "Paid" ribbon on premium suite cards.
                  const premium = item.isPaid === true;
                  const paidLabel = premium ? "Paid" : null;
                  const cardIcon = (
                    <div className={styles.wowIconBox}>
                      <img src={iconSrc || defaultSquareImg} alt="" width="40" height="40" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = defaultSquareImg; }} />
                    </div>
                  );
                  // Premium cards open the premium plans modal instead of navigating.
                  if (premium) {
                    return (
                      <div key={`${item.ID || item.slug}-${i}`} className={styles.wowCard} onClick={() => onPaidCardClick(item)} style={{ cursor: 'pointer' }}>
                        {/* Paid ribbon hidden temporarily */}
                        {/* {paidLabel && <span className={styles.wowPaidRibbon}>{paidLabel}</span>} */}
                        {cardIcon}
                        <span className={styles.wowCardTitle}>{item.title}</span>
                      </div>
                    );
                  }
                  return path ? (
                    <Link key={`${item.ID || item.slug}-${i}`} className={styles.wowCard} to={path} onClick={(e) => handleWowCardClick(item, e)} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                      {paidLabel && <span className={styles.wowPaidRibbon}>{paidLabel}</span>}
                      <div className={styles.wowIconBox}>
                        <img src={iconSrc || defaultSquareImg} alt="" width="40" height="40" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = defaultSquareImg; }} />
                      </div>
                      <span className={styles.wowCardTitle}>{item.title}</span>
                    </Link>
                  ) : (
                    <div key={`${item.ID || item.slug}-${i}`} className={styles.wowCard} onClick={(e) => handleWowCardClick(item, e)} style={{ cursor: item.slug ? 'pointer' : 'default' }}>
                      {paidLabel && <span className={styles.wowPaidRibbon}>{paidLabel}</span>}
                      <div className={styles.wowIconBox}>
                        <img src={iconSrc || defaultSquareImg} alt="" width="40" height="40" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = defaultSquareImg; }} />
                      </div>
                      <span className={styles.wowCardTitle}>{item.title}</span>
                    </div>
                  );
                })}
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
              {(aiServicesItems[0]?.image_url_web || aiServicesItems[0]?.icon) && <img src={aiServicesItems[0].image_url_web || aiServicesItems[0].icon} alt="" width="120" height="120" className={styles.laalKitaabImgLeft} loading="lazy" />}
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
                  {(aiServicesItems[1]?.image_url_web || aiServicesItems[1]?.icon) && <img src={aiServicesItems[1].image_url_web || aiServicesItems[1].icon} alt="" width="100" height="100" className={styles.fcCardImg} loading="lazy" />}
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
                  {(aiServicesItems[2]?.image_url_web || aiServicesItems[2]?.icon) && <img src={aiServicesItems[2].image_url_web || aiServicesItems[2].icon} alt="" width="100" height="100" className={styles.fcCardImg} loading="lazy" />}
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
            <div className={`${styles.liveCommunityCard} ${styles.desktopOnly}`} onClick={() => onLiveCommunityClick(aiServicesItems[3])} style={{ cursor: aiServicesItems[3]?.redirect_url || aiServicesItems[3]?.link ? 'pointer' : 'default' }}>
              <span className={styles.featureTag}>New</span>
              <h3 className={styles.liveCommunityTitle}>{aiServicesItems[3]?.display_title || aiServicesItems[3]?.title}</h3>
              {aiServicesItems[3]?.description && <p className={styles.liveCommunityDesc}>{aiServicesItems[3].description}</p>}
              {aiServicesItems[3]?.action_btn && <button className={styles.liveCommunityBtn}>{aiServicesItems[3].action_btn}</button>}
              <div className={styles.avatarCluster}>
                <div className={styles.avatarClusterInner}>
                  {aiServicesItems[3]?.image_url_web || aiServicesItems[3]?.icon ? (
              <img
                src={aiServicesItems[3]?.image_url_web || aiServicesItems[3]?.icon}
                alt=""
                width="200"
                height="200"
                loading="lazy"
              />
            ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile AI Services grid */}
      {aiServicesItems.length > 0 && (
        <AiServicesSection sectionData={aiServicesData} styles={styles} onlineCount={onlineCount} onRequireGuestAuth={onRequireGuestAuth} />
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
        return <LiveSessionCard styles={styles} sectionData={section} />;
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
  const { styles, navigate, name, currentMahadasha, handleWowCardClick, onlineCount, onRequireGuestAuth } = props;
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
            <p className={styles.greeting}>
              Hello, {name}! 👋 {name === "Guest" && <GuestSignInLink onClick={() => navigate("/login")} />}
            </p>
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
      return <div key={key}><AiServicesSection sectionData={section} styles={styles} onlineCount={onlineCount} onRequireGuestAuth={onRequireGuestAuth} /></div>;
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
      return <div key={key}><LiveSessionCard styles={styles} sectionData={section} /></div>;
    default:
      return null;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HomeV2 = () => {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const { openGuestConnect, guestConnectModal } = useGuestConnectFlow();
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [pendingServiceItem, setPendingServiceItem] = useState(null);
  const [triggerSubscriptionStatus] = useLazyGetSubscriptionStatusQuery();
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingWowPathRef = useRef(null);

  // Mount the floating Pandit AI launchers only once the browser is idle, so
  // they are absent from the DOM while the LCP candidate is being decided.
  const [showFloatingBubbles, setShowFloatingBubbles] = useState(false);
  useEffect(() => {
    const reveal = () => setShowFloatingBubbles(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    // Safari has no requestIdleCallback.
    const timer = setTimeout(reveal, 1200);
    return () => clearTimeout(timer);
  }, []);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const dispatch = useDispatch();
  /*
   * The CMS section list. Only the first HOME_SECTIONS_PAGE_SIZE sections are
   * requested up front — enough for the hero group and everything above the fold
   * — so the first render waits on a fraction of the ~87 KB payload. The effect
   * below appends the remaining pages into this same cache entry after paint, so
   * `homeSections` grows from page 1 to the full list.
   */
  const { data: newHomeData, isLoading: isHomeLoading } = useGetNewHomeDetailsQuery(HOME_FIRST_PAGE_ARG);
  const homeSections = newHomeData?.data?.list;

  const [fetchHomeSectionsPage] = useLazyGetNewHomeSectionsQuery();
  /*
   * Highest page already requested. Without it, a page that comes back empty or
   * entirely duplicated would leave the section count unchanged and this effect
   * would ask for the same page forever.
   */
  const requestedPageRef = useRef(1);

  /*
   * Pulls the next page and appends it into the page-1 cache entry, one page per
   * run — appending grows `homeSections`, which re-runs this effect for the page
   * after it, until a short page or a duplicate page stops the walk.
   *
   * The sections are written into the RTK cache rather than kept in component
   * state on purpose. useAstrologerStatusSocket keeps astrologer cards live by
   * walking the cache and patching matching records through updateQueryData; a
   * private copy in component state is invisible to it, and because Immer
   * produces new objects the copy would keep rendering the pre-patch data. That
   * is not hypothetical here: all three astrologer-grid sections sit at
   * list_order 6, 7 and 11, so every card on the homepage arrives in an appended
   * page. Holding them outside the cache stopped chat/call availability from
   * updating without a reload.
   */
  useEffect(() => {
    const loadedCount = Array.isArray(homeSections) ? homeSections.length : 0;
    if (loadedCount === 0) return;
    /*
     * A partial page means the server has nothing left — which is also what a
     * server that ignores pageNo/limit returns on the first request, so that case
     * stays a single request.
     */
    if (loadedCount % HOME_SECTIONS_PAGE_SIZE !== 0) return;

    const nextPage = loadedCount / HOME_SECTIONS_PAGE_SIZE + 1;
    if (nextPage > HOME_SECTIONS_MAX_PAGES) return;
    if (nextPage <= requestedPageRef.current) return;
    requestedPageRef.current = nextPage;

    let cancelled = false;

    const loadNextPage = async () => {
      let list;
      try {
        // preferCacheValue: a lazy trigger refetches by default, which would
        // re-request every page each time the visitor navigates back to "/".
        const response = await fetchHomeSectionsPage({ pageNo: nextPage }, true).unwrap();
        list = response?.data?.list;
      } catch {
        // Below-the-fold content is best effort. The visible page is already
        // rendered, and the endpoint's own error handling has run.
        return;
      }
      if (cancelled || !Array.isArray(list) || list.length === 0) return;

      const held = new Set(homeSections.map(sectionIdentity));
      const fresh = list.filter((section) => {
        const id = sectionIdentity(section);
        if (!id || held.has(id)) return false;
        held.add(id);
        return true;
      });
      if (fresh.length === 0) return;

      dispatch(
        homeApi.util.updateQueryData("getNewHomeDetails", HOME_FIRST_PAGE_ARG, (draft) => {
          if (Array.isArray(draft?.data?.list)) draft.data.list.push(...fresh);
        })
      );
    };

    /*
     * Deferred to idle so these requests never contend with the first paint or
     * with the LCP image, which is the whole point of shrinking page 1.
     */
    let idleId;
    let timerId;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(loadNextPage, { timeout: 3000 });
    } else {
      // Safari has no requestIdleCallback.
      timerId = setTimeout(loadNextPage, 800);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [homeSections, fetchHomeSectionsPage, dispatch]);

  const sortedSections = useMemo(() => sortSections(homeSections), [homeSections]);
  const renderPlan = useMemo(() => buildRenderPlan(sortedSections), [sortedSections]);

  // Path resolver for an AI suite card based on its source
  const getWowCardPath = useCallback((item) => {
    if (!item) return null;
    // quick-link-section items use their redirect_url directly
    if (item.source === "quick-link-section") {
      if (item.is_internal === true || item.is_internal === "true") {
        const target = item.redirect_url || item.slug;
        if (!target) return null;
        return target.startsWith("/") ? target : `/${target}`;
      }
      return null; // external links handled in click handler
    }
    // ai-model items
    if (!item.slug) return null;
    if (item.slug === "ar-vastu-scanner") return null;
    return `/ai-wow/${item.slug}`;
  }, []);

  const handleWowCardClick = useCallback((item, e) => {
    if (!item) return;
    if (e) e.preventDefault();

    // quick-link-section items
    if (item.source === "quick-link-section") {
      const target = item.redirect_url || item.slug;
      if (!target) return;
      if (item.is_internal === true || item.is_internal === "true") {
        const path = target.startsWith("/") ? target : `/${target}`;
        // Guests: kundli-based features open the add-kundli guest flow instead
        // of navigating to a page that would bounce them to login. This covers
        // AI-Wow features and Kundli "free-report" deep links (e.g. Gemstone
        // Remedy → /kundli?tab=free-report&subtab=remedies&section=gemstones).
        // The plain Free Kundli generator stays public.
        const token = localStorage.getItem("shubhtalk_customer_token");
        const needsKundliAuth =
          path.startsWith("/ai-wow") ||
          path.startsWith("/aiwow") ||
          path.includes("tab=free-report");
        if (!token && needsKundliAuth) {
          pendingWowPathRef.current = path;
          setShowGuestAuthModal(true);
          return;
        }
        navigate(path);
      } else if (item.redirect_url) {
        window.open(item.redirect_url, "_blank", "noopener,noreferrer");
      } else {
        navigate(target.startsWith("/") ? target : `/${target}`);
      }
      return;
    }

    // ai-model items
    if (!item.slug) return;
    if (item.slug === "ar-vastu-scanner") { setShowMobileAppModal(true); return; }
    const path = `/ai-wow/${item.slug}`;
    // Allow guest users to view intro pages for these features
    const guestAccessSlugs = ["ai-palmistry-scanner", "astro-face-reading", "signature-analysis", "clothes-colour-analysis", "gemstone-authenticity", "aura-photography", "dream-interpreter"];
    if (guestAccessSlugs.includes(item.slug)) { navigate(path); return; }
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      // Guests: open the add-kundli guest flow instead of redirecting to login.
      pendingWowPathRef.current = path;
      setShowGuestAuthModal(true);
      return;
    }
    navigate(path);
  }, [navigate]);

  const handleGuestAuthSuccess = useCallback(() => {
    setShowGuestAuthModal(false);
    const path = pendingWowPathRef.current;
    pendingWowPathRef.current = null;
    if (path) navigate(path);
  }, [navigate]);

  // Live Community card: guests get the inline guest login popup (instead of
  // being redirected to /login by the guarded live page) and are taken to the
  // live page after registering.
  const handleLiveCommunityClick = useCallback((item) => {
    const url = item?.redirect_url || item?.link || "/live";
    if (!url) return;
    if (!getToken()) {
      pendingWowPathRef.current = url;
      setShowGuestAuthModal(true);
      return;
    }
    navigate(url);
  }, [navigate]);

  // Opens the guest login popup for an auth-required destination (e.g. the
  // mobile AI-services live card), navigating to `url` after registration.
  const handleRequireGuestAuth = useCallback((url) => {
    pendingWowPathRef.current = url;
    setShowGuestAuthModal(true);
  }, []);

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
    // Guest flows (no login redirect):
    //  - chat → conversational guest screen
    //  - call/video → AI Wow-style guest modal, then initiate the call
    if (!getToken()) {
      if (connType === "chat") {
        navigate(`/guest-chat/${astrologer._id}`, { state: { astrologer } });
      } else {
        openGuestConnect(astrologer, connType);
      }
      return;
    }
    if (!requireAuth()) return;
    setSelectedAstrologer(astrologer);
    setAstrologerRef(astrologer);
    if (hasKundli) {
      let result;
      if (connType === "chat") result = await handleChatStart(astrologer, true, isEmergency);
      else result = await handleCallStart(astrologer, "audio", isEmergency);
      if (result?.emergencyAvailable) { setShowEmergencyModal(true); return; }
    } else { setPendingConnectionType(connType); hookSetOpenModal(prev => ({ ...prev, kundli: true })); }
  }, [requireAuth, hasKundli, handleChatStart, handleCallStart, setAstrologerRef, hookSetOpenModal, navigate, openGuestConnect]);

  // ─── Memoized modal handlers ──────────────────────────────────────────────
  const handleEmergencyClose = useCallback(() => setShowEmergencyModal(false), []);
  const handleEmergencyChatNow = useCallback((a) => handleConnectClick(a, "chat", true), [handleConnectClick]);
  const handleEmergencyCallNow = useCallback((a) => handleConnectClick(a, "audio", true), [handleConnectClick]);
  const handleMobileAppClose = useCallback(() => setShowMobileAppModal(false), []);
  const handlePaidCardClick = useCallback(async (item) => {
    // AR Vastu Scanner is an app-only feature — show its modal directly, with no
    // login or subscription gating.
    if (item?.slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
      return;
    }
    // Guests can open the intro pages for these features without logging in.
    const guestAccessSlugs = ["ai-palmistry-scanner", "astro-face-reading", "signature-analysis", "clothes-colour-analysis", "gemstone-authenticity", "aura-photography"];
    if (guestAccessSlugs.includes(item?.slug)) {
      handleWowCardClick(item);
      return;
    }
    // Guests: open the add-kundli guest flow (collect kundli + verify OTP)
    // instead of bouncing to /login. handleWowCardClick shows the
    // GuestKundliAuthModal and navigates to the feature after auth.
    if (!getToken()) {
      handleWowCardClick(item);
      return;
    }
    // Logged-in users: check subscription before opening the paid feature.
    if (!requireAuth()) return;
    // Remember which service was requested so "Unlock Now" (free plan) can open it.
    setPendingServiceItem(item);
    try {
      const res = await triggerSubscriptionStatus().unwrap();
      if (res?.data?.hasActiveSubscription) {
        // Subscribed → open the service like a normal suite card.
        handleWowCardClick(item);
      } else {
        // Not subscribed → show the subscription modal.
        setShowSubscriptionModal(true);
      }
    } catch {
      // On any error fetching status, fall back to showing the subscription modal.
      setShowSubscriptionModal(true);
    }
  }, [requireAuth, triggerSubscriptionStatus, handleWowCardClick]);

  // Free plan "Unlock Now" → close the modal and open the requested service.
  const handleFreeUnlock = useCallback(() => {
    setShowSubscriptionModal(false);
    if (pendingServiceItem) handleWowCardClick(pendingServiceItem);
  }, [pendingServiceItem, handleWowCardClick]);

  const handleRechargeClose = useCallback(() => hookSetOpenModal((prev) => ({ ...prev, recharge: false })), [hookSetOpenModal]);

  // ─── Shared props for group renderers ─────────────────────────────────────
  const heroProps = { styles, navigate, name, currentMahadasha, handleWowCardClick, getWowCardPath, onlineCount, onPaidCardClick: handlePaidCardClick, onLiveCommunityClick: handleLiveCommunityClick, onRequireGuestAuth: handleRequireGuestAuth };
  const standaloneOptions = { styles, onConnect: handleConnectClick, navigate, userId: user?.id };

  // ─── Render ───────────────────────────────────────────────────────────────
  /*
   * This branch renders nothing visible until the CMS list arrives, which is why
   * the homepage LCP breakdown is ~98% "element render delay": the hero image
   * itself resolves in ~40 ms (it is preloaded in index.html with
   * fetchpriority=high) and then waits for JS execute + the homepage API before
   * React can commit the element that displays it.
   *
   * A 0x0 overflow:hidden copy of the hero image used to sit here, labelled as an
   * LCP preload. It could not have that effect: LCP only considers elements with
   * a non-zero painted area, and a production trace confirmed it — the first LCP
   * candidate for this URL appeared at 1672 ms (the real 230x230 hero), not at
   * first paint when the hidden copy was already in the DOM. Its only real effect
   * was warming the cache, which the index.html preload of the identical URL
   * already does, so it has been removed rather than left as a false mitigation.
   */
  if (isHomeLoading || !renderPlan.length) {
    return <div className={styles.page} style={{ minHeight: "100vh" }} />;
  }

  return (
    <>
      <SeoHelmet data={newHomeData?.data} />
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
        <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} onSelectPlan={handleFreeUnlock} />
        <GuestKundliAuthModal
          isOpen={showGuestAuthModal}
          onClose={() => { setShowGuestAuthModal(false); pendingWowPathRef.current = null; }}
          onSuccess={handleGuestAuthSuccess}
        />
        {/* Guest call/video flow (AI Wow-style details + OTP, then initiate call) */}
        {guestConnectModal}
      </Suspense>
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={handleRechargeClose}
        astrologer={hookSelectedAstrologer}
        connectionType={pendingConnectionType || "chat"}
      />
      {showFloatingBubbles && (
        <Suspense fallback={null}>
          <PanditAIBubble />
          <PanditAIVoiceBubble />
        </Suspense>
      )}
      <HomeIntroPopup />
    </>
  );
};

// Helper to determine family for standalone rendering
function getStandaloneFamily(displayType) {
  if (["complementary-services", "ai-powered-astrology", "muharat-widget", "ai-services"].includes(displayType)) return "hero";
  if (["astrologers-by-category", "ai-agentic", "discover-more","live-widget"].includes(displayType)) return "three-col";
  return "standalone";
}

export default HomeV2;
