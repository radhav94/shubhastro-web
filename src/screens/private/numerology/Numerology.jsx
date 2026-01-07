import React from "react";
import styles from "./Numerology.module.scss";
import PrimaryText from "../../../component/PrimaryText";
import { PATH } from "../../../utils/routes/Paths";
import { useNavigate } from "react-router-dom";

const NumerologyWeb = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroGlow}></div>

        <PrimaryText
          as="h1"
          size_32
          isExtraBold
          isCenter
          className={styles.heroTitle}
        >
          Decode Your Cosmic Identity
        </PrimaryText>

        <PrimaryText
          size_18
          isRegular
          color="#6b5e4d"
          className={styles.heroSubtitle}
        >
          Experience numerology like never before — a blend of sacred wisdom and
          AI-powered clarity designed for the modern world.
        </PrimaryText>

        {/* <button className={styles.primaryBtn}>Start Your Reading</button> */}
      </section>

      {/* FEATURE CARDS */}
      {/* <section className={styles.features}>
        <div
          className={styles.card}
          onClick={() => navigate(PATH.privateRoutes.LIFE_PATH.path)}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.cardIcon}>🔮</div>
          <PrimaryText size_20 isSemiBold>
            Life Path Insights
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            Discover your purpose, strengths, and spiritual alignment.
          </PrimaryText>
        </div>

        <div className={styles.card}
        // onClick={()=>navigate(PATH.privateRoutes.LIFE_PATH.path)}
        style={{cursor:"pointer"}}>
          <div className={styles.cardIcon}>✨</div>
          <PrimaryText size_20 isSemiBold>
            Compatibility Check
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            Reveal hidden energies between you and the people around you.
          </PrimaryText>
        </div>

          <div className={styles.card}
        onClick={()=>navigate(PATH.privateRoutes.LIFE_PATH.path)}
        style={{cursor:"pointer"}}>
          <div className={styles.cardIcon}>📜</div>
          <PrimaryText size_20 isSemiBold>
            Daily Energies
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            See what influence today’s numbers have on your journey.
          </PrimaryText>
        </div>
      </section> */}

      <section className={styles.features}>
        <div
          className={styles.premiumCard}
          onClick={() => navigate(PATH.privateRoutes.LIFE_PATH.path)}
        >
          <div className={styles.cardIcon}>🔮</div>
          <PrimaryText size_20 isSemiBold>
            Life Path Insights
          </PrimaryText>
          <PrimaryText size_14 color="#6b6357">
            Discover your purpose, strengths, and spiritual alignment.
          </PrimaryText>
        </div>
      </section>

      {/* DEEP INSIGHT SECTION */}
      <section className={styles.deepSection}>
        <PrimaryText size_28 isBold isCenter>
          What Makes Our System Unique?
        </PrimaryText>

        <PrimaryText size_16 color="#6b5e4d" className={styles.deepText}>
          A modern numerology engine built on ancient spiritual mathematics,
          refined with machine intelligence. Each reading uncovers deeper layers
          of your energetic identity.
        </PrimaryText>

        <div className={styles.deepGrid}>
          <div className={styles.deepItem}>
            <span>🧠</span>
            <PrimaryText size_16 isSemiBold>
              AI-Powered Insights
            </PrimaryText>
          </div>

          <div className={styles.deepItem}>
            <span>🔢</span>
            <PrimaryText size_16 isSemiBold>
              Sacred Mathematics
            </PrimaryText>
          </div>

          <div className={styles.deepItem}>
            <span>🌌</span>
            <PrimaryText size_16 isSemiBold>
              Soul Frequency Mapping
            </PrimaryText>
          </div>

          <div className={styles.deepItem}>
            <span>📈</span>
            <PrimaryText size_16 isSemiBold>
              Growth & Destiny Charts
            </PrimaryText>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      {/* <section className={styles.cta}>
        <PrimaryText size_28 isBold isCenter>
          Begin Your Transformation
        </PrimaryText>
        <PrimaryText size_16 color="#6b5e4d" isCenter>
          Let numbers reveal what words cannot.
        </PrimaryText>

        <button className={styles.primaryBtnLarge}>Calculate My Numbers</button>
      </section> */}
    </div>
  );
};
export default NumerologyWeb;
