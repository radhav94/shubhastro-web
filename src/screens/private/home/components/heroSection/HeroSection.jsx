import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../../../component";
import { AppImages } from "../../../../../utils/appImages";
import { PATH } from "../../../../../utils/routes/Paths";
import styles from "./HeroSection.module.scss";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.heroWrapper}>
          <div
            className={styles.backgroundImage}
            style={{ backgroundImage: `url(${AppImages.Hero})` }}
          >
            <div className={styles.gradientOverlay}></div>
          </div>

          <div className={styles.content}>
            <h1>
              Turn doubts into clarity this{" "}
              <span className={styles.highlight}>Navratri</span>
            </h1>

            {/* <PrimaryButton
              size="lg"
              className={styles.primaryButton}
              title="First Chat Free"
              onClick={() =>
                navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path)
              }
            /> */}
            <p>
              Connect with expert astrologers and find the guidance you need
              during this auspicious time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
