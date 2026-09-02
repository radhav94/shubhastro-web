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
  /*
    Measured synchronously on the first render via a lazy initializer, not left
    at `false` until a mount effect runs.

    The old default-`false`-then-flip cost desktop an extra render before any
    skipped query could start: a hook like
    `useGetAstrologersQuery(..., { skip: !isDesktop })` was skipped on render 1
    and only fired on render 2, once the effect had set the flag. On the
    astrologer profile that is the TOP ASTROLOGERS sidebar — it visibly arrived
    late because its request did not even begin until the second render.

    Reading matchMedia in the initializer is synchronous and free, and it still
    starts `false` on mobile (the case the skip exists to protect), so first
    paint there is unchanged. SSR/no-matchMedia falls back to `false`.
  */
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsDesktop(mql.matches);

    // Re-sync in case the width changed between the initializer and this effect.
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [minWidth]);

  return isDesktop;
}
