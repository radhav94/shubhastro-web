import { useEffect, useState } from "react";
import styles from "./Onboarding.module.scss";

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const interval = 20; // Update every 20ms
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 100);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.planetContainer}>
          <div className={styles.planet}>
            <div className={styles.ring}></div>
          </div>
          <div className={styles.star1}>✦</div>
          <div className={styles.star2}>✦</div>
        </div>

        <h1 className={styles.loadingTitle}>The cosmos is aligning for you</h1>
        <p className={styles.loadingSubtitle}>
          Reading your stars and preparing your birth chart...
        </p>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
