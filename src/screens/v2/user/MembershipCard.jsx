import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./MembershipCard.module.scss";
import crown from "../../../assets/images/crown.webp";

// Active-subscriber card shows plan/validity/quota + a Manage dropdown (with a
// Cancel Subscription option). Non-subscriber shows an "Unlock Premium" upsell.
const MembershipCard = ({
  hasSubscription = false,
  planName,
  validTill,
  remainingDays,
  quotaUsed,
  quotaTotal,
  details = [],
  onCancel,
  isCancelling = false,
  onSubscribe,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!hasSubscription) {
    return (
      <div className={styles.card}>
        <div className={styles.iconBox} aria-hidden="true">
          <img src={crown} alt="" className={styles.crownImg} />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Membership</span>
          <h3 className={styles.planName}>Unlock Premium</h3>
          <div className={styles.meta}>
            <span>Subscribe to access premium AI features and reports.</span>
          </div>
        </div>
        <button type="button" className={styles.manageBtn} onClick={onSubscribe}>
          Subscribe
        </button>
      </div>
    );
  }

  const total = Number(quotaTotal) || 0;
  const used = Number(quotaUsed) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  const handleCancelClick = () => {
    setMenuOpen(false);
    if (onCancel) onCancel();
  };

  return (
    <div className={styles.card}>
      <div className={styles.iconBox} aria-hidden="true">
        <img src={crown} alt="" className={styles.crownImg} />
      </div>

      <div className={styles.info}>
        <span className={styles.label}>Membership Details</span>
        <h3 className={styles.planName}>{planName || "Premium"}</h3>
        <div className={styles.meta}>
          <span>Valid Till <strong>{validTill || "-"}</strong></span>
          {remainingDays != null && (
            <>
              <span className={styles.metaDivider} aria-hidden="true">|</span>
              <span>Remaining <strong>{remainingDays} {remainingDays === 1 ? "day" : "days"}</strong></span>
            </>
          )}
        </div>
        {total > 0 && (
          <div className={styles.quota}>
            <div className={styles.quotaBar}>
              <div className={styles.quotaFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.quotaText}>{used} of {total} reports used this month</span>
          </div>
        )}
      </div>

      <div className={styles.manageWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.manageBtn}
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          Manage
          <ChevronDown
            size={16}
            className={`${styles.manageChevron} ${menuOpen ? styles.manageChevronOpen : ""}`}
          />
        </button>

        {menuOpen && (
          <div className={styles.manageMenu} role="menu">
            {details.length > 0 && (
              <div className={styles.manageMenuDetails}>
                {details.map((item, idx) => (
                  <div key={idx} className={styles.manageMenuRow}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className={styles.cancelMenuItem}
              onClick={handleCancelClick}
              disabled={isCancelling}
              role="menuitem"
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipCard;
