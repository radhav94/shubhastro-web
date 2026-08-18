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

/**
 * react-router names the document's entry history record `"default"` — there is
 * no `history.state.key` on it yet (createBrowserLocation: `state.key ||
 * "default"`). That literal is reused by every page load, while sessionStorage
 * survives reloads, so a bare `"default"` entry lets one document's offset be
 * applied to whatever route happens to be the entry point of the next one.
 * Qualifying it with the pathname keeps the value stable for the life of this
 * document (an entry record's path never changes) without colliding.
 */
const storageKeyFor = (key, pathname) =>
  key === "default" ? `default:${pathname}` : key;

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
  const isFirstNavigationRef = useRef(true);

  const storageKey = storageKeyFor(key, pathname);

  // Track the current offset so it can be persisted for this history entry when
  // we leave it. Reading window.scrollY during cleanup alone is unreliable once
  // the outgoing page has already been torn down.
  useEffect(() => {
    // A newly entered record starts at the top. This deliberately does not seed
    // from window.scrollY: the outgoing page's offset is still in place here
    // (the scroll below happens in a later effect), and scrollTo(0) on a
    // document already at 0 fires no scroll event to correct it — so the
    // previous page's offset would end up stored against this record.
    offsetRef.current = 0;

    const handleScroll = () => {
      offsetRef.current = window.scrollY;
    };
    const persist = () => writePosition(storageKey, offsetRef.current);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", persist);

    return () => {
      persist();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [storageKey]);

  useEffect(() => {
    const isFirstNavigation = isFirstNavigationRef.current;
    isFirstNavigationRef.current = false;

    // react-router reports the document's first render as POP too (its history
    // adapter starts with `action = "POP"`), so a fresh load or a reload is
    // indistinguishable from a back/forward by navigationType alone. Without
    // this guard every page load force-scrolls into a stored offset while the
    // route is still filling in its content.
    if (navigationType === "POP" && !isFirstNavigation) {
      const target = readPositions()[storageKey];

      if (typeof target === "number" && target > 0) {
        let frame = 0;
        let rafId;
        let cancelled = false;

        const stopListening = () => {
          window.removeEventListener("touchstart", cancel);
          window.removeEventListener("wheel", cancel);
          window.removeEventListener("keydown", cancel);
        };

        // The restore needs a few frames to outlast layout, but it must never
        // win against the user: a scrollTo landing mid-gesture cancels the
        // scroll and moves content out from under the finger, so the tap that
        // follows hits whatever slid into place. Hand control back the moment
        // there is any input.
        function cancel() {
          cancelled = true;
          cancelAnimationFrame(rafId);
          stopListening();
        }

        // Keep trying until the document is tall enough to honour the offset,
        // then stop. Bounded so a page that never grows can't spin forever.
        const restore = () => {
          if (cancelled) return;

          window.scrollTo({ top: target, left: 0, behavior: "auto" });

          const reached = Math.abs(window.scrollY - target) <= 2;
          if (reached || frame >= MAX_RESTORE_FRAMES) {
            stopListening();
            return;
          }

          frame += 1;
          rafId = requestAnimationFrame(restore);
        };

        window.addEventListener("touchstart", cancel, { passive: true });
        window.addEventListener("wheel", cancel, { passive: true });
        window.addEventListener("keydown", cancel);

        rafId = requestAnimationFrame(restore);
        return cancel;
      }
    }

    // Instant rather than smooth: the destination is a different page, so
    // animating from the previous offset just delays the correct position and
    // can be interrupted mid-flight on long pages.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, storageKey, navigationType]);

  return null;
};

export default ScrollToTop;
