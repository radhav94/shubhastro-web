import { useState } from "react";
import "./GiftPopup.scss";
import { useSendGiftMutation } from "../../../../../redux/api/gift/giftApi";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import toast from "../../../../../component/toast";
import { getUserFromStorage } from "../../../../../utils/authStorage";
import walletIcon from "../../../../../assets/icons/wallet-2.svg";

const GiftPopup = ({ show, onClose, giftList, astrologerId, socketRef, roomId, userId, userName }) => {
  /*
   * `if (!show) return null` used to sit ABOVE these hooks, which made opening
   * this popup a hard React crash rather than a subtle bug.
   *
   * LiveView mounts <GiftPopup show={showGifts} /> unconditionally and toggles
   * the prop, so the same component instance rendered zero hooks while closed
   * and three the moment the gift button was tapped. React compares the hook
   * list against the previous render on update and throws "Rendered more hooks
   * than during the previous render." — so the tap that opened the gift panel
   * blew up the render instead of showing anything. ESLint had been flagging all
   * three as conditional hooks.
   *
   * Hooks first, early return after.
   */
  const [selected, setSelected] = useState(null);
  const [sendGift, { isLoading: isSending }] = useSendGiftMutation();
  const { balance, refreshWallet } = useWalletBalance();
  const user = getUserFromStorage();

  if (!show) return null;

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const handleSend = async () => {
    /*
     * Doubly silent before: the button carried
     * `disabled={!selected || isSending}` so the browser swallowed the tap, and
     * this function repeated the check with a bare return. Opening the panel and
     * pressing Send — the obvious thing to do — produced nothing at all and gave
     * no hint that a gift had to be picked first.
     */
    if (isSending) {
      toast.error("Your gift is on its way — one moment.");
      return;
    }

    if (!selected) {
      toast.error("Pick a gift first, then tap Send.");
      return;
    }

    if (selected.price > balance) {
      toast.error(`Insufficient balance. ${selected.giftName} costs ₹${selected.price} and your wallet has ₹${balance ?? 0}.`);
      return;
    }

    try {
      await sendGift({
        giftId: selected._id,
        astrologerId,
      }).unwrap();

      refreshWallet();
      window.dispatchEvent(new Event("walletBalanceUpdated"));

      if (socketRef?.current?.connected && roomId && userId) {
        let senderName = userName;
        if (!senderName) {
          if (user?.firstName && user?.lastName && user.firstName.toLowerCase() !== user.lastName.toLowerCase()) {
            senderName = `${user.firstName} ${user.lastName}`;
          } else {
            senderName = user?.firstName || "User";
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
    <div className="gift-overlay" onClick={onClose} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
      <div className="gift-popup" onClick={(e) => e.stopPropagation()}>
        <div className="gift-header">
          <div className="gift-title">Send a Gift</div>
          <div className="gift-header-right">
            <div className="gift-wallet">
              <span className="gift-wallet-amount">₹{balance ?? 0}</span>
              <div className="gift-wallet-label">
                <img src={walletIcon} alt="wallet" width="16" height="16" />
                <span>Wallet</span>
              </div>
            </div>
            <button className="gift-close-btn" onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="gift-grid">
          {/* Real buttons, not click-handled divs: these are the primary choice
              control in the panel, so they need keyboard access and an
              announced pressed state. aria-pressed carries the same meaning as
              the existing `.active` class. */}
          {giftList?.map((gift) => (
            <button
              key={gift._id}
              type="button"
              className={`gift-item ${selected?._id === gift._id ? "active" : ""}`}
              onClick={() => setSelected(gift)}
              aria-pressed={selected?._id === gift._id}
            >
              <div className="gift-img-wrap">
                <img src={gift.giftImg} alt="" width="72" height="72" loading="lazy" />
                <span className="gift-price-badge">₹{gift.price}</span>
              </div>
              <div className="gift-name">{gift.giftName}</div>
            </button>
          ))}
        </div>

        {/* aria-disabled, not `disabled` — the dimmed look is kept but the tap
            still reaches handleSend so it can say what is missing. */}
        <button
          type="button"
          className="gift-send-btn"
          aria-disabled={!selected || isSending}
          aria-busy={isSending}
          onClick={handleSend}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default GiftPopup;
