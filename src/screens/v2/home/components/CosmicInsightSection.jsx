import { useNavigate } from "react-router-dom";
import wheel from "../../../../assets/images/wheel.svg";
import cos from "../../../../assets/images/cosmic.png";
import styles from "../Home.module.scss";

const CosmicInsightSection = ({ data }) => {
  const navigate = useNavigate();
  const title = data?.display_title || "DAILY COSMIC INSIGHT";
  const imageUrl = data?.image_url || wheel;

  const handleCardClick = () => {
    // Navigate to AIWow page with hash to scroll to Companion Suite section
    navigate("/ai-wow#companion-suite");
  };

  return (
    <section className={styles.cosmicInsightSection}>
      <div
        className={styles.cosmicInsightCard}
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
        <div className={styles.cosmicContent}>
          <div className={styles.cosmicHeader}>
            <span className={styles.cosmicLabel}>{title}</span>
            <div className={styles.cosmicDivider}>
              <div className={styles.dividerLine}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="53"
                  height="1"
                  viewBox="0 0 53 1"
                  fill="none"
                >
                  <path
                    d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z"
                    fill="#fff"
                    fillOpacity="1"
                  />
                </svg>
              </div>
              <span className={styles.dividerMoon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="12"
                  viewBox="0 0 4 6"
                  fill="none"
                >
                  <path
                    d="M3.39392 4.49489C3.03602 4.84065 2.58016 5.0493 2.08582 5.0493C0.934798 5.0493 0 3.9185 0 2.52316C0 1.1308 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00931234 2.38704 0.024961C1.91056 0.485852 1.60687 1.196 1.60687 1.99371C1.60687 3.26461 2.38458 4.31717 3.39392 4.49489Z"
                    fill="#FEFEFE"
                  />
                </svg>
              </span>
              <div className={styles.dividerLine}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="53"
                  height="1"
                  viewBox="0 0 53 1"
                  fill="none"
                >
                  <path
                    d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z"
                    fill="#fff"
                    fillOpacity="1"
                  />
                </svg>
              </div>
            </div>
          </div>
          <h3 className={styles.cosmicTitle}>{data?.sub_title}</h3>
          <p className={styles.cosmicText}>{data?.description}</p>
        </div>
        <div className={styles.cosmicArt}>
          <img
            src={cos}
            alt="Zodiac Wheel"
            className={styles.zodiacWheel}
          />
        </div>
      </div>
    </section>
  );
};

export default CosmicInsightSection;
