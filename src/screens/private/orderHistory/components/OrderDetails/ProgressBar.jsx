import React, { useRef } from "react";
import styles from "./ProgressBar.module.scss";

const ProgressBar = ({ progress = 0, onSeek }) => {
  const progressRef = useRef(null);

  const updateProgress = (clientX) => {
    const rect = progressRef.current.getBoundingClientRect();

    let percentage = ((clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    onSeek?.(percentage);
  };

  const handleMouseDown = (e) => {
    updateProgress(e.clientX);

    const handleMouseMove = (e) => {
      updateProgress(e.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={progressRef}
      className={styles.progressBar}
      onMouseDown={handleMouseDown}
    >
      <div
        className={styles.progressFill}
        style={{ width: `${progress}%` }}
      />
      <div
        className={styles.thumb}
        style={{ left: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;