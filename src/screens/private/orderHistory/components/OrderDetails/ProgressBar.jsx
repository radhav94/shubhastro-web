import React from "react";
import styles from "./ProgressBar.module.scss";

const ProgressBar = ({ progress = 0 }) => {
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
    </div>
  );
};

export default ProgressBar;
