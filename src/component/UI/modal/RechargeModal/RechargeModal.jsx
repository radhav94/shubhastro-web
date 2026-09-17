import { useState } from "react";
import { PrimaryText } from "../../../index";
import NewRechargeModal from "../../../recharge-modal/RechargeModal";
import PaymentSuccessModal from "../WelcomeBonusModal/PaymentSuccessModal";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";
import styles from "./RechargeModal.module.scss";

// Fallback minimum when the backend balance check hasn't supplied a
// `requiredAmount` — the historic business rule was "5 minutes' worth".
const DEFAULT_MIN_MINUTES = 5;

const RechargeModal = ({
  isOpen,
  onClose,
  astrologer,
  connectionType = "chat",
  // From the balance-check API (getBalance): the exact rupees the user must have
  // to start, and the astrologer's per-minute rate for this session type. When
  // provided, both the amount and the minutes shown are derived from these
  // instead of the hardcoded "5 minutes (₹ rate*5)".
  requiredAmount = null,
  pricePerMinute = null,
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

  // Per-minute rate: prefer the value the balance API returned, else the
  // astrologer's rate for this connection type.
  const perMinute = Number(pricePerMinute) > 0 ? Number(pricePerMinute) : (rate || 1);

  // Required rupees to start: the API's `requiredAmount` when known, otherwise
  // the historic "5 minutes' worth" fallback.
  const minBalance =
    Number(requiredAmount) > 0 ? Number(requiredAmount) : perMinute * DEFAULT_MIN_MINUTES;

  // Minutes that `minBalance` buys at this rate, so the copy stays consistent
  // with the amount (e.g. ₹150 at ₹30/min reads "5 minutes"). Rounded down since
  // it's a minimum the balance guarantees.
  const minMinutes =
    perMinute > 0 ? Math.max(1, Math.floor(minBalance / perMinute)) : DEFAULT_MIN_MINUTES;
  // userName-first (helper falls back to firstName + lastName).
  const astrologerName = getAstrologerDisplayName(astrologer) || "Astrologer";

  // Readable phrase for the message — "chat", "an audio call", "a video call" —
  // so the copy matches what the user tapped and reads naturally.
  const connectionLabel =
    connectionType === "video"
      ? "a video call"
      : connectionType === "audio"
        ? "an audio call"
        : "chat";

  const handleRecharge = () => {
    setShowPlansModal(true);
  };

  /*
    Step back to the minimum-balance prompt, do not tear the whole flow down.

    This used to call onClose() as well, which unmounts this component entirely —
    so dismissing the plans sheet did not return the user one step, it returned
    them to the astrologer screen. To see the prompt again they had to re-trigger
    the whole connect attempt.

    Dismissing that sheet by accident is easy on a phone: rechargeModal.module
    .scss makes it a bottom sheet at <=640px (`.modalOverlay { padding: 0;
    align-items: flex-end }`) whose content is roughly header + a 350px-capped
    body + footer, so a tall viewport leaves a wide band of bare overlay above it,
    and `handleBackdropClick` closes on any tap that lands there.

    Clarity labizw (Sep 9, FacebookApp WebView, mobile, 79 clicks) initiated a
    recharge at 07:46 and then initiated it again at 07:58 — twelve seconds is a
    person redoing the attempt, not a re-render. Cancel on the prompt below still
    exits, and the prompt's own backdrop still closes, so this cannot trap anyone;
    it just makes a mis-tap cost one tap instead of the entire funnel.

    The prompt is already mounted behind the sheet today (it renders whenever
    `isOpen`), so this only stops it being destroyed.
  */
  const handlePlansModalClose = () => {
    setShowPlansModal(false);
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
            Minimum balance of {minMinutes} {minMinutes === 1 ? "minute" : "minutes"} (₹ {minBalance}) is required to start{" "}
            {connectionLabel} with {astrologerName}.
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
