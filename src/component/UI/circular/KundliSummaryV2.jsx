import React from "react";
import styles from "./KundliSummaryV2.module.scss";
import { FaCheckSquare } from "react-icons/fa";
import PrimaryText from "../../PrimaryText";

const KundliSummary = ({ score = 21, total = 36 }) => {
  const percentage = (score / total) * 100;

  return (
    <div className={styles.summaryContainer}>
      <span className={styles.roundedHeart}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M22.1579 16.3272C23.8956 14.6245 25.6566 12.5836 25.6566 9.91292C25.6566 8.21175 24.9808 6.58026 23.7779 5.37735C22.575 4.17444 20.9435 3.49866 19.2424 3.49866C17.1898 3.49866 15.7437 4.08177 13.9943 5.83112C12.245 4.08177 10.7989 3.49866 8.74629 3.49866C7.04513 3.49866 5.41363 4.17444 4.21073 5.37735C3.00782 6.58026 2.33203 8.21175 2.33203 9.91292C2.33203 12.5952 4.08138 14.6361 5.83072 16.3272L13.9943 24.4908L22.1579 16.3272Z" fill="#FEFEFE" stroke="#FEFEFE" stroke-width="2.33246" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
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
