import React from "react";
import styles from "./KundliSummary.module.scss";
import { FaCheckSquare } from "react-icons/fa";
import PrimaryText from "../../PrimaryText";

const KundliSummary = ({ score = 21, total = 36 }) => {
  const percentage = (score / total) * 100;

  return (
    <div className={styles.summaryContainer}>
      <div className="bg-gradient-to-r w-h max-w-sm bg-[#FF6A3D] rounded-xl shadow-md p-5 text-center mb-5 from-[#FF6A3D] to-[#FF3D00] rounded-xl">
          <div className="text-sm text-white mb-1">Total score</div>
          <div className="text-4xl font-bold text-white mb-2">{score}/{total}</div>
          <div className="bg-white text-[#FF6A3D] font-semibold py-1 px-4 rounded-full inline-block">
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
