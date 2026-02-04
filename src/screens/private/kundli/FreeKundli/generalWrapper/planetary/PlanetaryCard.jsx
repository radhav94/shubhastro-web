import React from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./Planetary.module.scss";

const PlanetaryCard = ({ planet }) => {
  if (!planet) {
    return (
      <div className={styles.card}>
        <PrimaryText size_16 color="#555">
          No data available
        </PrimaryText>
      </div>
    );
  }

  const safe = (value, fallback = "—") =>
    value !== undefined && value !== null && value !== "" ? value : fallback;

  return (
    <div className={styles.card}>
      {/* Title */}
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          {safe(planet.planet_considered)} Consideration
        </h2>
      </div>

      {/* Planet Definition */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Definition
        </h2>
        <p size_16 color="#555" className={styles.sectionContent}>
          {safe(planet.planet_definitions)}
        </p>
      </div>
      {/* Affliction */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Affliction
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.affliction)}
        </p>
      </div>

      {/* Mantra */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Gayatri Mantra
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.gayatri_mantra)}
        </p>
      </div>

      {/* General Prediction */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          General Prediction
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.general_prediction)}
        </p>
      </div>

      {/* Zodiac Prediction */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Planet Zodiac Prediction
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.planet_zodiac_prediction)}
        </p>
      </div>

      {/* Personalised Prediction */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Personalised Prediction
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.personalised_prediction)}
        </p>
      </div>

      {/* Long Qualities */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Long Qualities
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.qualities_long)}
        </p>
      </div>
      {/*Short  Qualities */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          short Qualities
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.qualities_short)}
        </p>
      </div>

      {/* Verbal Location */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Verbal Location
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.verbal_location)}
        </p>
      </div>

      {/* Zodiac Lord Location */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Zodiac Lord Location
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.zodiac_lord_location)}
        </p>
      </div>

      {/* Zodiac Lord Strength */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Zodiac Lord Strength
        </h2>
        <p color="#555" className={styles.sectionContent}>
          {safe(planet.zodiac_lord_strength)}
        </p>
      </div>

      {/* Tags */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Character Traits
        </h2>

        <div className={styles.tagContainer}>
          {(planet.character_keywords_positive ?? [])?.map((k, idx) => (
            <span
              key={`pos-${idx}`}
              className={`${styles.tag} ${styles.tagPositive}`}
            >
              {k ?? "—"}
            </span>
          ))}

          {(planet.character_keywords_negative ?? [])?.map((k, idx) => (
            <span
              key={`neg-${idx}`}
              className={`${styles.tag} ${styles.tagNegative}`}
            >
              {k ?? "—"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanetaryCard;
