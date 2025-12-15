import { useEffect, useState, useRef } from "react";

export const useInactivityTimer = (timeout = 120000, isPaused = false) => {
  const [isInactive, setIsInactive] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (isPaused) return; // STOP resetting when modal is open

    setIsInactive(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsInactive(true);
    }, timeout);
  };

  useEffect(() => {
    if (!isPaused) resetTimer(); // Restart timer only if not paused

    const events = ["mousemove", "keydown", "click", "touchstart"];

    const handleActivity = () => {
      if (!isPaused) resetTimer();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearTimeout(timerRef.current);
    };
  }, [isPaused]);

  return { isInactive, resetTimer };
};
