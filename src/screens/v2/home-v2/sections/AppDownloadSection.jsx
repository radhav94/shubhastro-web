import {
  PLAY_STORE_URL,
  APP_STORE_URL,
} from "../../../../utils/helper/appStoreLinks";
import { trackEvent } from "../../../../utils/analytics";
import styles from "./AppDownloadSection.module.scss";

// The whole right-side visual — both phone mockups and the two floating feature
// cards ("Daily guidance" / "Personalized Insights") — baked into one image,
// served from the CDN (desktop + mobile crops).
const appVisual = "https://assets.shubhastro.ai/images/desktop-get-app.png";
const appVisualMobile = "https://assets.shubhastro.ai/images/mobile-get-app.png";

/*
  Home "download the app" hero banner.

  Left column: kicker + headline (last word accented orange) + blurb + the two
  app-store badges. Right column: two overlapping phone mockups with two
  floating feature cards (Daily guidance / Personalized Insights), as in the
  reference design.

  Store links reuse utils/helper/appStoreLinks — the App Store badge is only
  shown once APP_STORE_URL is set (the iOS app isn't published yet), matching
  the Footer's behaviour so we never advertise a dead link.
*/
/* Render a headline with its LAST word highlighted in brand orange, e.g.
   "Get answers to your <accent>future today</accent>". Splits off the last two
   words so the CMS `display_title` gets the same accent as the fallback. */
const renderHeadline = (text) => {
  const words = String(text).trim().split(/\s+/);
  if (words.length <= 2) {
    return <span className={styles.titleAccent}>{text}</span>;
  }
  const accent = words.slice(-2).join(" ");
  const head = words.slice(0, -2).join(" ");
  return (
    <>
      {head} <span className={styles.titleAccent}>{accent}</span>
    </>
  );
};

const AppDownloadSection = ({ sectionData }) => {
  const trackStoreClick = (store) =>
    trackEvent("app_store_click", { store, location: "home_app_banner" });

  // Copy from the CMS "get-app" section, falling back to the default text.
  const kicker = sectionData?.sub_title || "Astrology Guidance, Anytime";
  const heading = sectionData?.display_title || sectionData?.title || "";
  const blurb =
    sectionData?.description ||
    "Talk with expert astrologers, call instantly, or use Shubh AI for deep answers on work, marriage, wealth, health and more. Unlock accurate horoscopes, custom insights, and effective remedies based on your birth chart — all right from your phone.";

  return (
    <section className={styles.section} aria-label="Download the ShubhAstro app">
      <span className={styles.watermark} aria-hidden="true" />

      {/* Inner rounded card that holds the content (darker peach fill), sitting
          on the section's lighter watermarked background — as in the design. */}
      <div className={styles.card}>
      <div className={styles.inner}>
        {/* Kicker + headline. On mobile the visual sits between this and the
            blurb/badges (see .inner ordering); on desktop both copy blocks are
            in the left column with the visual on the right. */}
        {/* <div className={styles.right}> */}
        <div className={styles.copyHead}>
          <span className={styles.kicker}>{kicker}</span>

          <h2 className={styles.title}>
            {heading ? (
              renderHeadline(heading)
            ) : (
              <>
                Get answers to your{" "}
                <span className={styles.titleAccent}>future today</span>
              </>
            )}
          </h2>
        </div>

        {/* Blurb + store badges. */}
        <div className={styles.copyBody}>
          <p className={styles.blurb}>{blurb}</p>

          <div className={styles.stores}>
            {/* App Store badge. Links to the App Store when the iOS build is
                live (APP_STORE_URL); until then it falls back to the Play Store
                so the tap still goes somewhere instead of being a dead click. */}
            <a
              href={APP_STORE_URL || PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.storeBtn}
              onClick={() => trackStoreClick("app_store")}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M17.05 20.28C16.03 21.23 14.96 21.08 13.93 20.63C12.85 20.17 11.85 20.15 10.71 20.63C9.28 21.25 8.52 21.07 7.62 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C19.01 17.7 18.27 19.19 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z" />
              </svg>
              <span className={styles.storeText}>
                <span className={styles.storeLabel}>Download on the</span>
                <span className={styles.storeName}>App Store</span>
              </span>
            </a>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.storeBtn}
              onClick={() => trackStoreClick("google_play")}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#4CAF50" />
                <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#F44336" />
                <path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" fill="#FFC107" />
                <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#2196F3" />
              </svg>
              <span className={styles.storeText}>
                <span className={styles.storeLabel}>GET IT ON</span>
                <span className={styles.storeName}>Google Play</span>
              </span>
            </a>
          </div>
        </div>
        {/* </div> */}

        {/* Visual — one baked-in image (phones + floating cards). Desktop and
            mobile use different crops; only one shows per breakpoint. */}
        <div className={styles.visual} aria-hidden="true">
          <img
            src={appVisual}
            alt=""
            className={`${styles.visualImg} ${styles.visualDesktop}`}
            loading="lazy"
            decoding="async"
          />
          <img
            src={appVisualMobile}
            alt=""
            className={`${styles.visualImg} ${styles.visualMobile}`}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
