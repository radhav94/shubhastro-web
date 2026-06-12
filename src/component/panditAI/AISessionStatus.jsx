import styles from "./AISessionStatus.module.scss";

const AISessionStatus = ({ remainingPaidTime }) => {
  if (remainingPaidTime == null) return null;

  const h = Math.floor(remainingPaidTime / 3600);
  const mins = String(Math.floor((remainingPaidTime % 3600) / 60)).padStart(2, "0");
  const secs = String(remainingPaidTime % 60).padStart(2, "0");

  return (
    <div className={styles.status}>
      <span className={styles.paidBadge}>PAID</span>
      <span className={styles.counter}>{h > 0 ? `${String(h).padStart(2, "0")}:` : ""}{mins}:{secs}</span>
    </div>
  );
};

export default AISessionStatus;
