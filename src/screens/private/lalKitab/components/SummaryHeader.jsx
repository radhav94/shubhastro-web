import styles from "./SummaryHeader.module.scss";
import { format12HourTime } from "../../../../utils/dateFormat/dateTime";

const SummaryHeader = ({ summary }) => {
  if (!summary?.name) return null;

  const dob = summary.dob
    ? new Date(summary.dob.split("/").reverse().join("-")).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : (summary.day && summary.month && summary.year
      ? new Date(summary.year, summary.month - 1, summary.day).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "");

  const time = summary.time
    ? format12HourTime(summary.time.split(":")[0], summary.time.split(":")[1])
    : (summary.hour != null && summary.min != null
      ? format12HourTime(summary.hour, summary.min, summary.meridiem)
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
