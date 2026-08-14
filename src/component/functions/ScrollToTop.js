// src/component/functions/ScrollToTop.js

import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll management for route changes.
 *
 * New navigations (PUSH/REPLACE) start at the top. Back/forward navigations
 * (POP) return the user to where they were.
 *
 * The POP case has to be handled here because main.jsx sets
 * `history.scrollRestoration = "manual"` (needed so iOS Chrome pull-to-refresh
 * behaves). With native restoration off and an unconditional scroll-to-top,
 * every back navigation dumped the user at the top of the page they came from —
 * so returning to a long list meant scrolling to find their place again, which
 * shows up in session recordings as repeated back-and-forth navigation and
 * re-opening articles they had already read.
 */

const STORAGE_KEY = "routeScrollPositions";

// Restoring can't happen until the destination has rendered enough content to
// be that tall, and route data often arrives a frame or two later.
const MAX_RESTORE_FRAMES = 20;

const readPositions = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writePosition = (key, offset) => {
  try {
    const positions = readPositions();
    positions[key] = offset;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    /* sessionStorage can be unavailable (private mode, quota) — non-critical */
  }
};

const ScrollToTop = () => {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const offsetRef = useRef(0);

  // Track the current offset so it can be persisted for this history entry when
  // we leave it. Reading window.scrollY during cleanup alone is unreliable once
  // the outgoing page has already been torn down.
  useEffect(() => {
    offsetRef.current = window.scrollY;

    const handleScroll = () => {
      offsetRef.current = window.scrollY;
    };
    const persist = () => writePosition(key, offsetRef.current);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", persist);

    return () => {
      persist();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [key]);

  useEffect(() => {
    if (navigationType === "POP") {
      const target = readPositions()[key];

      if (typeof target === "number" && target > 0) {
        let frame = 0;
        let rafId;

        // Keep trying until the document is tall enough to honour the offset,
        // then stop. Bounded so a page that never grows can't spin forever.
        const restore = () => {
          window.scrollTo({ top: target, left: 0, behavior: "auto" });

          const reached = Math.abs(window.scrollY - target) <= 2;
          if (reached || frame >= MAX_RESTORE_FRAMES) return;

          frame += 1;
          rafId = requestAnimationFrame(restore);
        };

        rafId = requestAnimationFrame(restore);
        return () => cancelAnimationFrame(rafId);
      }
    }

    // Instant rather than smooth: the destination is a different page, so
    // animating from the previous offset just delays the correct position and
    // can be interrupted mid-flight on long pages.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, key, navigationType]);

  return null;
};

export default ScrollToTop;
