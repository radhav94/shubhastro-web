import styles from "./AISessionStatus.module.scss";

const AISessionStatus = ({ isFreePeriod, freeMinutesRemaining, remainingPaidTime }) => {
  if (isFreePeriod && freeMinutesRemaining != null) {
    return (
      <div className={styles.status}>
        <span className={styles.freeBadge}>FREE</span>
        <span className={styles.counter}>{freeMinutesRemaining} min left</span>
      </div>
    );
  }

  if (!isFreePeriod && remainingPaidTime != null) {
    const h = Math.floor(remainingPaidTime / 3600);
    const mins = String(Math.floor((remainingPaidTime % 3600) / 60)).padStart(2, "0");
    const secs = String(remainingPaidTime % 60).padStart(2, "0");
    return (
      <div className={styles.status}>
        <span className={styles.paidBadge}>PAID</span>
        <span className={styles.counter}>{h > 0 ? `${String(h).padStart(2, "0")}:` : ""}{mins}:{secs}</span>
      </div>
    );
  }

  return null;
};

export default AISessionStatus;
