import React from "react";
import styles from "./KundliSummary.module.scss";
import { FaCheckSquare } from "react-icons/fa";
import PrimaryText from "../../PrimaryText";

const KundliSummary = ({ score = 21, total = 36 }) => {
  const percentage = (score / total) * 100;

  return (
    <div className={styles.summaryContainer}>
      {/* Header */}
      <div className={styles.header}>
        <FaCheckSquare className={styles.icon} />
        <span className={styles.title}>Summary of the Kundli Report</span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.scoreText}>
          <strong>
            {score}/{total}
          </strong>{" "}
          is your Guna Score!
        </h3>

        {/* Custom Circular Ring */}
        <div className={styles.chartWrapper}>
          <div
            className={styles.circle}
            style={{
              background: `conic-gradient(
                #ffa500 ${percentage * 3.6}deg,
                #fdeac9 ${percentage * 3.6}deg
              )`,
            }}
          >
            <div className={styles.innerCircle}>
              {score}/{total}
            </div>
          </div>
        </div>
        <PrimaryText paddingTop="1rem" isCenter size_20 isSemiBold>
          {score > 30
            ? "Excellent Match😍"
            : score > 25
            ? "very Good Match😉"
            : score > 20
            ? "Good Match😊"
            : score > 15
            ? "Average Match😁"
            : "Poor Match😢"}
        </PrimaryText>
      </div>
    </div>
  );
};

export default KundliSummary;
