import { useSelector } from "react-redux";
import { useGetPitraDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import { skipToken } from "@reduxjs/toolkit/query";
import styles from "../manglik/Manglik.module.scss";
import { buildVedicParam } from "../../../../../utils/VedicParams.js/vedicParams";

const Pitra = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData ? buildVedicParam(formData) : skipToken;

  const { data, isLoading } = useGetPitraDoshQuery(queryArgs);
  const pitra = data?.response;

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!pitra) {
    return (
      <div className={styles.emptyState}>
        <p>No Pitra Dosh data available</p>
      </div>
    );
  }

  return (
    <div className={styles.manglikContainer}>
      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerOverlay}></div>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Pitra Dosh Analysis</h1>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Dosh Present</span>
              <span className={styles.statValue}>
                {pitra.is_dosha_present ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {pitra.bot_response && (
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Details</h3>
              <p className={styles.summaryText}>{pitra.bot_response}</p>
            </div>
          )}
        </div>
      </div>

      {/* Effects Section */}
      {pitra.effects?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⚠️</span>
            Effects of Pitra Dosh
          </h2>
          <div className={styles.factorsList}>
            {pitra.effects.map((item, i) => (
              <div key={i} className={styles.factorCard}>
                <span className={styles.factorIcon}>•</span>
                <p className={styles.factorText}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remedies Section */}
      {pitra.remedies?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🙏</span>
            Remedies
          </h2>
          <div className={styles.aspectsList}>
            {pitra.remedies.map((item, i) => (
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

export default Pitra;
