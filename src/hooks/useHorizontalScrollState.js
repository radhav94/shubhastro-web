import { useState, useEffect } from "react";

/**
 * Tracks whether a horizontal scroll container can currently scroll left and/or
 * right. Unlike a simple "is overflowing" check, this is edge-aware: it returns
 * false for a direction once the container is scrolled to that edge.
 *
 * Use it to conditionally render carousel arrows so users never click an arrow
 * that does nothing (which Microsoft Clarity flags as a "dead click").
 *
 * Recomputes on mount, on scroll, on resize, and whenever `deps` change
 * (e.g. the list content changes).
 *
 * @param {React.RefObject<HTMLElement>} ref - ref to the scroll container
 * @param {Array} deps - dependencies that should trigger a re-measure
 * @returns {{ canScrollLeft: boolean, canScrollRight: boolean }}
 */
export default function useHorizontalScrollState(ref, deps = []) {
  const [state, setState] = useState({ canScrollLeft: false, canScrollRight: false });

  useEffect(() => {
    const el = ref?.current;
    if (!el) {
      setState({ canScrollLeft: false, canScrollRight: false });
      return undefined;
    }

    const measure = () => {
      // small tolerance to avoid sub-pixel false positives
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      setState((prev) => {
        const canScrollLeft = el.scrollLeft > 4;
        const canScrollRight = el.scrollLeft < maxScrollLeft - 4;
        if (prev.canScrollLeft === canScrollLeft && prev.canScrollRight === canScrollRight) {
          return prev;
        }
        return { canScrollLeft, canScrollRight };
      });
    };

    measure();

    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (resizeObserver) resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
