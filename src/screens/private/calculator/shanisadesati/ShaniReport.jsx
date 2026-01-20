import { useNavigate } from "react-router-dom";
import { useGetSadeSatiReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./ShaniReport.module.scss";
import { BsCheckCircleFill } from "react-icons/bs";

const ShaniReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("shani_sade_sati"));
  const { data, isLoading } = useGetSadeSatiReportQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const {
    shani_period_type,
    bot_response,
    description,
    date_considered,
    saturn_retrograde,
    age,
    remedies,
  } = data.response;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2>{stored?.name}'s Shani Sade Sati Report</h2>
        <p>Complete analysis of Saturn’s influence on your life journey</p>
      </div>

      {/* STATUS CARD */}
      <div className={styles.statusCard}>
        <span
          className={`${styles.badge} ${
            shani_period_type ? styles.active : styles.inactive
          }`}
        >
          {shani_period_type ? "Currently Active" : "Currently Not Active"}
        </span>

        {bot_response && <p className={styles.statusText}>{bot_response}</p>}
      </div>

      {/* ABOUT */}
      {description && (
        <div className={styles.section}>
          <h3>Understanding Shani Sade Sati</h3>
          <p className={styles.description}>{description}</p>
        </div>
      )}

      {/* DETAILS */}
      <div className={styles.section}>
        <h3>Key Observations</h3>

        <div className={styles.grid}>
          {date_considered && (
            <div className={styles.infoCard}>
              <span>Date Considered</span>
              <strong>{date_considered}</strong>
            </div>
          )}

          <div className={styles.infoCard}>
            <span>Saturn Retrograde</span>
            <strong>{saturn_retrograde ? "Yes" : "No"}</strong>
          </div>

          {typeof age === "number" && (
            <div className={styles.infoCard}>
              <span>Age Considered</span>
              <strong>{age} years</strong>
            </div>
          )}
        </div>
      </div>

      {/* 🔥 REMEDIES – ENHANCED */}
      {Array.isArray(remedies) && remedies.length > 0 && (
        <div className={styles.section}>
          <h3>Recommended Remedies</h3>
          <p className={styles.remedyHint}>
            Practicing these remedies regularly can help balance Saturn’s
            influence and bring stability.
          </p>

          <div className={styles.remedyGrid}>
            {remedies.map((remedy, index) => (
              <div key={index} className={styles.remedyCard}>
                <BsCheckCircleFill className={styles.remedyIcon} />
                <p>{remedy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Shani Sade Sati Report",
                text: bot_response,
              });
            }
          }}
        >
          Share it with others
        </button>

        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default ShaniReport;
