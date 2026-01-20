import React from "react";
import styles from "./WhyAstro.module.scss";

const WhyAstro = () => {
  return (
    <section className={styles.whyAstroSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>WHY ASTROLOGY?</h2>
        <h3 className={styles.subTitle}>Astrology Reveals the Will of God</h3>

        <p className={styles.description}>
          Have you ever felt that things in life sometimes happen at just the
          right time, like someone is silently guiding you? Astrology helps us
          understand this. It shows how God’s energy flows through planets and
          stars, shaping our daily lives.
        </p>

        <p className={styles.description}>
          This old and trusted knowledge explains that nothing is random;
          everything has a reason. The stars often hold clues about our purpose
          and future. Many people today feel unsure about life choices, but
          <strong> ShubhTalk</strong> offers direction.
        </p>

        <p className={styles.description}>
          It connects our daily worries to higher wisdom. By learning to read
          signs from the universe, we can walk in tune with God’s plan. For
          years, astrology has helped people make better decisions in love,
          work, family, and their spiritual journey.
        </p>
      </div>
    </section>
  );
};

export default WhyAstro;
