import { useEffect, useState, useRef } from "react";

export const useInactivityTimer = (timeout = 120000, isPaused = false) => {
  const [isInactive, setIsInactive] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (isPaused || isInactive) return;

    setIsInactive(false);
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsInactive(true);
    }, timeout);
  };


useEffect(() => {
  if (isPaused || isInactive) return;

  resetTimer();

  const events = ["mousemove", "keydown", "click", "touchstart"];

  const handleActivity = () => {
    resetTimer();
  };

  events.forEach(event =>
    window.addEventListener(event, handleActivity)
  );

  return () => {
    events.forEach(event =>
      window.removeEventListener(event, handleActivity)
    );
    clearTimeout(timerRef.current);
  };
}, [isPaused, isInactive, timeout]);


  return { isInactive, resetTimer };
};
