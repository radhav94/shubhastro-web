import styles from "./SummaryHeader.module.scss";

const SummaryHeader = ({ summary }) => {
  if (!summary?.name) return null;

  const dob = summary.dob || (summary.day && summary.month && summary.year
    ? `${String(summary.day).padStart(2, "0")}/${String(summary.month).padStart(2, "0")}/${summary.year}`
    : "");

  const time = summary.time || (summary.hour != null && summary.min != null
    ? `${String(summary.hour).padStart(2, "0")}:${String(summary.min).padStart(2, "0")}`
    : "");

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>{(summary.name || "U").charAt(0).toUpperCase()}</div>
      <div className={styles.info}>
        <h2 className={styles.name}>{summary.name}</h2>
        <p className={styles.details}>
          {dob}{summary.place && ` • ${summary.place}`}{time && ` • ${time}`}
        </p>
      </div>
    </div>
  );
};

export default SummaryHeader;
