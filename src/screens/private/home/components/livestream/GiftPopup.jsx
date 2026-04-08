import { useState } from "react";
import "./GiftPopup.scss";
import { useSendGiftMutation } from "../../../../../redux/api/gift/giftApi";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import toast from "../../../../../component/toast";
import { getUserFromStorage } from "../../../../../utils/authStorage";

const GiftPopup = ({ show, onClose, giftList, astrologerId, astrologerName, socketRef, roomId, userId, userName }) => {
  if (!show) return null;
  const [selected, setSelected] = useState(null);
  const [sendGift, { isLoading: isSending }] = useSendGiftMutation();
  const { balance, refreshWallet } = useWalletBalance();
  const user = getUserFromStorage();

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const handleSend = async () => {
    if (!selected) return;

    if (selected.price > balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await sendGift({
        giftId: selected._id,
        astrologerId,
      }).unwrap();

      refreshWallet();
      window.dispatchEvent(new Event("walletBalanceUpdated"));

      // Emit gift message to live stream chat
      if (socketRef?.current?.connected && roomId && userId) {
        let senderName = userName;
        if (!senderName) {
          if (user?.firstName && user?.lastName && user.firstName.toLowerCase() !== user.lastName.toLowerCase()) {
            senderName = `${user.firstName} ${user.lastName}`;
          } else {
            senderName = user?.firstName || user?.phoneNumber || "User";
          }
        }

        const giftMessage = JSON.stringify({
          text: `${senderName} sent a ${selected.giftName}`,
          giftData: {
            giftName: selected.giftName,
            giftImg: selected.giftImg,
            price: selected.price,
          },
        });

        socketRef.current.emit("live:send_message", {
          roomId,
          userId,
          userName: senderName,
          message: giftMessage,
          userType: "audience",
          type: "gift",
        });
      }

      toast.success("Gift sent successfully");
      handleClose();
    } catch (error) {
      console.error("Error sending gift:", error);
      toast.error("Failed to send gift");
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
          {giftList?.map((gift) => (
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
          disabled={!selected || isSending}
          onClick={handleSend}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default GiftPopup;
