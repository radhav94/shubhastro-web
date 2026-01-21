import { useSelector } from "react-redux";
import { useGetMangalDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./Mangal.module.scss";

const Mangal = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData
    ? {
      dob: `${formData.day}/${formData.month}/${formData.year}`,
      tob: `${String(formData.hour).padStart(2, "0")}:${String(
        formData.min
      ).padStart(2, "0")}`,
      lat: formData.lat,
      lon: formData.lon,
      tz: formData.tzone,
      lang: "en",
    }
    : skipToken;

  const { data, isLoading } = useGetMangalDoshQuery(queryArgs);
  const mangal = data?.response;

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!mangal) {
    return (
      <div className={styles.emptyState}>
        <p>No Mangal Dosh data available</p>
      </div>
    );
  }

  return (
    <div className={styles.mangalContainer}>
      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerOverlay}></div>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Mangal Dosh Analysis</h1>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Mangal Present</span>
              <span className={styles.statValue}>
                {mangal.is_dosha_present ? "Yes" : "No"}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Dasha From Lagna</span>
              <span className={styles.statValue}>
                {mangal.is_dosha_present_mars_from_lagna ? "Yes" : "No"}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Dosha From Moon</span>
              <span className={styles.statValue}>
                {mangal.is_dosha_present_mars_from_moon ? "Yes" : "No"}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>{mangal.score}%</span>
            </div>
          </div>

          {mangal.bot_response && (
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Details</h3>
              <p className={styles.summaryText}>{mangal.bot_response}</p>
            </div>
          )}
        </div>
      </div>

      {/* Factors Section */}
      {mangal.factors && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔍</span>
            Mangal Analysis Factors
          </h2>
          <div className={styles.factorsList}>
            {mangal.factors.mars && (
              <div className={styles.factorCard}>
                <span className={styles.factorIcon}>•</span>
                <p className={styles.factorText}>{mangal.factors.mars}</p>
              </div>
            )}
            {mangal.factors.moon && (
              <div className={styles.factorCard}>
                <span className={styles.factorIcon}>•</span>
                <p className={styles.factorText}>{mangal.factors.moon}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Section */}
      {mangal.cancellation?.cancellationReason?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>✨</span>
            Cancellation / Exception
          </h2>
          <div className={styles.factorsList}>
            {mangal.cancellation.cancellationReason.map((item, i) => (
              <div key={i} className={styles.factorCard}>
                <span className={styles.factorIcon}>•</span>
                <p className={styles.factorText}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mangal;
