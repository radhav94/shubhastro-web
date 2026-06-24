import { memo } from "react";
import { createPortal } from "react-dom";
import { IoWallet } from "react-icons/io5";
import styles from "./InsufficientBalanceModal.module.scss";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0.0";
  return num.toFixed(1);
};

/**
 * Insufficient Balance popup — shown when preSessionBalanceCheck returns
 * data.status === false (user does not have enough balance to start a session).
 *
 * @param {boolean}  isOpen
 * @param {Function} onClose      - called on backdrop click / CANCEL
 * @param {Function} onRecharge   - called on RECHARGE NOW
 * @param {number}   availableAmount
 * @param {number}   requiredAmount
 * @param {number}   pricePerMinute
 */
const InsufficientBalanceModal = ({
  isOpen,
  onClose,
  onRecharge,
  availableAmount,
  requiredAmount,
  pricePerMinute,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Insufficient balance"
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <IoWallet size={56} color="#F75801" />
        </div>

        <h2 className={styles.title}>Insufficient Balance</h2>
        <p className={styles.message}>
          You don't have enough balance to start this session. Please recharge
          your wallet to continue.
        </p>

        <div className={styles.detailsCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Available Balance:</span>
            <span className={styles.detailValueHighlight}>
              ₹{formatAmount(availableAmount)}
            </span>
          </div>
          <div className={styles.divider} />

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Required Balance:</span>
            <span className={styles.detailValueHighlight}>
              ₹{formatAmount(requiredAmount)}
            </span>
          </div>
          <div className={styles.divider} />

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Price Per Minute:</span>
            <span className={styles.detailValue}>
              ₹{Math.round(Number(pricePerMinute) || 0)}/min
            </span>
          </div>
        </div>

        <button className={styles.rechargeBtn} onClick={onRecharge}>
          RECHARGE NOW
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          CANCEL
        </button>
      </div>
    </div>,
    document.body
  );
};

export default memo(InsufficientBalanceModal);
