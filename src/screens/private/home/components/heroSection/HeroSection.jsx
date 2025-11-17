import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../../../component";
import { PATH } from "../../../../../utils/routes/Paths";
import styles from "./HeroSection.module.scss";

const HeroSection = ({ data }) => {
  const navigate = useNavigate();

  const sections = data;

  // 🟦 Find banner section
  const bannerSection = sections?.find(
    (item) => item.display_type === "banner"
  );

  // 🟩 Banner content (title, desc, icon)
  const banner = bannerSection?.content?.[0];

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.heroWrapper}>
          <div
            className={styles.backgroundImage}
            style={{
              backgroundImage: `url(${banner?.icon})`,
            }}
          >
            <div className={styles.gradientOverlay}></div>
          </div>

          <div className={styles.content}>
            <h1>
              {banner?.title?.split("Navratri")[0]}
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
