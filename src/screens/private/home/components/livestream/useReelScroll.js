import { useEffect, useRef } from "react";

export const useReelScroll = ({
  enabled,
  containerRef,
  onNext,
  onPrev,
  lockTime = 600,
  threshold = 80,
}) => {
  const locked = useRef(false);
  const deltaAcc = useRef(0);

  useEffect(() => {
    if (!enabled || !containerRef?.current) return;

    const el = containerRef.current;

    const onWheel = (e) => {
      // allow scroll in inputs
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      // allow scroll inside messages overlay
      const messagesOverlay = el.querySelector(".inline-messages-overlay");
      if (messagesOverlay && messagesOverlay.contains(e.target)) return;

      e.preventDefault();

      deltaAcc.current += e.deltaY;

      if (Math.abs(deltaAcc.current) < threshold) return;
      if (locked.current) return;

      locked.current = true;

      if (deltaAcc.current > 0) {
        onNext?.();
      } else {
        onPrev?.();
      }

      deltaAcc.current = 0;

      setTimeout(() => {
        locked.current = false;
      }, lockTime);
    };

    // Keyboard arrow navigation (ArrowDown = next, ArrowUp = prev)
    const onKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (locked.current) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        locked.current = true;
        onNext?.();
        setTimeout(() => { locked.current = false; }, lockTime);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        locked.current = true;
        onPrev?.();
        setTimeout(() => { locked.current = false; }, lockTime);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      el.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, onNext, onPrev, lockTime, threshold, containerRef]);
};
