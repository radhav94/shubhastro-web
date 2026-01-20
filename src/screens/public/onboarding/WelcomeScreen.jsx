import { useNavigate } from "react-router-dom";
import styles from "./Onboarding.module.scss";

const WelcomeScreen = ({ onNext }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.welcomeScreen}>
      {/* <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button> */}

      <div className={styles.welcomeContent}>
        <h1 className={styles.welcomeTitle}>
          Discover the Rhythm Written in Your Sky
        </h1>
        <p className={styles.welcomeSubtitle}>
          Personal, private and guided by authentic astrologers.
        </p>

        <div className={styles.moonPhases}>
          <span>🌑</span>
          <span>🌒</span>
          <span>🌓</span>
          <span>🌔</span>
          <span>🌕</span>
        </div>
      </div>

      <button className={styles.primaryBtn} onClick={onNext}>
        Begin My Journey
      </button>
    </div>
  );
};

export default WelcomeScreen;
