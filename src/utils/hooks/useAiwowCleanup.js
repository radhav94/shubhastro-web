import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearAllAiwowData } from "../../redux/aiwow/aiwowSlice";

const AIWOW_FEATURE_PREFIXES = [
  "/ai-palmistry-scanner",
  "/astro-face-reading",
  "/signature-analysis",
  "/clothes-colour-analysis",
  "/gemstone-authenticity",
  "/aura-photography",
];

/**
 * Returns the aiwow feature prefix that matches the given path, or null if none.
 * Hub paths (/ai-wow, /aiwow) are NOT considered features.
 */
const getFeaturePrefix = (path) =>
  AIWOW_FEATURE_PREFIXES.find((prefix) => path.startsWith(prefix)) || null;

/**
 * Clears aiwow session data only when user starts a different aiwow feature.
 * Data persists when:
 * - User leaves to non-aiwow pages (e.g., "Consult with Expert Astrologer" CTA)
 * - User goes back to the /ai-wow hub
 * This allows browser back to return to results without losing data.
 */
export const useAiwowCleanup = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    prevPathRef.current = pathname;

    const currentFeature = getFeaturePrefix(pathname);
    const prevFeature = getFeaturePrefix(prevPath);

    // Only clear when entering a different aiwow feature than the previous one
    // e.g., user was on face-reading, now navigating to palmistry
    if (currentFeature && prevFeature && currentFeature !== prevFeature) {
      dispatch(clearAllAiwowData());
    }
  }, [pathname, dispatch]);
};
