import { useSelector } from "react-redux";
import { useGetPitraDoshQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import TTSButton from "../../../../../component/UI/TTSButton";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import styles from "./Pitra.module.scss";
import { buildVedicParam } from "../../../../../utils/VedicParams.js/vedicParams";
import namaste from "../../../../../assets/images/namaste.png";

const Pitra = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);
  const [isEffectsExpanded, setIsEffectsExpanded] = useState(false);
  const [isRemediesExpanded, setIsRemediesExpanded] = useState(false);

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

          <div className={styles.contentWrapper}>
            {/* Left Column - Compact Dosh Present Card */}
            <div className={styles.leftColumn}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Dosh Present</span>
                <span className={styles.statValue}>
                  {pitra.is_dosha_present ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Right Column - Details */}
            {pitra.bot_response && (
              <div className={styles.rightColumn}>
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Details</h3>
                  <p className={styles.summaryText}>{pitra.bot_response}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Effects Section */}
      {pitra.effects?.length > 0 && (
        <div className={styles.section}>
          <div 
            className={styles.sectionHeader}
            onClick={() => setIsEffectsExpanded(!isEffectsExpanded)}
          >
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚠️</span>
              Effects of Pitra Dosh
              <span onClick={(e) => e.stopPropagation()} style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                <TTSButton text={`Effects of Pitra Dosh. ${pitra.effects.join('. ')}`} />
              </span>
            </h2>
            <span className={`${styles.dropdownArrow} ${isEffectsExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </div>
          <div className={`${styles.collapsibleContent} ${isEffectsExpanded ? styles.expanded : ''}`}>
            <div className={styles.effectsList}>
              {pitra.effects.map((item, i) => (
                <div key={i} className={styles.effectCard}>
                  <span className={styles.effectIcon}>•</span>
                  <p className={styles.effectText}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Remedies Section */}
      {pitra.remedies?.length > 0 && (
        <div className={styles.section}>
          <div 
            className={styles.sectionHeader}
            onClick={() => setIsRemediesExpanded(!isRemediesExpanded)}
          >
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}><img src={namaste} width="20" alt="icon" /></span>
              Remedies
              <span onClick={(e) => e.stopPropagation()} style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                <TTSButton text={`Remedies. ${pitra.remedies.join('. ')}`} />
              </span>
            </h2>
            <span className={`${styles.dropdownArrow} ${isRemediesExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </div>
          <div className={`${styles.collapsibleContent} ${isRemediesExpanded ? styles.expanded : ''}`}>
            <div className={styles.remediesList}>
              {pitra.remedies.map((item, i) => (
                <div key={i} className={styles.remedyCard}>
                  <span className={styles.remedyIcon}>•</span>
                  <p className={styles.remedyText}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pitra;
