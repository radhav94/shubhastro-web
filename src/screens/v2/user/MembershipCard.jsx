import { ChevronDown } from "lucide-react";
import styles from "./MembershipCard.module.scss";
import crown from "../../../assets/images/crown.webp";

// NOTE: values are placeholders — no user-subscription-status API exists yet.
// Wire planName/validTill/remainingDays to that API when available.
const MembershipCard = ({
  planName = "Quarterly Pass",
  validTill = "20 Oct 2026",
  remainingDays = "20 Oct 2026",
  onManage,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconBox} aria-hidden="true">
        <img src={crown} alt="" className={styles.crownImg} />
      </div>

      <div className={styles.info}>
        <span className={styles.label}>Membership Details</span>
        <h3 className={styles.planName}>{planName}</h3>
        <div className={styles.meta}>
          <span>Valid Till <strong>{validTill}</strong></span>
          <span className={styles.metaDivider} aria-hidden="true">|</span>
          <span>Remaining days <strong>{remainingDays}</strong></span>
        </div>
      </div>

      <button type="button" className={styles.manageBtn} onClick={onManage}>
        Manage <ChevronDown size={16} />
      </button>
    </div>
  );
};

export default MembershipCard;
