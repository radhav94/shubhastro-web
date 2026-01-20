import React from "react";
import styles from "./HeroSection.module.scss";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";
import { AppIcons } from "../../../../../utils/appImages";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.heroWrapper}>
      <div className={styles.heroCard}>
        {/* Left Image */}
        <div className={styles.imageWrapper}>
          <img src={AppIcons.Logo} alt="Astrologer" />
        </div>

        {/* Right Content */}
        <div className={styles.content}>
          {/* <p className={styles.subTitle}>
            200+ Celebs recommend <span>Astrotalk</span>
          </p> */}

          <h1 className={styles.title}>Chat With Astrologer</h1>

          <button
            className={styles.cta}
            onClick={() =>
              navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path)
            }
          >
            Chat Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
