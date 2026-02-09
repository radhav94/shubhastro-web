import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./FinalPay.module.scss";
import { Toast } from "../../../component";
import { FaCcMastercard } from "react-icons/fa";
import { LuBadgeIndianRupee } from "react-icons/lu";
import { useGetPlanByIdQuery } from "../../../redux/api/plansApi/plansApi";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useCreditWalletMutation } from "../../../redux/api/wallet/walletApi";

const FinalPay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const planId = location.state?.planId;
  const { data } = useGetPlanByIdQuery(planId);

  const amount = data?.data?.actualPrice || 0;
  const extra = data?.data?.discountedPrice || 0;

  const gst = +(amount * 0.18).toFixed(2);
  const totalAmount = +(amount + gst).toFixed(2);

  // Use wallet balance hook
  const { refreshWallet } = useWalletBalance();
  
  // Credit wallet mutation
  const [creditWallet] = useCreditWalletMutation();
  
  // Loading state for payment
  const [isProcessing, setIsProcessing] = useState(false);

  // Refresh wallet balance on mount
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const handlePayment = async (method) => {
    try {
      setIsProcessing(true);
      
      // Prepare payload for wallet credit API
      const payload = {
        message: `Wallet recharge via ${method}`,
        amount: amount + extra, // Total coins to credit (actual price + bonus)
        action: "credit",
        type: "coin",
        reason: "purchase",
        plan_id: planId || 0,
      };
      // Call the credit wallet API
      const response = await creditWallet(payload).unwrap();

      // Refresh wallet balance to get updated balance
      refreshWallet();

      // Dispatch wallet update events for other components
      window.dispatchEvent(new Event("wallet-updated"));
      window.dispatchEvent(new Event("walletBalanceUpdated"));

      Toast.success(`Recharge successful via ${method}!`);
      
      // Navigate after a short delay to ensure state updates
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Wallet credit error:", error);
      Toast.error(error?.data?.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
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
        <button onClick={() => handlePayment("Card")} disabled={isProcessing}>
          <FaCcMastercard size={36} />
          <span>{isProcessing ? "Processing..." : "Credit/Debit Card"}</span>
        </button>
        <button onClick={() => handlePayment("UPI")} disabled={isProcessing}>
          <LuBadgeIndianRupee size={36} />
          <span>{isProcessing ? "Processing..." : "UPI"}</span>
        </button>

        <button onClick={() => handlePayment("NetBanking")} disabled={isProcessing}>
          <img src="https://img.icons8.com/ios/50/bank.png" alt="NetBanking" />
          {isProcessing ? "Processing..." : "Net Banking"}
        </button>

        <button onClick={() => handlePayment("Wallet")} disabled={isProcessing}>
          <img src="https://img.icons8.com/ios/50/wallet.png" alt="Wallet" />
          {isProcessing ? "Processing..." : "Other Wallets"}
        </button>
      </div>
    </div>
  );
};

export default FinalPay;
