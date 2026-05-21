import styles from "./AIRechargeBanner.module.scss";
import { IoWallet } from "react-icons/io5";

const AIRechargeBanner = ({
  walletBalance,
  ratePerMinute,
  minutesUntilPaid,
  minBalanceRequired,
  sessionEnded,
  onRecharge,
  onDismiss,
}) => {
  const required = minBalanceRequired || (ratePerMinute ? ratePerMinute * 5 : 0);

  return (
    <div className={`${styles.banner} ${sessionEnded ? styles.ended : ""}`}>
      <div className={styles.iconWrap}>
        <IoWallet size={18} />
      </div>
      <div className={styles.content}>
        {sessionEnded ? (
          <>
            <p className={styles.title}>Session ended</p>
            <p className={styles.subtitle}>
              Insufficient balance. Recharge ₹{required} to start a new chat.
            </p>
          </>
        ) : (
          <>
            <p className={styles.title}>
              {minutesUntilPaid != null
                ? `Free minutes end in ${minutesUntilPaid} min`
                : "Low balance"}
            </p>
            <p className={styles.subtitle}>
              Recharge ₹{required - (walletBalance || 0)} to continue after free minutes.
              {walletBalance != null && ` Balance: ₹${walletBalance}`}
            </p>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <button className={styles.rechargeBtn} onClick={onRecharge} type="button">
          Recharge
        </button>
        {!sessionEnded && (
          <button className={styles.dismissBtn} onClick={onDismiss} type="button" aria-label="Dismiss">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default AIRechargeBanner;
