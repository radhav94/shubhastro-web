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
