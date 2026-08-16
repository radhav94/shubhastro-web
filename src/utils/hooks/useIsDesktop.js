import { useEffect, useState } from "react";

/**
 * Tracks whether the viewport is at or above a desktop breakpoint.
 *
 * Exists so components can avoid *fetching* data for UI that CSS hides anyway.
 * Several screens render desktop-only sidebars that are `display: none` below
 * 1024px, but their RTK Query hooks still fired on every phone and tablet load,
 * competing with the requests those pages actually block on.
 *
 * Defaults to `false` so the extra request is skipped until we have measured the
 * viewport — the first paint on mobile is the case worth protecting, and a
 * desktop visitor picks the data up on the effect's first run.
 *
 * @param {number} minWidth Breakpoint in px. Must match the CSS that hides the
 *   element, or the fetch and the render will disagree.
 */
export default function useIsDesktop(minWidth = 1025) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsDesktop(mql.matches);

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [minWidth]);

  return isDesktop;
}
