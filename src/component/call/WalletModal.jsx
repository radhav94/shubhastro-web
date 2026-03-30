import { useState } from "react";
import styles from "./WalletModal.module.scss";
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";
import { useNavigate } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";
import WalletIcon from "../../assets/icons/wallet-2.svg";
import WalletComboImage from "../../assets/images/wallet-popular-combo.png";

const WalletModal = ({ isOpen, onClose }) => {
  const { balance } = useWalletBalance();
  const navigate = useNavigate();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);

  const rechargeAmounts = [
    { amount: 50, extra: "15% Extra" },
    { amount: 100, extra: "15% Extra" },
    { amount: 200, extra: "15% Extra" },
    { amount: 250, extra: "15% Extra" },
    { amount: 50, extra: "15% Extra" },
    { amount: 50, extra: "15% Extra" },
    { amount: 50, extra: "15% Extra" },
    { amount: 50, extra: "15% Extra" },
  ];

  const coupons = [
    {
      id: 1,
      badge: "Exclusive",
      title: "Expires on 20/12/2025",
      description: "Claim 100% Extra on First Recharge",
      image: WalletComboImage
    },
    {
      id: 2,
      badge: "Exclusive",
      title: "Expires on 20/12/2025",
      description: "Claim 100% Extra on First Recharge",
      image: WalletComboImage
    }
  ];

  const handleRecharge = (amount, index) => {
    setSelectedAmount(index);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleAddMoney = () => {
    const amount = customAmount || (selectedAmount !== null ? rechargeAmounts[selectedAmount].amount : null);
    if (amount && amount > 0) {
      onClose();
      navigate(`/recharge?amount=${amount}`);
    }
  };

  if (!isOpen) return null;

  return (
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
          <h2 className={styles.modalTitle}>Wallet</h2>
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
          {/* Popular Recharges */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Popular Recharges</h3>
            <div className={styles.rechargeGrid}>
              {rechargeAmounts.map((item, index) => (
                <div
                  key={index}
                  className={`${styles.rechargeItem} ${selectedAmount === index ? styles.selected : ''}`}
                  onClick={() => handleRecharge(item.amount, index)}
                >
                  <div className={styles.rechargeAmount}>₹{item.amount}</div>
                  <div className={styles.rechargeExtra}>{item.extra}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Coupons */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Available Coupons</h3>
              <IoChevronForward size={20} color="#999" />
            </div>
            <div className={styles.couponsScroll}>
              {coupons.map((coupon) => (
                <div key={coupon.id} className={styles.couponItem}>
                  <div className={styles.couponBadge}>
                    ⭐ Exclusive
                  </div>
                  <img src={coupon.image} alt="Coupon" className={styles.couponImage} />
                  <div className={styles.couponContent}>
                    <p className={styles.couponTitle}>{coupon.title}</p>
                    <p className={styles.couponDesc}>{coupon.description}</p>
                  </div>
                  <button className={styles.claimBtn}>
                    Claim Now <IoChevronForward size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className={styles.inputContainer}>
            <input
              type="number"
              placeholder="₹100"
              className={styles.amountInput}
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
            />
            <button className={styles.addMoneyBtn} onClick={handleAddMoney}>
              Add Money +
            </button>
          </div>

          {/* Note */}
          <p className={styles.note}>
            Your Money never expires. Use them anytime to connect with expert Astrologers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
