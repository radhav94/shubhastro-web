import styles from "./Onboarding.module.scss";
import onboardingBg from "../../../assets/images/onboarding.jpg";

const WelcomeScreen = ({ onNext }) => {
  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.welcomeBackground}>
        <img
          src={onboardingBg}
          alt="Astrology"
          className={styles.backgroundImage}
        />
      </div>

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

        <button className={styles.primaryBtn} onClick={onNext}>
          Begin My Journey
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
