import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetManglikDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./Manglik.module.scss";
import { buildVedicParam } from "../../../../../utils/VedicParams.js/vedicParams";

const Manglik = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);

  const queryArgs = formData ? buildVedicParam(formData) : skipToken;

  const { data, isLoading } = useGetManglikDoshQuery(queryArgs);
  const manglik = data?.response;

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!manglik) {
    return (
      <div className={styles.emptyState}>
        <p>No Manglik Dosh data available</p>
      </div>
    );
  }

  return (
    <div className={styles.manglikContainer}>
      {/* Three Column Layout: Manglik Dosh Analysis, Factors, and Aspects */}
      <div className={styles.threeColumnLayout}>
        {/* Column 1: Manglik Dosh Analysis */}
        <div className={styles.column}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📊</span>
              Manglik Dosh Analysis
            </h2>
            
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>By Mars</span>
                <span className={styles.statValue}>
                  {manglik.manglik_by_mars ? "Yes" : "No"}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>By Rahu/Ketu</span>
                <span className={styles.statValue}>
                  {manglik.manglik_by_rahuketu ? "Yes" : "No"}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>By Saturn</span>
                <span className={styles.statValue}>
                  {manglik.manglik_by_saturn ? "Yes" : "No"}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Score</span>
                <span className={styles.statValue}>{manglik.score}%</span>
              </div>
            </div>

            {/* Summary at bottom */}
            {manglik.bot_response && (
              <div className={styles.summaryCardInline}>
                <h3 className={styles.summaryTitleInline}>Summary</h3>
                <p className={styles.summaryTextInline}>{manglik.bot_response}</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Manglik Analysis Factors */}
        {manglik.factors?.length > 0 && (
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔍</span>
                Manglik Analysis Factors
              </h2>
              <div className={styles.factorsList}>
                {manglik.factors.map((item, i) => (
                  <div key={i} className={styles.factorCard}>
                    <span className={styles.factorIcon}>•</span>
                    <p className={styles.factorText}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Column 3: Manglik Aspects */}
        {manglik.aspects?.length > 0 && (
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>✨</span>
                Manglik Aspects
              </h2>
              <div className={styles.aspectsList}>
                {manglik.aspects.map((item, i) => (
                  <div key={i} className={styles.aspectCard}>
                    <span className={styles.aspectIcon}>•</span>
                    <p className={styles.aspectText}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manglik;
