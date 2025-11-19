import React from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./Planetary.module.scss";

const PlanetaryCard = ({ planet }) => {
  if (!planet) {
    return (
      <div className={styles.card}>
        <PrimaryText size_16 color="#555">No data available</PrimaryText>
      </div>
    );
  }

  const safe = (value, fallback = "—") =>
    value !== undefined && value !== null && value !== "" ? value : fallback;

  return (
    <div className={styles.card}>

      {/* Title */}
      <div className={styles.cardHeader}>
        <PrimaryText isBold size_20 className={styles.cardTitle}>
          {safe(planet.planet_considered)} • Consideration
        </PrimaryText>
      </div>

      {/* Affliction */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Affliction
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.affliction)}
        </PrimaryText>
      </div>

      {/* Mantra */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Gayatri Mantra
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.gayatri_mantra)}
        </PrimaryText>
      </div>

      {/* General Prediction */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          General Prediction
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.general_prediction)}
        </PrimaryText>
      </div>

      {/* Zodiac Prediction */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Planet Zodiac Prediction
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.planet_zodiac_prediction)}
        </PrimaryText>
      </div>

      {/* Personalised Prediction */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Personalised Prediction
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.personalised_prediction)}
        </PrimaryText>
      </div>

      {/* Qualities */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Qualities
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.qualities_long)}
        </PrimaryText>
      </div>

      {/* Verbal Location */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Verbal Location
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.verbal_location)}
        </PrimaryText>
      </div>

      {/* Zodiac Lord Location */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Zodiac Lord Location
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.zodiac_lord_location)}
        </PrimaryText>
      </div>

      {/* Zodiac Lord Strength */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Zodiac Lord Strength
        </PrimaryText>
        <PrimaryText size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.zodiac_lord_strength)}
        </PrimaryText>
      </div>

      {/* Tags */}
      <div className={styles.section}>
        <PrimaryText size_14 isSemiBold className={styles.sectionTitle}>
          Character Traits
        </PrimaryText>

        <div className={styles.tagContainer}>
          {(planet.character_keywords_positive ?? [])?.map((k, idx) => (
            <PrimaryText
              key={`pos-${idx}`}
              size_13
              className={`${styles.tag} ${styles.tagPositive}`}
            >
              {k ?? "—"}
            </PrimaryText>
          ))}

          {(planet.character_keywords_negative ?? [])?.map((k, idx) => (
            <PrimaryText
              key={`neg-${idx}`}
              size_13
              className={`${styles.tag} ${styles.tagNegative}`}
            >
              {k ?? "—"}
            </PrimaryText>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PlanetaryCard;
