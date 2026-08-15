import styles from "./PrimaryLoader.module.scss";
// NOTE: this file is 8 MB and is fetched on cold load (it backs the app-level
// Suspense fallback), so it competes with the entry bundle for bandwidth.
// Kept deliberately — the animation is the branded one. Worth compressing the
// asset itself rather than swapping it.
import defaultLoadingGif from "../../assets/gif/LOADING-ANIMATION.gif";

const PrimaryLoader = ({
  isLoading,
  fullscreen = true,
  message = "",
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
        {/* Intrinsic size matches the CSS box so the spinner never reflows the
            loader while it decodes. */}
        <img
          src={actualSpinnerSrc}
          alt="Loading..."
          width="320"
          height="320"
          className={styles.spinnerGif}
        />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default PrimaryLoader;
