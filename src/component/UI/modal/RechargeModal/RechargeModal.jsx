import { useState } from "react";
import { PrimaryText } from "../../../index";
import NewRechargeModal from "../../../recharge-modal/RechargeModal";
import styles from "./RechargeModal.module.scss";

const RechargeModal = ({
  isOpen,
  onClose,
  astrologer,
  connectionType = "chat",
}) => {
  const [showPlansModal, setShowPlansModal] = useState(false);

  if (!isOpen) return null;

  const rate =
    connectionType === "chat"
      ? astrologer?.price?.chatRate?.amount
      : astrologer?.price?.callRate?.amount || 1;

  const minBalance = rate * 5;
  const astrologerName = astrologer?.firstName || "Astrologer";

  const handleRecharge = () => {
    setShowPlansModal(true);
  };

  const handlePlansModalClose = () => {
    setShowPlansModal(false);
    onClose();
  };

  const handleRechargeSuccess = (paymentData) => {
    console.log('Recharge successful:', paymentData);
    setShowPlansModal(false);
    onClose();
  };

  return (
    <>
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

      {/* New Recharge Modal with Plans */}
      <NewRechargeModal
        isOpen={showPlansModal}
        onClose={handlePlansModalClose}
        onSuccess={handleRechargeSuccess}
        title="Recharge Wallet"
      />
    </>
  );
};

export default RechargeModal;
