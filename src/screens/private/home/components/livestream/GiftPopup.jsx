import { useState } from "react";
import "./GiftPopup.scss";
import { useSendGiftMutation } from "../../../../../redux/api/gift/giftApi";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import toast from "../../../../../component/toast";

const GiftPopup = ({ show, onClose, giftList }) => {
  if (!show) return null;
  const [selected, setSelected] = useState(null);
  const [sendGift, { isLoading: isSending }] = useSendGiftMutation();
  const { balance, refreshWallet } = useWalletBalance();
  const handleClose = () => {
    setSelected(null); // reset state
    onClose(); // close popup from parent
  };

  const handleSend = async () => {
    if (!selected) return;

    try {
      await sendGift({
        giftId: selected._id,
        astrologerId: "69257999580767eaf53c0895",
      }).unwrap();

      refreshWallet();
      toast.success("Gift sent successfully");

      handleClose(); //  close popup after success
    } catch (error) {
      console.error("Error sending gift:", error);
    }
  };

  return (
    <div className="gift-overlay" onClick={onClose}>
      <div className="gift-popup" onClick={(e) => e.stopPropagation()}>
        <div className="gift-header">
          <div className="gift-title">Send a gift 🎁</div>
          <div className="gift-coins">₹ {balance}</div>
        </div>

        <div className="gift-grid">
          {giftList.map((gift) => (
            <div
              key={gift._id}
              className={`gift-item ${
                selected?._id === gift._id ? "active" : ""
              }`}
              onClick={() => setSelected(gift)}
            >
              <img src={gift.giftImg} alt="" />
              <div className="gift-name">{gift.giftName}</div>
              <div className="gift-price">₹ {gift.price}</div>
            </div>
          ))}
        </div>

        <button
          className="gift-send-btn"
          disabled={!selected}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GiftPopup;
