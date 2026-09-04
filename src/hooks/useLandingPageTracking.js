/**
 * =========================================================
 * Landing Page Tracking Hook
 * =========================================================
 *
 * Tracks Landing Page events when user navigates to different routes.
 * Prevents duplicate events for the same page using a ref.
 *
 * Usage:
 *   import useLandingPageTracking from "./hooks/useLandingPageTracking";
 *   useLandingPageTracking();
 *
 * =========================================================
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { BranchEvents } from "../utils/branchEvents";

const IS_DEV = import.meta.env.DEV;

/**
 * Hook to track Landing Page event on route changes
 * Avoids duplicate tracking for the same page
 */
const useLandingPageTracking = () => {
  const location = useLocation();
  const lastTrackedPathRef = useRef(null);

  useEffect(() => {
    // Don't track if it's the same path (prevents duplicate events)
    if (lastTrackedPathRef.current === location.pathname) {
      return;
    }

    // Update the last tracked path
    lastTrackedPathRef.current = location.pathname;

    try {
      // Get route name from pathname
      const pathSegments = location.pathname.split("/").filter(Boolean);
      let routeName = pathSegments[0] || "home";
      let pageName = routeName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Get user info
      const userId = localStorage.getItem("shubhtalk_customer_id");
      const userType = userId ? "logged_in" : "guest";

      // Track Landing Page event
      BranchEvents.trackLandingPageOpen({
        page_name: pageName,
        route_name: routeName,
        route_path: location.pathname,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_type: userType,
        user_id: userId,
        platform: "web",
      });

      if (IS_DEV) {
        console.log("[LandingPageTracking] Tracked:", {
          page_name: pageName,
          route_name: routeName,
          route_path: location.pathname,
        });
      }
    } catch (error) {
      if (IS_DEV) {
        console.error("[LandingPageTracking] Error tracking landing page:", error);
      }
    }
  }, [location.pathname]);
};

export default useLandingPageTracking;
