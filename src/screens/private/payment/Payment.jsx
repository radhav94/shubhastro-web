import React, { useState, useEffect } from "react";
import styles from "./Payment.module.scss";
import { Toast } from "../../../component";
import { Link } from "react-router-dom";

// Reusable Recharge Pack Component
const RechargePack = ({ amount, extra, active, onSelect }) => (
  <div
    className={styles.rechargeAmountWrapper}
    onClick={() => onSelect({ amount, extra })}
  >
    <div className={`${styles.rechargeAmount} ${active ? styles.active : ""}`}>
      ₹ {amount}
      <span>Get ₹ {extra} extra</span>
    </div>
  </div>
);

// Reusable Bill Row Component
const BillRow = ({ label, value, isGreen }) => (
  <tr>
    <td>
      {isGreen ? <span className={styles.greenSpan}>{label}</span> : label}
    </td>
    <td>
      {isGreen ? <span className={styles.greenSpan}>{value}</span> : value}
    </td>
  </tr>
);

const Payment = () => {
  const [selectedPack, setSelectedPack] = useState({ amount: 500, extra: 150 });
  const [walletBalance, setWalletBalance] = useState(0);

  const rechargePacks = [
    { amount: 25, extra: 25 },
    { amount: 49, extra: 30 },
    { amount: 99, extra: 49 },
    { amount: 200, extra: 80 },
    { amount: 500, extra: 150 },
    { amount: 1000, extra: 100 },
    { amount: 2000, extra: 300 },
    { amount: 5000, extra: 600 },
    { amount: 10000, extra: 1500 },
    { amount: 20000, extra: 4000 },
    { amount: 50000, extra: 10000 },
    { amount: 100000, extra: 20000 },
  ];

  // Load wallet balance from localStorage on mount
  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  const gst = (selectedPack.amount * 0.18).toFixed(2);
  const totalToPay = (selectedPack.amount + parseFloat(gst)).toFixed(2);

  const billSummary = [
    { label: "Talk time", value: `₹ ${selectedPack.amount}.00` },
    { label: "Recharge Amount", value: `₹ ${selectedPack.amount}.00` },
    { label: "Cashback", value: `₹ ${selectedPack.extra}.00`, isGreen: true },
    { label: "GST charges(18%)", value: `₹ ${gst}` },
  ];

  const onPay = () => {
    const newBalance = Number(walletBalance) + Number(selectedPack.amount);
    localStorage.setItem("wallet", JSON.stringify({ amount: newBalance }));
    setWalletBalance(newBalance);
    Toast.success("Your wallet has been topped up successfully!");
  };

  return (
    <div className={styles.rechargeTop}>
      {/* Left side */}
      <div className={styles.leftSide}>
        <div className={styles.rechargeLeftPack}>
          <div className={styles.walletBalance}>
            <img
              src="https://images.astroyogi.com/astroyogi/wallet_blc.png"
              alt="Wallet"
              width={51}
              height={50}
            />
            Wallet Balance
            <span className={styles.dangerColor}>
              ₹ {walletBalance.toFixed(2)}
            </span>
          </div>

          <div className={styles.rechargeHeader}>Add Money to Wallet</div>

          <div className={styles.rechargeFlex}>
            {rechargePacks.map((pack, index) => (
              <Link
                to="/callingpack/payment"
                state={{ amount: pack.amount, extra: pack.extra }}
                key={index}
              >
                <RechargePack
                  {...pack}
                  active={pack.amount === selectedPack.amount}
                  onSelect={setSelectedPack}
                />
              </Link>
            ))}
          </div>

          {/* <div className={styles.requiredBalance}>
            <img
              src="https://images.astroyogi.com/astroyogi2017/e-pass/exclamation_mark_blue.png"
              alt="Required Balance"
              className={styles.requiredBalanceImg}
            />
            Minimum 5 mins balance required to consult
          </div> */}
        </div>
      </div>

      {/* Right side */}
      {/* <div className={styles.rightSide}>
        <div className={styles.rechargeRightPack}>
          <div className={styles.cashbackAmount}>
            <div className={styles.cashbackHeader}>
              <button type="button">
                <img
                  src="https://images.astroyogi.com/astroyogi/close-icon.png"
                  alt="Close"
                  width={16}
                  height={17}
                />
              </button>
              ₹{selectedPack.extra} Cashback
              <span>
                You will get ₹ {selectedPack.extra} extra with this recharge
              </span>
            </div>
            <div className={styles.offerApplied}>
              Offer applied successfully
            </div>
          </div>

          <button className={styles.redeemSection}>
            <img
              src="https://images.astroyogi.com/astroyogi/gift_icon.svg"
              alt="Gift"
              className={styles.redeemIcon}
            />
            Redeem your coupon here
            <img
              src="https://images.astroyogi.com/astroyogi/reedem_arrow.svg"
              alt="Arrow"
              className={styles.redeemArrow}
            />
          </button>

          <div className={styles.billSummary}>
            <table className={styles.billTable}>
              <thead>
                <tr>
                  <th>Bill Summary</th>
                  <th>Silver Recharge Pack</th>
                </tr>
              </thead>
              <tbody>
                {billSummary.map((row, index) => (
                  <BillRow key={index} {...row} />
                ))}
              </tbody>
            </table>
            <table className={`${styles.billTable} ${styles.toPay}`}>
              <tbody>
                <tr>
                  <th>To Pay</th>
                  <th>₹ {totalToPay}</th>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.offerPoints}>
            <img src="https://images.astroyogi.com/astroyogi/offer_applied.png" />
            Wohoo you got 900 loyalty points!
          </div>

          <div className={styles.proceedPay}>
            <button onClick={onPay} className={styles.proceedPayButton}>
              Proceed to pay
            </button>
            <strong>₹ {totalToPay}</strong>
            <span>Total Amount</span>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Payment;
