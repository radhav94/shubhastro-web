import { memo } from "react";
import styles from "./LowBalanceModal.module.scss";
import WalletIcon from "../../../../assets/icons/Wallet.svg";

const LowBalanceModal = ({ isOpen, onClose, onRecharge, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Low balance warning">
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#F75801" strokeWidth="1.5" />
            <path d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5" stroke="#F75801" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className={styles.iconWrap}>
          <img src={WalletIcon} alt="Wallet" width="56" height="56" />
        </div>

        <p className={styles.message}>{message || "Balance < 5 minutes"}</p>

        <button className={styles.rechargeBtn} onClick={onRecharge}>
          Recharge Now
        </button>
      </div>
    </div>
  );
};

export default memo(LowBalanceModal);
