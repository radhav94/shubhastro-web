import React from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./YogaCard.module.scss";

const YogaCard = ({ yoga }) => {
  if (!yoga) return null;

  return (
    <div className={styles.wrapper}>
      {/* Title */}
      <PrimaryText
        as="h2"
        size_20
        isBold
        color="#2a2a2a"
        className={styles.title}
      >
        {yoga.yoga}
      </PrimaryText>

      {/* Meaning */}
      <div className={styles.section}>
        <PrimaryText
          size_14
          isBold
          color="#5a49e8"
          className={styles.sectionTitle}
        >
          Meaning
        </PrimaryText>

        <PrimaryText
          size_14
          color="#4f4f4f"
          className={styles.text}
        >
          {yoga.meaning}
        </PrimaryText>
      </div>

      {/* Strength */}
      <div className={styles.sectionRow}>
        <PrimaryText size_14 isSemiBold className={styles.label}>
          Strength
        </PrimaryText>
        <PrimaryText size_14 className={styles.value}>
          {yoga.strength_in_percentage}%
        </PrimaryText>
      </div>

      {/* Planets */}
      <div className={styles.sectionRow}>
        <PrimaryText size_14 isSemiBold className={styles.label}>
          Planets
        </PrimaryText>

        <PrimaryText size_14 className={styles.value}>
          {yoga.planets_involved?.join(", ")}
        </PrimaryText>
      </div>

      {/* Houses */}
      <div className={styles.sectionRow}>
        <PrimaryText size_14 isSemiBold className={styles.label}>
          Houses
        </PrimaryText>

        <PrimaryText size_14 className={styles.value}>
          {yoga.houses_involved?.join(", ")}
        </PrimaryText>
      </div>
    </div>
  );
};

export default YogaCard;
