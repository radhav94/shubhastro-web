import Modal from "../Modal";
import { PrimaryButton, PrimaryText } from "../../../../component";

import { IoMdClose } from "react-icons/io";

import { getWidth } from "../../../../utils/theme";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

// Fallback minimum when the balance check hasn't supplied a `requiredAmount` —
// the historic business rule was "5 minutes' worth".
const DEFAULT_MIN_MINUTES = 5;

const RechargeAlertModel = ({
  isOpen,
  onClose,
  handleSubmit,
  astrologer = "Astrologer",
  // From the balance-check API: exact rupees needed and the per-minute rate.
  requiredAmount = null,
  pricePerMinute = null,
}) => {
  const modalWidth = `${getWidth() * 0.44}px`;

  // Per-minute rate: the balance API value, else the astrologer's chat rate.
  const perMinute =
    Number(pricePerMinute) > 0
      ? Number(pricePerMinute)
      : Number(astrologer?.price?.chatRate?.amount) || 1;

  // Required rupees and the minutes it buys, both dynamic (was hardcoded 5 / 135).
  const minBalance =
    Number(requiredAmount) > 0 ? Number(requiredAmount) : perMinute * DEFAULT_MIN_MINUTES;
  const minMinutes =
    perMinute > 0 ? Math.max(1, Math.floor(minBalance / perMinute)) : DEFAULT_MIN_MINUTES;

  return (
    <Modal modalOpen={isOpen} width={modalWidth}>
      <div className=" p-4">
        <div className="flex justify-end">
          <IoMdClose
            size={22}
            onClick={() => onClose(false)}
            className="cursor-pointer"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          {/* <PrimaryText isExtraBold size_20 isCenter>
            Insufficient wallet balance
          </PrimaryText> */}
          <PrimaryText isCenter className=" pt-4">
            Minimum balance of {minMinutes} {minMinutes === 1 ? "minute" : "minutes"} (₹ {minBalance}) is required to start chat with
            {` ${getAstrologerDisplayName(astrologer) || "Astrologer"}`}.
          </PrimaryText>
          <PrimaryButton
            className=" mt-2"
            title="Reacharge NOW!"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RechargeAlertModel;
