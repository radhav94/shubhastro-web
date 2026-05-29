import { Suspense, useState } from "react";
import styles from "./HomeLayout.module.scss";
import TopHeader from "../component/TopHeader";
import { Outlet, useMatches, useLocation, Link } from "react-router-dom";


import Breadcrumb from "../component/BreadCrumb";
import Footer from "./Footer";
import ScrollToTop from "../component/functions/ScrollToTop";
import CircleSpinner from "../component/UI/CircleSpinner";
import VideoCallContainer from "../component/call/VideoCallContainer";
import StickyChatFooter from "../screens/private/home/components/chats/StickyChatFooter";
import StickyCallFooter from "../screens/private/home/components/call/StickyCallFooter";
import StickyReview from "../screens/private/home/components/call/StickyReview";
import StickyWaitingQueue from "../component/UI/waitingQueue/StickyWaitingQueue";


import NoInternet, { useOnlineStatus } from "../component/NoInternet/NoInternet";
import { useAiwowCleanup } from "../utils/hooks/useAiwowCleanup";



const footerLinkSections = [
  {
    label: "Important Links",
    links: [
      { path: "/shubh-muhurat-2026", title: "Shubh Muhurat 2026" },
      { path: "/naam-karan-muhurat", title: "NaamKaran Muhurat 2026" },
      { path: "/marriage-muhurat", title: "Marriage Muhurat 2026" },
      { path: "/bhoomi-pujan-muhurat", title: "Bhoomi Pujan Muhurat 2026" },
      { path: "/griha-pravesh-muhurat", title: "Griha Pravesh Muhurat 2026" },
      { path: "/mundan-muhurat", title: "Mundan Muhurat 2026" },
      { path: "/car-buying-muhurat", title: "Car Buying Muhurat 2026" },
      { path: "/bike-buying-muhurat", title: "Bike Buying Muhurat 2026" },
      { path: "/gold-buying-muhurat", title: "Gold Buying Muhurat 2026" },
      { path: "/how-to-read-kundli", title: "How to Read Kundli" },
      { path: "/astrology-mantras", title: "Astrology Mantras" },
      { path: "/astrology-remedy-job-promotion", title: "Astro Remedy for Job Promotion" },
      { path: "/astrology-remedy-conceive-child", title: "Astro Remedy to Conceive a Child" },
      { path: "/astrology-remedy-quick-marriage", title: "Astro Remedy for Quick Marriage" },
      { path: "/astro-remedy-to-get-new-job", title: "Astro Remedy to Get New Job" },
      { path: "/ar-vastu-scanner", title: "AR Vastu Scanner" },
      { path: "/ai-palmistry-scanner", title: "AI Palmistry Scanner" },
      { path: "/astro-face-reading", title: "Astro Face Reading" },
      { path: "/signature-analysis", title: "Signature Analysis" },
      { path: "/clothes-colour-analysis", title: "Clothes Colour Analysis" },
      { path: "/gemstone-authenticity", title: "Gemstone Authenticity" },
      { path: "/aura-photography", title: "Aura Photography" },
      { path: "/talk-to-your-kundli", title: "Talk to your kundli" },
      { path: "/cosmic-chat", title: "Cosmic Chat" },
      { path: "/daily-cosmic-briefing", title: "Daily Cosmic Briefing" },
      { path: "/dream-interpreter", title: "Dream Interpreter" },
      { path: "/smart-matchmaking", title: "Smart MatchMaking" },
      { path: "/aiwow/muhurat-calendar", title: "Muhurat Calendar" },
    ],
  },
  {
    label: "Important AI Links",
    links: [
      { path: "/ai-love-astrologer", title: "AI Love Astrologer" },
      { path: "/ai-marriage-astrologer", title: "AI Marriage Astrologer" },
      { path: "/ai-health-astrologer", title: "AI Health Astrologer" },
      { path: "/ai-career-astrologer", title: "AI Career Astrologer" },
      { path: "/ai-life-coach-astrologer", title: "AI Life Coach Astrologer" },
      { path: "/ai-wealth-astrologer", title: "AI Wealth Astrologer" },
      { path: "/ai-general-prediction-astrologer", title: "AI General Prediction Astrologer" },
      { path: "/ai-gemstone-astrologer", title: "AI Gemstone Astrologer" },
      { path: "/ai-vedic-astrologer", title: "AI Vedic Astrologer" },
      { path: "/ai-western-astrologer", title: "AI Western Astrologer" },
      { path: "/ai-kp-astrologer", title: "AI KP Astrologer" },
      { path: "/ai-laal-kitab-astrologer", title: "AI Laal Kitab Astrologer" },
      { path: "/ai-horoscope-matching-astrologer", title: "AI Horoscope Matching Astrologer" },
      { path: "/ai-vaastu-astrologer", title: "AI Vaastu Astrologer" },
      { path: "/ai-spiritual-astrologer", title: "AI Spiritual Astrologer" },
      { path: "/ai-occult-astrologer", title: "AI Occult Astrologer" },
    ],
  },
  {
    label: "Celebrity Horoscope",
    links: [
      { path: "/celebrity-horoscope/shahrukh-khan", title: "Shah Rukh Khan Horoscope" },
      { path: "/celebrity-horoscope/amitabh-bachchan", title: "Amitabh Bachchan Horoscope" },
      { path: "/celebrity-horoscope/aishwarya-rai", title: "Aishwarya Rai Horoscope" },
      { path: "/celebrity-horoscope/priyanka-chopra", title: "Priyanka Chopra Horoscope" },
      { path: "/celebrity-horoscope/salman-khan", title: "Salman Khan Horoscope" },
      { path: "/celebrity-horoscope/aamir-khan", title: "Aamir Khan Horoscope" },
      { path: "/celebrity-horoscope/virat-kohli", title: "Virat Kohli Horoscope" },
      { path: "/celebrity-horoscope/ms-dhoni", title: "MS Dhoni Horoscope" },
      { path: "/celebrity-horoscope/narendra-modi", title: "Narendra Modi Horoscope" },
      { path: "/celebrity-horoscope/rahul-gandhi", title: "Rahul Gandhi Horoscope" },
      { path: "/celebrity-horoscope/vaibhav-sooryavanshi", title: "Vaibhav Sooryavanshi Horoscope" },
    ],
  },
  {
    label: "Celebrity Couple Horoscope",
    links: [
      { path: "/celebrity-couple-horoscope/shahrukh-khan-and-Gauri-khan", title: "Shah Rukh Khan & Gauri Khan Horoscope" },
      { path: "/celebrity-couple-horoscope/deepika-padukone-and-ranveer-singh", title: "Deepika Padukone & Ranveer Singh Horoscope" },
      { path: "/celebrity-couple-horoscope/ranvir-kapoor-and-alia-bhatt", title: "Ranbir Kapoor & Alia Bhatt Horoscope" },
      { path: "/celebrity-couple-horoscope/aishwarya-rai-and-abhishek-bachchan", title: "Aishwarya Rai & Abhishek Bachan Horoscope" },
      { path: "/celebrity-couple-horoscope/amitabh-bachchan-and-jaya-bachchan", title: "Amitabh Bachchan & Jaya Bachchan Horoscope" },
      { path: "/celebrity-couple-horoscope/vicky-kaushal-and-katrina-kaif", title: "Vicky Kaushal & Katrina Kaif Horoscope" },
      { path: "/celebrity-couple-horoscope/virat-kohli-and-anuska-sharma", title: "Virat Kohli & Anushka Sharma Horoscope" },
      { path: "/celebrity-couple-horoscope/priyanka-chopra-and-nick-jonas", title: "Priyanka Chopra & Nick Jonas Horoscope" },
      { path: "/celebrity-couple-horoscope/saif-ali-khan-and-kareena-kapoor", title: "Saif Ali Khan & Kareena Kapoor Khan Horoscope" },
    ],
  },
];

const FooterLinkAccordion = ({ sections }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.topLinkMobile}>
      <div className={styles.accordionItem}>
        <button
          className={styles.accordionHeader}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <span>Important Links</span>
          <span className={styles.accordionIcon}>
            {open ? "−" : "+"}
          </span>
        </button>
        {open && (
          <div className={styles.accordionContent}>
            {sections.map((section, index) => (
              <div key={section.label} className={styles.accordionSection}>
                {index > 0 && <p className={styles.accordionSubtitle}>{section.label}</p>}
                <div className={styles.accordionLinks}>
                  {section.links.map((link, i) => (
                    <span key={link.path}>
                      {i > 0 && <span className={styles.accordionSeparator}> | </span>}
                      <Link to={link.path} title={link.title}>
                        {link.title}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HomeLayout = () => {
  const matches = useMatches();
  const location = useLocation();

  const isOnline = useOnlineStatus();

  // Clear aiwow session data when navigating away from aiwow pages
  useAiwowCleanup();



  const currentRoute = matches
    .reverse()
    .find((match) => match.handle && match.handle.header !== undefined);

  const showHeader = currentRoute ? currentRoute.handle.header : false;
  const showFooter = currentRoute ? currentRoute.handle.footer : true;
  const showRouteTopHeader = currentRoute ? currentRoute.handle.topHeader !== false : true;

  // Hide header/footer in webview mode (?type=webview)
  const isWebview = new URLSearchParams(location.search).get("type") === "webview";

  const isOnboardingPage = location.pathname === "/login";
  const isLivePage = location.pathname.startsWith("/live") && !location.pathname.startsWith("/live-chat-policy");
  
  const showTopHeader = showRouteTopHeader && !isOnboardingPage && !isLivePage && !isWebview;

  return (
    <div className={styles.layout}>
      <ScrollToTop />

      {/* NEW TOP HEADER - Hidden on onboarding, iframe, or when header is disabled */}
      {showTopHeader && (
        <div className={styles.fixedTopHeader}>
          <TopHeader />
        </div>
      )}

      {/* FIXED TOPBAR */}
      {/* {showHeader && (
        <div className={styles.fixedTopBar}>
          <TopBar />
        </div>
      )} */}

      {/* Scrollable Content */}
      <div className={styles.contentWrapper} style={!isOnline ? { background: 'transparent' } : {}}>
        <div className={showHeader && !isWebview ? styles.topGap : ""}></div>

        {showHeader && !isWebview && <Breadcrumb />}

        <Suspense fallback={<CircleSpinner />}>
          <div className={styles.outletDiv} style={!isOnline ? { background: 'transparent' } : {}}>
            {/* Always keep Outlet mounted — NoInternet is an overlay so active calls aren't disrupted */}
            <Outlet />
            {!isOnline && (
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <NoInternet />
              </div>
            )}
          </div>
        </Suspense>
      </div>

      {showFooter && !isWebview && (
        <div className={styles.footerWrapper}>
          {location.pathname === "/" && (
          <div className={styles.topLinkWrap}>
            {/* Desktop view - inline links */}
            <div className={styles.topLinkDesktop}>
              {footerLinkSections.map((section) => (
                <div className={styles.topLink} key={section.label}>
                  <span>{section.label} : </span>
                  {section.links.map((link, i) => (
                    <span key={link.path}>
                      {i > 0 && " | "}
                      <Link to={link.path} title={link.title}> {link.title}</Link>
                    </span>
                  ))}
                </div>
              ))}
            </div>
            {/* Mobile view - accordion */}
            <FooterLinkAccordion sections={footerLinkSections} />
          </div>
          )}
          <Footer />
        </div>
      )}

      {/* ✅ FLOATING CALL UI (IMPORTANT LINE) */}
      <VideoCallContainer />



      <StickyChatFooter />
      <StickyCallFooter />
      {!isLivePage && <StickyWaitingQueue />}
      <StickyReview />
    </div>
  );
};

export default HomeLayout;
