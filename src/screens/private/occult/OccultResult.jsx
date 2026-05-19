import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import styles from "./OccultResult.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import astralCompass from "../../../assets/icons/astral-compass.svg";
import { format12HourTime } from "../../../utils/dateFormat/dateTime";

const SEVERITY_COLOR = {
  SEVERE: "#ef4444",
  HIGH: "#f97316",
  MODERATE: "#f59e0b",
  MILD: "#22c55e",
  NONE: "#22c55e",
};

const DoshaCard = ({ dosha }) => {
  const { isAfflicted, severity, code, name, description, prescribedRemedy } = dosha;
  const borderColor = isAfflicted ? (SEVERITY_COLOR[severity] || "#f59e0b") : "#22c55e";

  return (
    <div className={styles.doshaCard} style={{ borderColor }}>
      <div className={styles.doshaHeader}>
        <div className={styles.doshaIcon} style={{ borderColor }}>
          <span>{code}</span>
        </div>
        <div className={styles.doshaTitle}>
          <h3>{name}</h3>
          <span className={isAfflicted ? styles.afflicted : styles.clear}>
            {isAfflicted ? "AFFLICTION DETECTED" : "CLEAR · NO AFFLICTION"}
          </span>
        </div>
        {isAfflicted && (
          <span className={styles.severityBadge} style={{ background: SEVERITY_COLOR[severity] }}>
            {severity}
          </span>
        )}
      </div>
      {isAfflicted && (
        <div className={styles.doshaBody}>
          {description && <p className={styles.doshaDesc}>{description}</p>}
          {prescribedRemedy && (
            <div className={styles.remedyBox}>
              <span className={styles.remedyLabel}>PRESCRIBED REMEDY</span>
              <p>{prescribedRemedy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OccultResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>No analysis data found.</p>
          <button className={styles.backBtn} onClick={() => navigate(PATH.privateRoutes.OCCULT.path)}>Go Back</button>
        </div>
      </div>
    );
  }

  const { userDetails, overallOccultInfluence, priorityRemedy, doshaAnalysis, summary } = result;
  const doshas = doshaAnalysis ? Object.values(doshaAnalysis) : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={astralCompass} alt="Astral Compass" className={styles.headerIcon} />
        <span className={styles.headerKicker}>SHUBHASTRO · OCCULT ANALYSIS</span>
        <h1 className={styles.headerTitle}>Dosha Darshan</h1>
        <p className={styles.headerSubtitle}>Unveiling karmic afflictions through the lens of Jyotish Shastra</p>
      </div>

      {userDetails && (
        <div className={styles.detailsTable}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>NAME</span>
            <span className={styles.detailValue}>{userDetails.name}</span>
            <span className={styles.detailLabel}>DATE OF BIRTH</span>
            <span className={styles.detailValue}>{userDetails.dateOfBirth ? dayjs(userDetails.dateOfBirth).format("DD MMM YYYY") : "--"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>PLACE OF BIRTH</span>
            <span className={styles.detailValue}>{userDetails.placeOfBirth}</span>
            <span className={styles.detailLabel}>TIME OF BIRTH</span>
            <span className={styles.detailValue}>{userDetails.timeOfBirth ? format12HourTime(userDetails.timeOfBirth.split(":")[0], userDetails.timeOfBirth.split(":")[1]) : "--"}</span>
          </div>
        </div>
      )}

      <div className={styles.influenceBadge}>✦ OCCULT INFLUENCE: {overallOccultInfluence} ✦</div>

      {priorityRemedy && (
        <div className={styles.priorityBox}>
          <span className={styles.priorityLabel}>■ PRIORITY REMEDY</span>
          <p>{priorityRemedy}</p>
        </div>
      )}

      <div className={styles.doshaSection}>
        <h2 className={styles.doshaSectionTitle}>DOSHA ANALYSIS · {doshas.length} AFFLICTIONS EXAMINED</h2>
        {doshas.map((d) => <DoshaCard key={d.code} dosha={d} />)}
      </div>

      {summary && (
        <div className={styles.summarySection}>
          <h2 className={styles.summaryTitle}>SUMMARY</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCell}><span className={styles.summaryCellLabel}>Total Doshas Detected</span><span className={styles.summaryCellValue}>{summary.totalDoshasDetected}</span></div>
            <div className={styles.summaryCell}><span className={styles.summaryCellLabel}>Doshas Clear</span><span className={styles.summaryCellValue}>{summary.doshasClear}</span></div>
            <div className={styles.summaryCell}><span className={styles.summaryCellLabel}>Overall Intensity</span><span className={styles.summaryCellValue}>{summary.overallOccultIntensity}</span></div>
            <div className={styles.summaryCell}><span className={styles.summaryCellLabel}>Analysis Model</span><span className={styles.summaryCellValue}>{summary.analysisModel}</span></div>
          </div>
        </div>
      )}

      <p className={styles.disclaimer}>
        This report is generated by Shubhastro's AI-powered Vedic astrology engine for spiritual guidance only.
        For serious consultations, please consult a certified Jyotish practitioner.
      </p>

      <div className={styles.actionRow}>
        {/* <button className={styles.backBtn} onClick={() => navigate(PATH.privateRoutes.OCCULT.path)}>New Analysis</button> */}
        <button className={styles.consultBtn} onClick={() => navigate("/talk-to-astrologer")}>Consult with Expert Astrologer</button>
      </div>
    </div>
  );
};

export default OccultResult;
