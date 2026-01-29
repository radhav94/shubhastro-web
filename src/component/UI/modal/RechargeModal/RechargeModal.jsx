import { useNavigate } from "react-router-dom";
import { PrimaryText } from "../../../index";
import { PATH } from "../../../../utils/routes/Paths";
import styles from "./RechargeModal.module.scss";

const RechargeModal = ({
  isOpen,
  onClose,
  astrologer,
  connectionType = "chat",
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const rate =
    connectionType === "chat"
      ? astrologer?.price?.chatRate?.amount
      : astrologer?.price?.callRate?.amount || 1;

  const minBalance = rate * 5;
  const astrologerName = astrologer?.firstName || "Astrologer";

  const handleRecharge = () => {
    onClose();
    navigate(PATH.privateRoutes.RECHARGE.path);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <PrimaryText isCenter className="pt-4">
          Minimum balance of 5 minutes (₹ {minBalance}) is required to start{" "}
          {connectionType} with {astrologerName}.
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button className={styles.rejectBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.acceptBtn} onClick={handleRecharge}>
            Recharge
          </button>
        </div>
      </div>
    </div>
  );
};

export default RechargeModal;
