// src/components/LiveStreaming/useSwipeReel.js
import { useRef } from "react";

export const useSwipeReel = ({ enabled, onNext, onPrev, disabledRef }) => {
  const startY = useRef(0);
  const locked = useRef(false);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

 const onTouchEnd = (e) => {
    if (!enabled || locked.current) return;
    if (disabledRef?.current) return;

    const diff = startY.current - e.changedTouches[0].clientY;

    if (Math.abs(diff) < 80) return;

    locked.current = true;

    diff > 0 ? onNext?.() : onPrev?.();

    setTimeout(() => {
      locked.current = false;
    }, 600); // 👈 SAME as animation
  };

  return { onTouchStart, onTouchEnd };
};
