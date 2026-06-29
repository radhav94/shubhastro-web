import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetManglikDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import TTSButton from "../../../../../component/UI/TTSButton";
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

  const hasFactors = manglik.factors?.length > 0;
  const hasAspects = manglik.aspects?.length > 0;
  const hasMultipleColumns = hasFactors || hasAspects;

  return (
    <div className={styles.manglikContainer}>
      {/* Layout: Manglik Dosh Analysis, Factors, and Aspects */}
      <div className={hasMultipleColumns ? styles.threeColumnLayout : undefined}>
        {/* Column 1: Manglik Dosh Analysis */}
        <div className={hasMultipleColumns ? styles.column : undefined}>
          <div className={styles.headerCard}>
            <div className={styles.headerOverlay}></div>
            <div className={styles.headerContent}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📊</span>
                Manglik Dosh Analysis
                <span style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                  <TTSButton
                    text={[
                      "Manglik Dosh Analysis",
                      `By Mars: ${manglik.manglik_by_mars ? "Yes" : "No"}`,
                      `By Rahu/Ketu: ${manglik.manglik_by_rahuketu ? "Yes" : "No"}`,
                      `By Saturn: ${manglik.manglik_by_saturn ? "Yes" : "No"}`,
                      `Score: ${manglik.score}%`,
                      manglik.bot_response ? `Summary: ${manglik.bot_response}` : "",
                    ].filter(Boolean).join(". ")}
                  />
                </span>
              </h2>

              <div className={styles.contentWrapper}>
                <div className={styles.leftColumn}>
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
                </div>

                {/* Summary as right column */}
                {manglik.bot_response && (
                  <div className={styles.rightColumn}>
                    <div className={styles.summaryCard}>
                      <h3 className={styles.summaryTitle}>Summary</h3>
                      <p className={styles.summaryText}>{manglik.bot_response}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Manglik Analysis Factors */}
        {hasFactors && (
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🔍</span>
                Manglik Analysis Factors
                <span style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                  <TTSButton text={`Manglik Analysis Factors. ${manglik.factors.join('. ')}`} />
                </span>
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
        {hasAspects && (
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>✨</span>
                Manglik Aspects
                <span style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                  <TTSButton text={`Manglik Aspects. ${manglik.aspects.join('. ')}`} />
                </span>
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
