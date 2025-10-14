import React from "react";
import styles from "./PrimaryLoader.module.scss";
import defaultLoadingGif from "../../assets/gif/loading.gif";

const PrimaryLoader = ({
  isLoading,
  fullscreen = true,
  message = "Loading Please Wait",
  spinnerSrc,
}) => {
  if (!isLoading) {
    return null;
  }

  const wrapperClass = fullscreen
    ? `${styles.loaderWrapper} ${styles.fullscreen}`
    : styles.loaderWrapper;

  const actualSpinnerSrc = spinnerSrc || defaultLoadingGif;

  return (
    <div className={wrapperClass}>
      <div className={styles.loaderBox}>
        <img
          src={actualSpinnerSrc}
          alt="Loading..."
          className={styles.spinnerGif}
        />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default PrimaryLoader;
