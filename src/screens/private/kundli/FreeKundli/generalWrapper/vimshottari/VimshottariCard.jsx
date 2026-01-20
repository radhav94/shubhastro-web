import React from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./Vimshottari.module.scss";

const VimshottariCard = ({ dasha }) => {
  if (!dasha) return null;

  return (
    <div className={styles.wrapper}>

      {/* DASHa TITLE */}
      <PrimaryText
        as="h2"
        size_20
        isBold
        className={styles.title}
      >
        {dasha.dasha} Mahadasha
      </PrimaryText>

      {/* DATES */}
      <div className={styles.row}>
        <PrimaryText size_14 isSemiBold className={styles.label}>
          Start
        </PrimaryText>
        <PrimaryText size_14 className={styles.value}>
          {dasha.dasha_start_year}
        </PrimaryText>
      </div>

      <div className={styles.row}>
        <PrimaryText size_14 isSemiBold className={styles.label}>
          End
        </PrimaryText>
        <PrimaryText size_14 className={styles.value}>
          {dasha.dasha_end_year}
        </PrimaryText>
      </div>

      {/* Prediction */}
      <div className={styles.section}>
        <PrimaryText
          size_14
          isBold
          color="#5a49e8"
          className={styles.sectionTitle}
        >
          Prediction
        </PrimaryText>

        <PrimaryText size_14 className={styles.text}>
          {dasha.prediction}
        </PrimaryText>
      </div>

      {/* Planet in Zodiac */}
      <div className={styles.section}>
        <PrimaryText
          size_14
          isBold
          color="#5a49e8"
          className={styles.sectionTitle}
        >
          Planet in Zodiac
        </PrimaryText>

        <PrimaryText size_14 className={styles.text}>
          {dasha.planet_in_zodiac}
        </PrimaryText>
      </div>

    </div>
  );
};

export default VimshottariCard;
