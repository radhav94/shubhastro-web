import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./FinalPay.module.scss";
import { Toast } from "../../../component";
import { FaCcMastercard } from "react-icons/fa";
import { LuBadgeIndianRupee } from "react-icons/lu";
import { useGetPlanByIdQuery } from "../../../redux/api/plansApi/plansApi";

const FinalPay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const planId = location.state?.planId;
  const { data } = useGetPlanByIdQuery(planId);

  const amount = data?.data?.actualPrice || 0;
  const extra = data?.data?.discountedPrice || 0;

  const gst = +(amount * 0.18).toFixed(2);
  const totalAmount = +(amount + gst).toFixed(2);

  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  const handlePayment = (method) => {
    const newBalance = walletBalance + amount + extra;

    localStorage.setItem("wallet", JSON.stringify({ amount: newBalance }));
    setWalletBalance(newBalance);

    // 🔔 tell the rest of the app that wallet changed
    window.dispatchEvent(
      new CustomEvent("wallet-updated", { detail: { amount: newBalance } })
    );

    Toast.success(`Recharge successful via ${method}!`);
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Payment Details</h2>

      <div className={styles.card}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Recharge Amount</td>
              <td>₹ {amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>GST @18%</td>
              <td>₹ {gst.toFixed(2)}</td>
            </tr>
            <tr className={styles.totalRow}>
              <td>
                <strong>Total Amount</strong>
              </td>
              <td>
                <strong>₹ {totalAmount.toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.cashbackBox}>
        ₹ {extra} in wallet after recharge
      </div>

      <p className={styles.chooseText}>Choose Payment Method</p>

      <div className={styles.payGrid}>
        <button onClick={() => handlePayment("Card")}>
          <FaCcMastercard size={36} />

          <span>Credit/Debit Card</span>
        </button>
        <button onClick={() => handlePayment("UPI")}>
          <LuBadgeIndianRupee size={36} />
          <span>UPI</span>
        </button>

        <button onClick={() => handlePayment("NetBanking")}>
          <img src="https://img.icons8.com/ios/50/bank.png" alt="NetBanking" />
          Net Banking
        </button>

        <button onClick={() => handlePayment("Wallet")}>
          <img src="https://img.icons8.com/ios/50/wallet.png" alt="Wallet" />
          Other Wallets
        </button>
      </div>
    </div>
  );
};

export default FinalPay;
