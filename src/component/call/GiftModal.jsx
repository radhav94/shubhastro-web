import { useState } from "react";
import styles from "./GiftModal.module.scss";
import {
  useGetAllGiftsQuery,
  useSendGiftMutation,
} from "../../redux/api/gift/giftApi";
import toast from "../toast";
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";
import { IoChevronForward } from "react-icons/io5";
import RechargeModal from "../recharge-modal/RechargeModal";
import WalletIcon from "../../assets/icons/wallet-2.svg";
import AstrologerShopImage from "../../assets/images/astrologer-shop.png";
import { getUserFromStorage } from "../../utils/authStorage";
import socketService from "../../services/socketService";

// Fallback dummy data
const DUMMY_GIFTS = [
  { _id: "1", giftName: "Flower", price: 50, giftImg: "https://via.placeholder.com/150/FFB6C1", category: "popular", isPopular: true },
  { _id: "2", giftName: "Thali", price: 150, giftImg: "https://via.placeholder.com/150/FFA500", category: "popular", isPopular: true },
  { _id: "3", giftName: "Heart", price: 50, giftImg: "https://via.placeholder.com/150/FF69B4", category: "popular", isPopular: true },
  { _id: "4", giftName: "Chocolate", price: 50, giftImg: "https://via.placeholder.com/150/8B4513", category: "popular", isPopular: true },
  { _id: "5", giftName: "Sweets", price: 50, giftImg: "https://via.placeholder.com/150/FFA07A", category: "other" },
  { _id: "6", giftName: "Shivling", price: 50, giftImg: "https://via.placeholder.com/150/D2691E", category: "other" },
  { _id: "7", giftName: "Dakshina", price: 50, giftImg: "https://via.placeholder.com/150/98FB98", category: "other" },
  { _id: "8", giftName: "Ganesha", price: 50, giftImg: "https://via.placeholder.com/150/FFD700", category: "other" },
];

const DUMMY_COMBOS = [
  { 
    _id: "c1", 
    giftName: "Chocolate + Heart + Rose", 
    price: 2000, 
    originalPrice: 2800,
    giftImg: AstrologerShopImage,
    category: "combo",
    isCombo: true,
    description: "Perfect romantic combo"
  },
  { 
    _id: "c2", 
    giftName: "Thali + Sweets + Flower", 
    price: 2000, 
    originalPrice: 2800,
    giftImg: AstrologerShopImage,
    category: "combo",
    isCombo: true,
    description: "Traditional blessing combo"
  },
  { 
    _id: "c3", 
    giftName: "Ganesha + Dakshina + Incense", 
    price: 2000, 
    originalPrice: 2800,
    giftImg: AstrologerShopImage,
    category: "combo",
    isCombo: true,
    description: "Spiritual combo"
  },
];

const GiftModal = ({ isOpen, onClose, astrologerId, astrologerName, roomId, userId, socketSendFn }) => {
  const { data, isLoading } = useGetAllGiftsQuery();
  const [sendGift, { isLoading: isSending }] = useSendGiftMutation();
  const [selected, setSelected] = useState(null);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const { balance, refreshWallet } = useWalletBalance();
  
  const user = getUserFromStorage();

  // Use API data if available, otherwise use dummy data
  const gifts = data?.data && data.data.length > 0 ? data.data : DUMMY_GIFTS;

  // Categorize gifts
  const popularGifts = gifts.filter(g => g.category === "popular" || g.isPopular);
  const otherGifts = gifts.filter(g => g.category === "other" || (!g.isPopular && !g.isCombo && g.category !== "popular"));
  const combos = gifts.filter(g => g.category === "combo" || g.isCombo);
  
  // If no combos from API, use dummy combos
  const displayCombos = combos.length > 0 ? combos : DUMMY_COMBOS;

  const handleSend = async () => {
    if (!selected || !astrologerId) return;

    if (selected.price > balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      const response = await sendGift({
        giftId: selected._id,
        astrologerId: astrologerId,
      }).unwrap();
      
      setSelected(null);
      refreshWallet();
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("walletBalanceUpdated"));
      
      // Send gift message to chat if roomId and userId are available
      if (roomId && userId) {
        // Construct user name properly
        let userName;
        if (user?.firstName && user?.lastName) {
          // Check if first name and last name are the same (case-insensitive)
          if (user.firstName.toLowerCase() === user.lastName.toLowerCase()) {
            userName = user.firstName; // Show only first name if they're the same
          } else {
            userName = `${user.firstName} ${user.lastName}`; // Show full name
          }
        } else {
          userName = user?.firstName || user?.phoneNumber || "User";
        }
        
        const astrologerDisplayName = astrologerName || "Astrologer";
        
        // Create gift data object
        const giftDataToSend = {
          giftName: selected.giftName,
          giftImg: selected.giftImg,
          price: selected.price,
        };
        
        // Create gift message with JSON data
        const giftMessage = JSON.stringify({
          text: `${userName} has sent a gift to ${astrologerDisplayName}`,
          giftData: giftDataToSend
        });
      
        // Send the gift message through socket with type "gift"
        // Use custom socketSendFn if provided (for voice/video calls using voiceSocket),
        // otherwise fall back to socketService (for regular chat)
        let sendResult;
        if (socketSendFn) {
          sendResult = socketSendFn(giftMessage, "gift");
        } else {
          sendResult = socketService.sendMessage({
            roomId,
            userId,
            astrologerId,
            message: giftMessage,
            type: "gift",
            kundliId: null
          });
        }

        // Check if there was an error sending the message
        if (sendResult?.error) {
          toast.error(sendResult.error);
          return;
        }
      }
      
      toast.success("Gift sent successfully");
      onClose();
    } catch (error) {
      console.error("Error sending gift:", error);
      toast.error("Failed to send gift");
    }
  };

  const [giftHidden, setGiftHidden] = useState(false);

  const handleAddMoney = () => {
    setGiftHidden(true);
    setIsRechargeModalOpen(true);
  };

  const handleRechargeClose = () => {
    setIsRechargeModalOpen(false);
    setGiftHidden(false);
  };

  const handleRechargeSuccess = () => {
    setIsRechargeModalOpen(false);
    setGiftHidden(false);
    refreshWallet();
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("walletBalanceUpdated"));
  };

  if (!isOpen) return null;

  return (
    <>
      {!giftHidden && (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Handle */}
          <div className={styles.modalHandle}></div>

          {/* Close Button */}
          <button 
            className={`${styles.closeBtn} notranslate`} 
            onClick={onClose}
            aria-label="Close"
            translate="no"
          >
            ×
          </button>

          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Send a Gift</h2>
            <div className={styles.balanceInfo}>
              <div className={styles.balanceAmount}>₹{balance}</div>
              <div className={styles.balanceLabel}>
                <img src={WalletIcon} alt="Wallet" className={styles.balanceIcon} />
                <span>Balance</span>
              </div>
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
                      {popularGifts.map((gift) => (
                        <div
                          key={gift._id}
                          className={`${styles.giftItem} ${
                            selected?._id === gift._id ? styles.selected : ""
                          }`}
                          onClick={() => setSelected(gift)}
                        >
                          <div className={styles.giftImageWrapper}>
                            <img src={gift.giftImg} alt={gift.giftName} className={styles.giftImage} />
                            <div className={styles.giftPrice}>₹{gift.price}</div>
                          </div>
                          <p className={styles.giftName}>{gift.giftName}</p>
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
                      {otherGifts.map((gift) => (
                        <div
                          key={gift._id}
                          className={`${styles.giftItem} ${
                            selected?._id === gift._id ? styles.selected : ""
                          }`}
                          onClick={() => setSelected(gift)}
                        >
                          <div className={styles.giftImageWrapper}>
                            <img src={gift.giftImg} alt={gift.giftName} className={styles.giftImage} />
                            <div className={styles.giftPrice}>₹{gift.price}</div>
                          </div>
                          <p className={styles.giftName}>{gift.giftName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Combos */}
                {displayCombos.length > 0 && (
                  <div className={styles.giftSection}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>Popular Combos</h3>
                      <IoChevronForward size={20} color="#999" />
                    </div>
                    <div className={styles.comboScroll}>
                      {displayCombos.map((combo) => (
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
                            <p className={styles.comboName}>Popular Gift</p>
                            <p className={styles.comboDesc}>{combo.giftName}</p>
                            <div className={styles.comboPrice}>
                              <span className={styles.currentPrice}>₹{combo.price}</span>
                              {combo.originalPrice && (
                                <span className={styles.originalPrice}>₹{combo.originalPrice}</span>
                              )}
                            </div>
                          </div>
                          <button className={styles.comboAddBtn}>+ Add to cart</button>
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
              onClick={handleAddMoney}
            >
              + Add Money
            </button>
            <button
              className={styles.sendBtn}
              disabled={!selected || isSending}
              onClick={handleSend}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={handleRechargeClose}
        onSuccess={handleRechargeSuccess}
        title="Recharge Wallet"
      />
    </>
  );
};

export default GiftModal;
