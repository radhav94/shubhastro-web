import React, { Suspense } from "react";
import styles from "./HomeLayout.module.scss";
import TopBar from "./topbar/TopBar";
import TopHeader from "../component/TopHeader";
import { Outlet, useMatches, useLocation, useNavigate } from "react-router-dom";
import Divider from "../component/Divider";

import { useIsMobile } from "../utils/hooks/useIsMobile";

import Breadcrumb from "../component/BreadCrumb";
import Footer from "./Footer";
import ScrollToTop from "../component/functions/ScrollToTop";
import CircleSpinner from "../component/UI/CircleSpinner";
import VideoCallContainer from "../component/call/VideoCallContainer";
import StickyChatFooter from "../screens/private/home/components/chats/StickyChatFooter";
import StickyCallFooter from "../screens/private/home/components/call/StickyCallFooter";
import StickyReview from "../screens/private/home/components/call/StickyReview";
import { useCall } from "../context/CallContext";
import { voiceSocket } from "../services/voiceSocketServices";
import WaitingModal from "../component/UI/modal/waitingModal/WaitingModal";
import NoInternet, { useOnlineStatus } from "../component/NoInternet/NoInternet";
import { useAiwowCleanup } from "../utils/hooks/useAiwowCleanup";

const PENDING_LIVE_CALL_STORAGE_KEY = "shubhtalk_pending_live_call";

const HomeLayout = () => {
  const isMobile = useIsMobile();
  const matches = useMatches();
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingLiveCall, setPendingLiveCall, waitingList } = useCall();
  const isOnline = useOnlineStatus();

  // Clear aiwow session data when navigating away from aiwow pages
  useAiwowCleanup();

  const handleCancelPending = () => {
    if (pendingLiveCall?.callRoomId) {
      voiceSocket.emit("call:cancel", { roomId: pendingLiveCall.callRoomId, canceledBy: "CUSTOMER" });
    }
    setPendingLiveCall(null);
    try {
      sessionStorage.removeItem(PENDING_LIVE_CALL_STORAGE_KEY);
    } catch {
      // Ignore storage failures; context state is the primary source.
    }
  };

  const currentRoute = matches
    .reverse()
    .find((match) => match.handle && match.handle.header !== undefined);

  const showHeader = currentRoute ? currentRoute.handle.header : false;
  const showFooter = currentRoute ? currentRoute.handle.footer : true;

  // Hide header/footer in webview mode (?type=webview)
  const isWebview = new URLSearchParams(location.search).get("type") === "webview";

  const isOnboardingPage = location.pathname === "/login";
  const isLivePage = location.pathname.startsWith("/live");
  
  const showTopHeader = !isOnboardingPage && !isLivePage && !isWebview;

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
          <div className={styles.topLinkWrap}>
            <div className={styles.topLink}>
                <span>Horoscope	: </span>
                <a href="daily-horoscope" title="Daily Horoscope"> Daily Horoscope</a> | 
                <a href="weekly-horoscope" title="Weekly Horoscope"> Weekly Horoscope</a> | 
                <a href="monthly-horoscope" title="Monthly Horoscope"> Monthly Horoscope</a> | 
                <a href="yearly-horoscope" title="Yearly Horoscope"> Yearly Horoscope</a> | 
                <a href="chat-to-astrologer" title="Chat to Astrologer"> Chat to Astrologer</a> | 
                <a href="talk-to-astrologer" title="Talk to Astrologer"> Talk to Astrologer</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Shop our Products	: </span>
                <a href="bracelets" title="Bracelets"> Bracelets</a> | 
                <a href="rudraksha" title="Rudraksha"> Rudraksha</a> | 
                <a href="murti" title="Murti"> Murti</a> | 
                <a href="gemstones" title="Gemstones"> Gemstones</a> | 
                <a href="yantra" title="Yantra"> Yantra</a> | 
                <a href="kavach" title="Kavach"> Kavach</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Company	: </span>
                <a href="about-us" title="About Us"> About Us</a> | 
                <a href="contact-us" title="Contact Us"> Contact Us</a> | 
                <a href="faq" title="FAQ"> FAQ</a> | 
                <a href="refund-cancellation-policy" title="Refund and Cancellation Policy"> Refund and Cancellation Policy</a> | 
                <a href="terms-and-conditions" title="Terms and Conditions"> Terms and Conditions</a> | 
                <a href="privacy-policy" title="Privacy Policy"> Privacy Policy</a> | 
                <a href="disclaimer" title="Disclaimer"> Disclaimer</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Important Links	: </span>
                <a href="shubh-muhurat-2026" title="Shubh Muhurat 2026"> Shubh Muhurat 2026</a> | 
                <a href="naam-karan-muhurat" title="NaamKaran Muhurat 2026"> NaamKaran Muhurat 2026</a> | 
                <a href="marriage-muhurat" title="Marriage Muhurat 2026"> Marriage Muhurat 2026</a> | 
                <a href="bhoomi-pujan-muhurat" title="Bhoomi Pujan Muhurat 2026"> Bhoomi Pujan Muhurat 2026</a> | 
                <a href="griha-pravesh-muhurat" title="Griha Pravesh Muhurat 2026"> Griha Pravesh Muhurat 2026</a> | 
                <a href="mundan-muhurat" title="Mundan Muhurat 2026"> Mundan Muhurat 2026</a> | 
                <a href="car-buying-muhurat" title="Car Buying Muhurat 2026"> Car Buying Muhurat 2026</a> | 
                <a href="bike-buying-muhurat" title="Bike Buying Muhurat 2026"> Bike Buying Muhurat 2026</a> | 
                <a href="gold-buying-muhurat" title="Gold Buying Muhurat 2026"> Gold Buying Muhurat 2026</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Important Links	: </span>
                <a href="how-to-read-kundli" title="How to Read Kundli"> How to Read Kundli</a> | 
                <a href="astrology-mantras" title="Astrology Mantras"> Astrology Mantras</a> | 
                <a href="astrology-remedy-job-promotion" title="Astro Remedy for Job Promotion"> Astro Remedy for Job Promotion</a> | 
                <a href="astrology-remedy-conceive-child" title="Astro Remedy to Conceive a Child"> Astro Remedy to Conceive a Child</a> | 
                <a href="astrology-remedy-quick-marriage" title="Astro Remedy for Quick Marriage"> Astro Remedy for Quick Marriage</a> | 
                <a href="astro-remedy-to-get-new-job" title="Astro Remedy to Get New Job"> Astro Remedy to Get New Job</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Important Links	: </span>
                <a href="ar-vastu-scanner" title="AR Vastu Scanner"> AR Vastu Scanner</a> | 
                <a href="ai-palmistry-scanner" title="AI Palmistry Scanner"> AI Palmistry Scanner</a> | 
                <a href="astro-face-reading" title="Astro Face Reading"> Astro Face Reading</a> | 
                <a href="signature-analysis" title="Signature Analysis"> Signature Analysis</a> | 
                <a href="clothes-colour-analysis" title="Clothes Colour Analysis"> Clothes Colour Analysis</a> | 
                <a href="gemstone-authenticity" title="Gemstone Authenticity"> Gemstone Authenticity</a> | 
                <a href="aura-photography" title="Aura Photography"> Aura Photography</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Celebrity Horoscope	: </span>
                <a href="https://www.shubhastro.ai/celebrity-horoscope/shahrukh-khan" title="Shah Rukh Khan Horoscope"> Shah Rukh Khan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/amitabh-bachchan" title="Amitabh Bachchan Horoscope"> Amitabh Bachchan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/aishwarya-rai" title="Aishwarya Rai Horoscope"> Aishwarya Rai Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/priyanka-chopra" title="Priyanka Chopra Horoscope"> Priyanka Chopra Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/salman-khan" title="Salman Khan Horoscope"> Salman Khan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/aamir-khan" title="Aamir Khan Horoscope"> Aamir Khan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/virat-kohli" title="Virat Kohli Horoscope"> Virat Kohli Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/ms-dhoni" title="MS Dhoni Horoscope"> MS Dhoni Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/narendra-modi" title="Narendra Modi Horoscope"> Narendra Modi Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-horoscope/rahul-gandhi" title="Rahul Gandhi Horoscope"> Rahul Gandhi Horoscope</a> | 
            </div>
            <div className={styles.topLink}>
                <span>Celebrity Couple Horoscope	: </span>
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/shahrukh-khan-and-Gauri-khan" title="Shah Rukh Khan & Gauri Khan Horoscope"> Shah Rukh Khan & Gauri Khan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/deepika-padukone-and-ranveer-singh" title="Deepika Padukone & Ranveer Singh Horoscope"> Deepika Padukone & Ranveer Singh Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/ranvir-kapoor-and-alia-bhatt" title="Ranbir Kapoor & Alia Bhatt Horoscope"> Ranbir Kapoor & Alia Bhatt Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/aishwarya-rai-and-abhishek-bachchan" title="Aishwarya Rai & Abhishek Bachan Horoscope"> Aishwarya Rai & Abhishek Bachan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/amitabh-bachchan-and-jaya-bachchan" title="Amitabh Bachchan & Jaya Bachchan Horoscope"> Amitabh Bachchan & Jaya Bachchan Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/vicky-kaushal-and-katrina-kaif" title="Vicky Kaushal & Katrina Kaif Horoscope"> Vicky Kaushal & Katrina Kaif Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/virat-kohli-and-anuska-sharma" title="Virat Kohli & Anushka Sharma Horoscope"> Virat Kohli & Anushka Sharma Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/priyanka-chopra-and-nick-jonas" title="Priyanka Chopra & Nick Jonas Horoscope"> Priyanka Chopra & Nick Jonas Horoscope</a> | 
                <a href="https://www.shubhastro.ai/celebrity-couple-horoscope/saif-ali-khan-and-kareena-kapoor" title="Saif Ali Khan & Kareena Kapoor Khan Horoscope"> Saif Ali Khan & Kareena Kapoor Khan Horoscope</a> |
            </div>
            <div className={styles.topLink}>
                <span>Important Links	: </span>
                <a href="ai-love-astrologer" title="AI Love Astrologer"> AI Love Astrologer</a> | 
                <a href="ai-marriage-astrologer" title="AI Marriage Astrologer"> AI Marriage Astrologer</a> | 
                <a href="ai-health-astrologer" title="AI Health Astrologer"> AI Health Astrologer</a> | 
                <a href="ai-career-astrologer" title="AI Career Astrologer"> AI Career Astrologer</a> | 
                <a href="ai-life-coach-astrologer" title="AI Life Coach Astrologer"> AI Life Coach Astrologer</a> | 
                <a href="ai-wealth-astrologer" title="AI Wealth Astrologer"> AI Wealth Astrologer</a> | 
                <a href="ai-general-prediction-astrologer" title="AI General Prediction Astrologer"> AI General Prediction Astrologer</a> | 
                <a href="ai-gemstone-astrologer" title="AI Gemstone Astrologer"> AI Gemstone Astrologer</a> | 
                <a href="ai-vedic-astrologer" title="AI Vedic Astrologer"> AI Vedic Astrologer</a> | 
                <a href="ai-western-astrologer" title="AI Western Astrologer"> AI Western Astrologer</a> | 
                <a href="ai-kp-astrologer" title="AI KP Astrologer"> AI KP Astrologer</a> | 
                <a href="ai-laal-kitab-astrologer" title="AI Laal Kitab Astrologer"> AI Laal Kitab Astrologer</a> | 
                <a href="ai-horoscope-matching-astrologer" title="AI Horoscope Matching Astrologer"> AI Horoscope Matching Astrologer</a> | 
                <a href="ai-vaastu-astrologer" title="AI Vaastu Astrologer"> AI Vaastu Astrologer</a> | 
                <a href="ai-spiritual-astrologer" title="AI Spiritual Astrologer"> AI Spiritual Astrologer</a> | 
                <a href="ai-occult-astrologer" title="AI Occult Astrologer"> AI Occult Astrologer</a> | 
            </div>
          </div>
          <Footer />
        </div>
      )}

      {/* ✅ FLOATING CALL UI (IMPORTANT LINE) */}
      <VideoCallContainer />

      {/* Pending live call waiting banner — shown outside /live only when FooterWaiting isn't already visible */}
      {pendingLiveCall && !isLivePage && !waitingList && (
        <WaitingModal
          callRoomId={pendingLiveCall.callRoomId}
          resetCallState={handleCancelPending}
          connectionType={pendingLiveCall.pendingCallType}
          astrologerName={pendingLiveCall.astrologer?.astrologerName || pendingLiveCall.astrologer?.firstName}
        />
      )}

      <StickyChatFooter />
      <StickyCallFooter />
      <StickyReview />
    </div>
  );
};

export default HomeLayout;
