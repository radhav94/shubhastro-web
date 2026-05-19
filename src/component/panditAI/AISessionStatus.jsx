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
    return (
      <div className={styles.status}>
        <span className={styles.paidBadge}>PAID</span>
        <span className={styles.counter}>{remainingPaidTime} min left</span>
      </div>
    );
  }

  return null;
};

export default AISessionStatus;
