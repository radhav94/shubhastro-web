import { skipToken } from "@reduxjs/toolkit/query";
import { useGetKaalSarpDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import { useSelector } from "react-redux";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "../manglik/Manglik.module.scss";

const KaalSarp = () => {
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

  const { data, isLoading } = useGetKaalSarpDoshQuery(queryArgs);
  const kaalsarp = data?.response;

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!kaalsarp) {
    return (
      <div className={styles.emptyState}>
        <p>No Kaal Sarp Dosh data available</p>
      </div>
    );
  }

  return (
    <div className={styles.manglikContainer}>
      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerOverlay}></div>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Kaal Sarp Dosh Analysis</h1>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Dosh Present</span>
              <span className={styles.statValue}>
                {kaalsarp.is_dosha_present ? "Yes" : "No"}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Dosha Type</span>
              <span className={styles.statValue}>
                {kaalsarp.dosha_type || "--"}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Dosha Direction</span>
              <span className={styles.statValue}>
                {kaalsarp.dosha_direction || "--"}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Rahu Ketu Axis</span>
              <span className={styles.statValue}>
                {kaalsarp.rahu_ketu_axis || "--"}
              </span>
            </div>
          </div>

          {kaalsarp.bot_response && (
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Details</h3>
              <p className={styles.summaryText}>{kaalsarp.bot_response}</p>
            </div>
          )}
        </div>
      </div>

      {/* Remedies Section */}
      {kaalsarp.remedies?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🙏</span>
            Remedies
          </h2>
          <div className={styles.factorsList}>
            {kaalsarp.remedies.map((item, i) => (
              <div key={i} className={styles.factorCard}>
                <span className={styles.factorIcon}>•</span>
                <p className={styles.factorText}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aspects Section */}
      {kaalsarp.aspects?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>✨</span>
            Kaal Sarp Aspects
          </h2>
          <div className={styles.aspectsList}>
            {kaalsarp.aspects.map((item, i) => (
              <div key={i} className={styles.aspectCard}>
                <span className={styles.aspectIcon}>•</span>
                <p className={styles.aspectText}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KaalSarp;
