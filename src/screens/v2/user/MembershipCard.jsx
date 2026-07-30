import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./MembershipCard.module.scss";
import crown from "../../../assets/images/crown.webp";

// Active-subscriber card shows plan/validity/quota + a Manage dropdown (with a
// Cancel Subscription option). Non-subscriber shows an "Unlock Premium" upsell.
const MembershipCard = ({
  hasSubscription = false,
  autoRenew = false,
  planName,
  validTill,
  remainingDays,
  quotaUsed,
  quotaTotal,
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
  const remaining = Math.max(0, total - used);

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
              <span>Remaining days <strong>{remainingDays}</strong></span>
            </>
          )}
        </div>
        {total > 0 && (
          <div className={styles.quota}>
            <span className={styles.quotaText}>
              <strong>{remaining}</strong> / {total} generations left
            </span>
          </div>
        )}
      </div>

      {/* Once auto-renewal is cancelled there's nothing left to manage, so hide
          the dropdown (its only action is Cancel Subscription). */}
      {autoRenew && (
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
      )}
    </div>
  );
};

export default MembershipCard;
