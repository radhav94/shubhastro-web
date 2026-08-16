import styles from "./PrimaryLoader.module.scss";
// Branded loader animation — kept deliberately, do not swap for loading.gif.
//
// Two earlier notes here were wrong and are retracted: the file is 1.6 MB, not
// 8 MB (it has since been compressed), and it does not back the app-level
// Suspense fallback on a cold load — HomeLayout is a static import and wraps
// <Outlet /> in its own <Suspense fallback={<CircleSpinner />}>, so route
// transitions never reach the app-level boundary.
//
// Still worth knowing: it is fetched whenever any screen shows this loader, and
// `.loaderBox img { width: 100px }` in the stylesheet outranks
// `.spinnerGif { width: 320px }` on specificity, so 1.6 MB is downloaded to
// paint a 100x100 box. The width/height attributes below say 320 to match
// .spinnerGif's stated intent, which is not what renders. Resolving that
// mismatch (and shrinking the asset to the size actually painted) is the real
// win here.
import defaultLoadingGif from "../../assets/gif/LOADING-ANIMATION.gif";

const PrimaryLoader = ({
  // Defaults to true so that <PrimaryLoader /> shows a loader.
  //
  // It used to default to undefined, and the guard below returns null when
  // falsy, so a bare <PrimaryLoader /> rendered *nothing*. 21 call sites did
  // exactly that — every one of them inside a loading branch such as
  // `isLoading ? <PrimaryLoader /> : ...` or `{isFetching && <PrimaryLoader />}`
  // — so their loading states were silently blank. On CmsNotFoundPage (the
  // catch-all that serves every CMS/SEO landing page) that meant an entirely
  // empty page for the whole CMS round trip, which reads as "broken" and drives
  // refreshes and repeat clicks.
  //
  // Callers that hide the loader pass isLoading explicitly, so they are
  // unaffected.
  isLoading = true,
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
