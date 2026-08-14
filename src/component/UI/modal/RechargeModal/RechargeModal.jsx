import { useState } from "react";
import { PrimaryText } from "../../../index";
import NewRechargeModal from "../../../recharge-modal/RechargeModal";
import PaymentSuccessModal from "../WelcomeBonusModal/PaymentSuccessModal";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";
import styles from "./RechargeModal.module.scss";

const RechargeModal = ({
  isOpen,
  onClose,
  astrologer,
  connectionType = "chat",
}) => {
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [successAmount, setSuccessAmount] = useState(null);

  

  if (!isOpen && successAmount === null) return null;

  const rate =
    connectionType === "chat"
      ? astrologer?.price?.chatRate?.amount
      : connectionType === "video"
        ? astrologer?.price?.videoCallRate?.amount
        : astrologer?.price?.audioRate?.amount;

  const minBalance = (rate || 1) * 5;
  // userName-first (helper falls back to firstName + lastName).
  const astrologerName = getAstrologerDisplayName(astrologer) || "Astrologer";

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
    setSuccessAmount(paymentData?.amount || "");
  };

  return (
    <>
      {isOpen && (
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
      )}

      {/* New Recharge Modal with Plans */}
      <NewRechargeModal
        isOpen={showPlansModal}
        onClose={handlePlansModalClose}
        onSuccess={handleRechargeSuccess}
        title="Recharge Wallet"
      />

      {/* Payment Success Popup */}
      <PaymentSuccessModal
        isOpen={successAmount !== null}
        onClose={() => {
          setSuccessAmount(null);
          onClose();
        }}
        amount={successAmount}
        redirectTo={null}
      />
    </>
  );
};

export default RechargeModal;
