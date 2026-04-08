import React, { Suspense } from "react";
import styles from "./HomeLayout.module.scss";
import TopBar from "./topbar/TopBar";
import TopHeader from "../component/TopHeader";
import { Outlet, useMatches, useLocation } from "react-router-dom";
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

const HomeLayout = () => {
  const isMobile = useIsMobile();
  const matches = useMatches();
  const location = useLocation();

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
      <div className={styles.contentWrapper}>
        <div className={showHeader && !isWebview ? styles.topGap : ""}></div>

        {showHeader && !isWebview && <Breadcrumb />}

        <Suspense fallback={<CircleSpinner />}>
          <div className={styles.outletDiv}>
            <Outlet />
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

      <StickyChatFooter />
      <StickyCallFooter />
      <StickyReview />
    </div>
  );
};

export default HomeLayout;
