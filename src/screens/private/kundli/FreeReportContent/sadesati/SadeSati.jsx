import { useSelector } from "react-redux";
import { useGetSadeSatiTableQuery, useGetSadesatiQuery } from "../../../../../redux/api/kundli/dashaApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import TTSButton from "../../../../../component/UI/TTSButton";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import Table from "../../../../../component/UI/table/kundli/free-report/Table";
import styles from "./SadeSati.module.scss";
import { GiStonePath, GiMeditation } from "react-icons/gi";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import { buildVedicParam } from "../../../../../utils/VedicParams.js/vedicParams";
import namaste from "../../../../../assets/images/namaste.png";

const SadeSati = () => {
  const formData = useSelector((state) => state?.form?.kundliPayload);
  const [isRemediesExpanded, setIsRemediesExpanded] = useState(false);

  const queryArgs = formData ? buildVedicParam(formData) : skipToken;

  const { data: sadeSatiTableResponse, isLoading } = useGetSadeSatiTableQuery(queryArgs);
  const sadeSatiTableData = sadeSatiTableResponse?.response;
  const { data: sadeSatiResponse } = useGetSadesatiQuery(queryArgs);
  const sadeSatiData = sadeSatiResponse?.response;
  const isInSadeSati = sadeSatiData?.shani_period_type;

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!sadeSatiData) {
    return (
      <div className={styles.emptyState}>
        <p>No Sade Sati data available</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerOverlay}></div>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            {isInSadeSati
              ? "You Are in Sade Sati Period"
              : "You Are Not in Sade Sati"}
            <span style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
              <TTSButton
                text={[
                  isInSadeSati ? "You Are in Sade Sati Period" : "You Are Not in Sade Sati",
                  sadeSatiData.shani_period_type ? `Period Type: ${sadeSatiData.shani_period_type}` : "",
                  sadeSatiData.bot_response ? `Analysis: ${sadeSatiData.bot_response}` : "",
                  sadeSatiData.date_considered ? `As on ${sadeSatiData.date_considered}` : "",
                  sadeSatiData.remedies?.length ? `Recommended Remedies: ${sadeSatiData.remedies.join(". ")}` : "",
                ].filter(Boolean).join(". ")}
              />
            </span>
          </h1>

          <div className={styles.contentWrapper}>
            {/* Left Column - Period Type */}
            <div className={styles.leftColumn}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Period Type</span>
                <span className={styles.statValue}>
                  {sadeSatiData.shani_period_type || "N/A"}
                </span>
              </div>
            </div>

            {/* Right Column - Analysis */}
            {sadeSatiData.bot_response && (
              <div className={styles.rightColumn}>
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Analysis</h3>
                  <p className={styles.summaryText}>{sadeSatiData.bot_response}</p>
                </div>
              </div>
            )}
          </div>

          {sadeSatiData.date_considered && (
            <p className={styles.dateText}>
              As on {sadeSatiData.date_considered}
            </p>
          )}
        </div>
      </div>

      {/* Remedies Section */}
      {sadeSatiData?.remedies?.length > 0 && (
        <div className={styles.section}>
          <div 
            className={styles.sectionHeader}
            onClick={() => setIsRemediesExpanded(!isRemediesExpanded)}
          >
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}><img src={namaste} width="20" alt="icon" /></span>
              Recommended Remedies
              {/* <span onClick={(e) => e.stopPropagation()} style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }}>
                <TTSButton text={`Recommended Remedies. ${sadeSatiData.remedies.join('. ')}`} />
              </span> */}
            </h2>
            <span className={`${styles.dropdownArrow} ${isRemediesExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </div>
          <div className={`${styles.collapsibleContent} ${isRemediesExpanded ? styles.expanded : ''}`}>
            <div className={styles.remediesGrid}>
              {sadeSatiData.remedies.map((item, i) => (
                <div key={i} className={styles.remedyItem}>
                  <MdOutlineTipsAndUpdates className={styles.remedyIcon} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Table sadeSatiTableData={sadeSatiTableData} />
    </div>
  );
};

export default SadeSati;
