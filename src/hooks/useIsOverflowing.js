import { useState, useEffect } from "react";

/**
 * Returns true when the referenced element's content overflows horizontally
 * (i.e. there is something to scroll to). Recomputes on mount, on resize, and
 * whenever `deps` change (e.g. the list content changes).
 *
 * @param {React.RefObject<HTMLElement>} ref - ref to the scroll container
 * @param {Array} deps - dependencies that should trigger a re-measure
 */
export default function useIsOverflowing(ref, deps = []) {
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el) {
      setOverflowing(false);
      return undefined;
    }

    const measure = () => {
      // small tolerance to avoid sub-pixel false positives
      setOverflowing(el.scrollWidth - el.clientWidth > 4);
    };

    measure();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(el);
    }
    window.addEventListener("resize", measure);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return overflowing;
}
