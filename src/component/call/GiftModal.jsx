import { useState, useEffect } from "react";
import styles from "./GiftModal.module.scss";
import {
  useGetAllGiftsQuery,
  useSendGiftMutation,
} from "../../redux/api/gift/giftApi";
import toast from "../toast";
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";
import { useNavigate } from "react-router-dom";

const GiftModal = ({ isOpen, onClose, astrologerId, astrologerName }) => {
  const { data, isLoading } = useGetAllGiftsQuery();
  const [sendGift, { isLoading: isSending }] = useSendGiftMutation();
  const [selected, setSelected] = useState(null);
  const [disableSend, setDisableSend] = useState(false);
  const { balance, refreshWallet } = useWalletBalance();
  const navigate = useNavigate();

  const gifts = data?.data || [];

  // Categorize gifts
  const popularGifts = gifts.filter(g => g.category === "popular" || g.isPopular);
  const otherGifts = gifts.filter(g => g.category !== "popular" && !g.isPopular);
  const combos = gifts.filter(g => g.category === "combo" || g.isCombo);

  const handleSend = async () => {
    if (!selected || !astrologerId) return;

    try {
      await sendGift({
        giftId: selected._id,
        astrologerId: astrologerId,
      }).unwrap();
      
      setSelected(null);
      refreshWallet();
      toast.success("Gift sent successfully");
      onClose();
    } catch (error) {
      console.error("Error sending gift:", error);
      toast.error("Failed to send gift");
    }
  };

  const handleRecharge = () => {
    onClose();
    navigate("/recharge");
  };

  useEffect(() => {
    if (selected && selected.price > balance) {
      setDisableSend(true);
    } else {
      setDisableSend(false);
    }
  }, [selected, balance]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div className={styles.modalHandle}></div>

        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Send a Gift</h2>
          <div className={styles.balanceBadge}>
            <span className={styles.balanceIcon}>💰</span>
            <span className={styles.balanceText}>Balance</span>
            <span className={styles.balanceAmount}>₹{balance}</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loading}>Loading gifts...</div>
          ) : (
            <>
              {/* Popular Gifts */}
              {popularGifts.length > 0 && (
                <div className={styles.giftSection}>
                  <h3 className={styles.sectionTitle}>Popular Gifts</h3>
                  <div className={styles.giftGrid}>
                    {popularGifts.slice(0, 4).map((gift) => (
                      <div
                        key={gift._id}
                        className={`${styles.giftItem} ${
                          selected?._id === gift._id ? styles.selected : ""
                        }`}
                        onClick={() => setSelected(gift)}
                      >
                        <img src={gift.giftImg} alt={gift.giftName} className={styles.giftImage} />
                        <p className={styles.giftName}>{gift.giftName}</p>
                        <p className={styles.giftPrice}>₹{gift.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Gifts */}
              {otherGifts.length > 0 && (
                <div className={styles.giftSection}>
                  <h3 className={styles.sectionTitle}>Other Gifts</h3>
                  <div className={styles.giftGrid}>
                    {otherGifts.slice(0, 4).map((gift) => (
                      <div
                        key={gift._id}
                        className={`${styles.giftItem} ${
                          selected?._id === gift._id ? styles.selected : ""
                        }`}
                        onClick={() => setSelected(gift)}
                      >
                        <img src={gift.giftImg} alt={gift.giftName} className={styles.giftImage} />
                        <p className={styles.giftName}>{gift.giftName}</p>
                        <p className={styles.giftPrice}>₹{gift.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Combos */}
              {combos.length > 0 && (
                <div className={styles.giftSection}>
                  <h3 className={styles.sectionTitle}>Popular Combos</h3>
                  <div className={styles.comboGrid}>
                    {combos.slice(0, 3).map((combo) => (
                      <div
                        key={combo._id}
                        className={`${styles.comboItem} ${
                          selected?._id === combo._id ? styles.selected : ""
                        }`}
                        onClick={() => setSelected(combo)}
                      >
                        <div className={styles.comboTag}>
                          <span>⭐</span> Most Popular
                        </div>
                        <img src={combo.giftImg} alt={combo.giftName} className={styles.comboImage} />
                        <div className={styles.comboInfo}>
                          <p className={styles.comboName}>{combo.giftName}</p>
                          <p className={styles.comboDesc}>{combo.description || "Special combo gift"}</p>
                          <div className={styles.comboPrice}>
                            <span className={styles.currentPrice}>₹{combo.price}</span>
                            {combo.originalPrice && (
                              <span className={styles.originalPrice}>₹{combo.originalPrice}</span>
                            )}
                          </div>
                        </div>
                        <button className={styles.comboAddBtn}>+</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show all gifts if no categories */}
              {popularGifts.length === 0 && otherGifts.length === 0 && combos.length === 0 && gifts.length > 0 && (
                <div className={styles.giftSection}>
                  <h3 className={styles.sectionTitle}>All Gifts</h3>
                  <div className={styles.giftGrid}>
                    {gifts.slice(0, 8).map((gift) => (
                      <div
                        key={gift._id}
                        className={`${styles.giftItem} ${
                          selected?._id === gift._id ? styles.selected : ""
                        }`}
                        onClick={() => setSelected(gift)}
                      >
                        <img src={gift.giftImg} alt={gift.giftName} className={styles.giftImage} />
                        <p className={styles.giftName}>{gift.giftName}</p>
                        <p className={styles.giftPrice}>₹{gift.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.addMoneyBtn}
            onClick={handleRecharge}
          >
            + Add Money
          </button>
          <button
            className={styles.sendBtn}
            disabled={!selected || disableSend || isSending}
            onClick={handleSend}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftModal;
