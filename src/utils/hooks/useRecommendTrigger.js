import { useEffect, useRef, useState } from "react";

const useRecommendTrigger = (step = 120, resetKey = 0) => {
  const [showCTA, setShowCTA] = useState(false);
  const nextTriggerPoint = useRef(step);

  // Reset trigger after close
  useEffect(() => {
    setShowCTA(false);
    nextTriggerPoint.current = window.scrollY + step;
  }, [resetKey, step]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY >= nextTriggerPoint.current) {
        setShowCTA(true);
        // move checkpoint forward
        nextTriggerPoint.current += step;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [step]);

  return showCTA;
};

export default useRecommendTrigger;
