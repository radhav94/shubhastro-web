import React from "react";
import "./GiftPopup.scss";

const GiftPopup = ({
  show,
  onClose,
  giftList,
  coins,
  selectedGift,
  setSelectedGift,
  onSend
}) => {

  if (!show) return null;

  return (
    <div className="gift-overlay" onClick={onClose}>
      <div className="gift-popup" onClick={(e) => e.stopPropagation()}>
        
        <div className="gift-header">
          <div className="gift-title">Send a gift 🎁</div>
          <div className="gift-coins">₹ {coins}</div>
        </div>

        <div className="gift-grid">
          {giftList.map((gift) => (
            <div
              key={gift.id}
              className={`gift-item ${selectedGift?.id === gift.id ? "active" : ""}`}
              onClick={() => setSelectedGift(gift)}
            >
              <img src={gift.icon} alt="" />
              <div className="gift-name">{gift.name}</div>
              <div className="gift-price">₹ {gift.price}</div>
            </div>
          ))}
        </div>

        <button
          className="gift-send-btn"
          disabled={!selectedGift}
          onClick={onSend}
        >
          Send
        </button>

      </div>
    </div>
  );
};

export default GiftPopup;
