import React, { Suspense } from "react";
import styles from "./HomeLayout.module.scss";
import TopBar from "./topbar/TopBar";
import { Outlet, useMatches } from "react-router-dom";
import Divider from "../component/Divider";

import { useIsMobile } from "../utils/hooks/useIsMobile";

import Breadcrumb from "../component/BreadCrumb";
import Footer from "./Footer";
import ScrollToTop from "../component/functions/ScrollToTop";
import CircleSpinner from "../component/UI/CircleSpinner";
import VideoCallContainer from "../component/call/VideoCallContainer";
import StickyChatFooter from "../screens/private/home/components/chats/StickyChatFooter";

const HomeLayout = () => {
  const isMobile = useIsMobile();
  const matches = useMatches();

  const currentRoute = matches
    .reverse()
    .find((match) => match.handle && match.handle.header !== undefined);

  const showHeader = currentRoute ? currentRoute.handle.header : true;
  const showFooter = currentRoute ? currentRoute.handle.footer : true;

  return (
    <div className={styles.layout}>
      <ScrollToTop />

      {/* FIXED TOPBAR */}
      {showHeader && (
        <div className={styles.fixedTopBar}>
          <TopBar />
        </div>
      )}

      {/* Scrollable Content */}
      <div className={styles.contentWrapper}>
        <div className={showHeader ? styles.topGap : ""}></div>

        {showHeader && <Breadcrumb />}

        <Suspense fallback={<CircleSpinner />}>
          <div className={styles.outletDiv}>
            <Outlet />
          </div>
        </Suspense>
      </div>

      {showFooter && (
        <div className={styles.footerWrapper}>
          <Footer />
        </div>
      )}

      {/* ✅ FLOATING CALL UI (IMPORTANT LINE) */}
      <VideoCallContainer />

      <StickyChatFooter/>
    </div>
  );
};

export default HomeLayout;
