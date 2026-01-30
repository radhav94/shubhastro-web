import React from "react";
import styles from "./KundliSummaryV2.module.scss";
import { FaCheckSquare } from "react-icons/fa";
import PrimaryText from "../../PrimaryText";

const KundliSummary = ({ score = 21, total = 36 }) => {
  const percentage = (score / total) * 100;

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.topScoreBox}>
          <div className={styles.totalScoreText}>Total score</div>
          <div className={styles.goodMatch}>{score}/{total}</div>
          <div className={styles.goodMatchText}>
          {score > 30
            ? "Excellent Match"
            : score > 25
            ? "very Good Match"
            : score > 20
            ? "Good Match"
            : score > 15
            ? "Average Match"
            : "Poor Match"}
          </div>
        </div>
    </div>
  );
};

export default KundliSummary;
