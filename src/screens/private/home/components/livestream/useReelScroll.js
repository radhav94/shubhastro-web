import { useEffect, useRef } from "react";

// Global lock shared across all instances — prevents any double-trigger
let globalLocked = false;

export const useReelScroll = ({
  enabled,
  containerRef,
  onNext,
  onPrev,
  lockTime = 1500,
  threshold = 50,
  disabledRef,
}) => {
  const scrollIntent = useRef(0);
  const intentTimer = useRef(null);

  useEffect(() => {
    if (!enabled || !containerRef?.current) return;

    const el = containerRef.current;

    const onWheel = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      const messagesOverlay = el.querySelector(".inline-messages-overlay");
      if (messagesOverlay && messagesOverlay.contains(e.target)) return;

      if (disabledRef?.current) return;

      e.preventDefault();

      if (globalLocked) return;

      // Accumulate scroll intent
      scrollIntent.current += e.deltaY;

      // Debounce — wait for scroll to settle, then act once
      clearTimeout(intentTimer.current);
      intentTimer.current = setTimeout(() => {
        if (globalLocked) {
          scrollIntent.current = 0;
          return;
        }

        if (Math.abs(scrollIntent.current) < threshold) {
          scrollIntent.current = 0;
          return;
        }

        globalLocked = true;
        const direction = scrollIntent.current;
        scrollIntent.current = 0;

        if (direction > 0) {
          onNext?.();
        } else {
          onPrev?.();
        }

        setTimeout(() => {
          globalLocked = false;
        }, lockTime);
      }, 150);
    };

    const onKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (globalLocked) return;
      if (disabledRef?.current) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        globalLocked = true;
        onNext?.();
        setTimeout(() => { globalLocked = false; }, lockTime);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        globalLocked = true;
        onPrev?.();
        setTimeout(() => { globalLocked = false; }, lockTime);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      el.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(intentTimer.current);
    };
  }, [enabled, onNext, onPrev, lockTime, threshold, containerRef]);
};
