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

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [enabled, onNext, onPrev, lockTime, threshold, containerRef]);
};
