import { useRef } from "react";

export const useSwipeReel = ({ enabled, onNext, onPrev, disabledRef }) => {
  const startY = useRef(0);
  const lastTriggerTime = useRef(0);
  const triggered = useRef(false);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    triggered.current = false;
  };

  const onTouchEnd = (e) => {
    if (!enabled || triggered.current) return;
    if (disabledRef?.current) return;

    const now = Date.now();
    if (now - lastTriggerTime.current < 800) return;

    const diff = startY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 100) return;

    triggered.current = true;
    lastTriggerTime.current = now;

    diff > 0 ? onNext?.() : onPrev?.();
  };

  return { onTouchStart, onTouchEnd };
};
