import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../../../component";
import { PATH } from "../../../../../utils/routes/Paths";
import styles from "./HeroSection.module.scss";

const HeroSection = ({ data }) => {
  const navigate = useNavigate();

  const banner = data?.find((item) => item.display_type === "banner")
    ?.content?.[0];

  const title = banner?.title || "";
  const parts = title.split("Navratri");

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.heroWrapper}>
          <div
            className={styles.backgroundImage}
            style={{ backgroundImage: `url(${banner?.icon})` }}
          >
            <div className={styles.gradientOverlay}></div>
          </div>

          <div className={styles.content}>
            <h1>
              {parts[0]}
              <span className={styles.highlight}>Navratri</span>
            </h1>

            <PrimaryButton
              size="lg"
              className={styles.primaryButton}
              title="First Chat Free"
              onClick={() =>
                navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path)
              }
            />

            <p>{banner?.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
