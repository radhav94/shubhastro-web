import { useEffect, useState } from "react";
import styles from "./NoInternet.module.scss";

const NoInternet = () => {
  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Left — WiFi SVG (inline, no network needed) */}
        <div className={styles.imgWrap}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Crossed WiFi icon */}
            <circle cx="60" cy="60" r="58" fill="#fff3ee" stroke="#f75801" strokeWidth="2"/>
            {/* WiFi arcs */}
            <path d="M60 80a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" fill="#f75801"/>
            <path d="M44 66c4.4-4.4 10.5-7 16-7s11.6 2.6 16 7" stroke="#f75801" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M33 55c7.4-7.4 17.5-12 27-12s19.6 4.6 27 12" stroke="#f75801" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
            {/* Cross line */}
            <line x1="30" y1="30" x2="90" y2="90" stroke="#f75801" strokeWidth="5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Right — Content */}
        <div className={styles.content}>
          <div className={styles.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
            </svg>
            No internet
          </div>

          <h2 className={styles.title}>The stars can't reach you right now!</h2>
          <p className={styles.desc}>
            Please check your internet and tap Try Again to continue
          </p>
          <button className={styles.btn} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook — detects online/offline status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let offlineTimer = null;

    const goOnline = () => {
      // Clear any pending offline timer — brief blips don't trigger offline UI
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
      setIsOnline(true);
    };

    const goOffline = () => {
      // Debounce: only show offline UI if disconnected for > 3 seconds
      offlineTimer = setTimeout(() => {
        setIsOnline(false);
      }, 3000);
    };

    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
      if (offlineTimer) clearTimeout(offlineTimer);
    };
  }, []);

  return isOnline;
};

export default NoInternet;
