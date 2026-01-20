import React from "react";
import styles from "./YogaSummaryCard.module.scss";

const YogaSummaryCard = ({ summary }) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Yoga Summary</h2>

      <div className={styles.row}>
        <span className={styles.label}>Total Yogas</span>
        <span className={styles.value}>{summary.yogas_count}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Raja Yogas</span>
        <span className={styles.value}>{summary.raja_yoga_count}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Dhana Yogas</span>
        <span className={styles.value}>{summary.dhana_yoga_count}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Daridra Yogas</span>
        <span className={styles.value}>{summary.daridra_yoga_count}</span>
      </div>
    </div>
  );
};

export default YogaSummaryCard;
