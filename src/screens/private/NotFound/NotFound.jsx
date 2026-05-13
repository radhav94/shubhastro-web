import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.scss";
import bgWaves from "../../../assets/images/404-bg-waves.svg";
import bgRight from "../../../assets/images/404-bg-right.svg";
import zodiacWheel from "../../../assets/images/404-zodiac-wheel.png";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    // Use hard navigation to bypass corrupted router state (e.g. after Google Translate)
    window.location.href = '/';
  };

  const handleGoBack = () => {
    // If there's browser history, go back; otherwise hard-navigate to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {/* Background decorations */}
        <img src={bgWaves} alt="" className={styles.bgWaves} aria-hidden="true" />
        <img src={bgRight} alt="" className={styles.bgRight} aria-hidden="true" />

        {/* Left — Zodiac wheel image from Figma */}
        <div className={styles.wheelWrap}>
          <img src={zodiacWheel} alt="404 Zodiac Wheel" className={styles.wheelImg} />
        </div>

        {/* Right — Content */}
        <div className={styles.content}>
          <span className={styles.oopsBadge}>Oops!</span>
          <h1 className={styles.title}>Your destiny path is lost</h1>
          <p className={styles.subtitle}>
            The page you're looking for doesn't exist or has moved.<br />
            Let our AI guide you back to the right path.
          </p>
          <button className={styles.homeBtn} onClick={() => navigate("/")}>
            Go to homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
