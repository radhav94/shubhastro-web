import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.scss";
import zodiacWheel from "../../../assets/images/404-zodiac-wheel.png";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>

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
