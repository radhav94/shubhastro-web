import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetSadeSatiReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./ShaniReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import { BsCheckCircleFill } from "react-icons/bs";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const ShaniReport = () => {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(true);

  const stored = useSelector(selectCalculatorData("shani_sade_sati"));
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
    <>
    <div className={styles.wrapper}>
      <CalcBackButton />

      {/* HEADER */}
      <div className={styles.header}>
        <h2>
          {stored?.name
            ? `${stored.name.toUpperCase()}'S SHANI SADE SATI REPORT`
            : "SHANI SADE SATI REPORT"}
        </h2>
        <p>Complete analysis of Saturn&apos;s influence on your life journey</p>
      </div>

      {/* STATUS CARD */}
      <div className={styles.statusCard} style={{ position: "relative" }}>
        <span style={{ position: "absolute", top: "8px", right: "8px", display: "inline-flex", zIndex: 10, pointerEvents: "auto" }}>
          <TTSButton text={`Shani Sade Sati Status. ${shani_period_type ? "Currently Active" : "Currently Not Active"}. ${bot_response || ""}`} />
        </span>
        <span
          className={`${styles.badge} ${shani_period_type ? styles.active : styles.inactive}`}
        >
          {shani_period_type ? "Currently Active" : "Currently Not Active"}
        </span>
        {bot_response && <p className={styles.statusText}>{bot_response}</p>}
      </div>

      {/* UNDERSTANDING SHANI SADE SATI - ACCORDION */}
      {description && (
        <div className={styles.accordionBox}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setAboutOpen((prev) => !prev)}
            aria-expanded={aboutOpen}
          >
            <span>Understanding Shani Sade Sati</span>
            <span className={styles.ttsWrap}>
              <span onClick={(e) => e.stopPropagation()}>
                <TTSButton text={`Understanding Shani Sade Sati. ${description}`} />
              </span>
              <svg
                className={`${styles.chevron} ${aboutOpen ? styles.chevronOpen : ""}`}
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e84d00"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div className={`${styles.accordionBody} ${aboutOpen ? styles.accordionBodyOpen : ""}`}>
            <p>{description}</p>
          </div>
        </div>
      )}

      {/* KEY OBSERVATIONS */}
      <div className={styles.section}>
        <h3>Key Observation</h3>
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

      {/* REMEDIES */}
      {shani_period_type && Array.isArray(remedies) && remedies.length > 0 && (
        <div className={styles.section} style={{ position: "relative" }}>
          <span style={{ position: "absolute", top: "0", right: "0", display: "inline-flex", zIndex: 10, pointerEvents: "auto" }}>
            <TTSButton text={`Recommended Remedies. ${remedies.join(". ")}`} />
          </span>
          <h3>Recommended Remedies</h3>
          <p className={styles.remedyHint}>
            Practicing these remedies regularly can help balance Saturn&apos;s
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
        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>

      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </div>
    </>
  );
};

export default ShaniReport;
