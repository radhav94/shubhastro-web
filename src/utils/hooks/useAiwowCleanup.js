import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearAllAiwowData } from "../../redux/aiwow/aiwowSlice";

const AIWOW_PREFIXES = [
  "/ai-wow",
  "/aiwow",
  "/ai-palmistry-scanner",
  "/astro-face-reading",
  "/signature-analysis",
  "/clothes-colour-analysis",
  "/gemstone-authenticity",
  "/aura-photography",
];

const isAiwowPath = (path) =>
  AIWOW_PREFIXES.some((prefix) => path.startsWith(prefix));

/**
 * Clears aiwow session data when user navigates away from aiwow pages.
 * Data persists across page reloads (for language switch) but clears on route change.
 */
export const useAiwowCleanup = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    prevPathRef.current = pathname;

    if (isAiwowPath(prevPath) && !isAiwowPath(pathname)) {
      dispatch(clearAllAiwowData());
    }
  }, [pathname, dispatch]);
};
