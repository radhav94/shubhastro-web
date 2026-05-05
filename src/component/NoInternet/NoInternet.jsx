import { useEffect, useState } from "react";
import styles from "./NoInternet.module.scss";
import wifiImg from "../../assets/images/no-internet-wifi.png";
import bgSvg from "../../assets/images/no-internet-bg.svg";
import cornerTR from "../../assets/images/no-internet-corner-tr.png";
import cornerBL from "../../assets/images/no-internet-corner-bl.png";

const NoInternet = () => {
  return (
    <div className={styles.page}>
      <div className={styles.card} >

        {/* Top-right corner decoration */}
        <img src={cornerTR} alt="" className={styles.cornerTR} />

        {/* Bottom-left corner decoration */}
        <img src={cornerBL} alt="" className={styles.cornerBL} />

        {/* Left — WiFi image */}
        <div className={styles.imgWrap}>
          <img src={wifiImg} alt="No Internet" className={styles.wifiImg} />
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

          <h2 className={styles.title}>No internet connection</h2>
          <p className={styles.desc}>
            It seems you're offline. Please check your internet connection and try again.
          </p>

          {/* <button className={styles.btn} onClick={() => { window.location.href = '/'; }}>
            Go to homepage
          </button> */}
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
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
};

export default NoInternet;
