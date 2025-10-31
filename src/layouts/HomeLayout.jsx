import React, { Suspense } from "react";
import styles from "./HomeLayout.module.scss";
import TopBar from "./topbar/TopBar";
import { Outlet, useMatches } from "react-router-dom";
import Divider from "../component/Divider";

import { useIsMobile } from "../utils/hooks/useIsMobile";

import Navbar from "./Navbar";
import Breadcrumb from "../component/BreadCrumb";
import Footer from "./Footer";
import ScrollToTop from "../component/functions/ScrollToTop";
import CircleSpinner from "../component/UI/CircleSpinner";

const HomeLayout = () => {
  const isMobile = useIsMobile();

  const matches = useMatches();

  // Find the deepest match with handle.header defined in it
  const currentRoute = matches
    .reverse()
    .find((match) => match.handle && match.handle.header !== undefined);
  const showHeader = currentRoute ? currentRoute.handle.header : true;

  return (
    <div className={styles.layout}>
      <ScrollToTop />
      <div className={styles.contentWrapper}>
        {showHeader && (
          <>
            <div className={styles.topContent}>
              <div className={styles.topBarContainer}>
                <TopBar />
              </div>
              <Divider />
              <Navbar />

              {!isMobile && <Divider />}
              <Breadcrumb />
            </div>
          </>
        )}
        <Suspense fallback={<CircleSpinner />}>
          <div className={styles.outletDiv}>
            <Outlet />
          </div>
        </Suspense>
      </div>
      {showHeader && (
        <div className={styles.footerWrapper}>
          <Footer />
        </div>
      )}
    </div>
  );
};

export default HomeLayout;
