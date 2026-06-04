import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./FinalPay.module.scss";
import { FaCcMastercard } from "react-icons/fa";
import { useGetPlanByIdQuery } from "../../../redux/api/plansApi/plansApi";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useRazorpayPayment } from "../../../utils/hooks/useRazorpay";
import Toast from "../../../component/toast";
import BackButton from "../../../component/UI/BackButton/BackButton";
import PaymentSuccessModal from "../../../component/UI/modal/WelcomeBonusModal/PaymentSuccessModal";

const FinalPay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const planId = location.state?.planId;
  const returnUrl = location.state?.returnUrl; // Get return URL from state
  const { data, isLoading: isPlanLoading, error: planError } = useGetPlanByIdQuery(planId, {
    skip: !planId,
  });

  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const [successAmount, setSuccessAmount] = useState(null);

  const amount = data?.data?.actualPrice || 0;
  const extra = data?.data?.discountedPrice || 0;

  const gst = +(amount * 0.18).toFixed(2);
  const totalAmount = +(amount + gst).toFixed(2);

  // Wallet balance hook
  const { refreshWallet } = useWalletBalance();
  
  // Razorpay payment hook
  const { initiatePayment, isProcessing, isLoaded, scriptError } = useRazorpayPayment();

  // Redirect if no plan ID
  useEffect(() => {
    if (!planId) {
      Toast.error("No plan selected. Please select a plan first.");
      navigate("/payment");
    }
  }, [planId, navigate]);

  // Refresh wallet on mount
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  // Handle plan loading error
  useEffect(() => {
    if (planError) {
      Toast.error("Failed to load plan details. Please try again.");
      navigate("/payment");
    }
  }, [planError, navigate]);

  const handlePayment = async () => {
    // Prevent multiple payment attempts
    if (paymentAttempted) {
      Toast.warning("Payment already initiated. Please complete or cancel the current payment.");
      return;
    }

    // Validate plan data
    if (!data?.data) {
      Toast.error("Plan details not loaded. Please try again.");
      return;
    }

    // Validate amount
    if (amount <= 0) {
      Toast.error("Invalid payment amount. Please contact support.");
      return;
    }

    setPaymentAttempted(true);

    await initiatePayment({
      planId: data?.data?._id || planId,
      planData: data.data,
      onSuccess: () => {
        // Refresh wallet balance
        refreshWallet();
        
        // Show payment success popup
        setSuccessAmount(amount);
      },
      onFailure: (error) => {
        console.error("Payment failed:", error);
        setPaymentAttempted(false);
        
        // Don't show error toast if payment was cancelled
        if (!error?.cancelled) {
          // Error toast already shown by hook
        }
      },
    });
  };

  // Loading state
  if (isPlanLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading payment details...</div>
      </div>
    );
  }

  // No plan data
  if (!data?.data) {
    return null;
  }

  return (
    <>
    <div className={styles.wrapper}>
      <BackButton />
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

      {extra > 0 && (
        <div className={styles.cashbackBox}>
          ₹ {extra} bonus in wallet after recharge
        </div>
      )}

      <p className={styles.chooseText}>Proceed to Payment</p>

      <div className={styles.payGrid}>
        <button 
          onClick={handlePayment} 
          disabled={isProcessing || !isLoaded || !!scriptError || paymentAttempted}
          className={styles.razorpayButton}
          aria-label="Pay with Razorpay"
        >
          <FaCcMastercard size={36} aria-hidden="true" />
          <span>
            {isProcessing 
              ? "Processing..." 
              : !isLoaded 
              ? "Loading payment gateway..." 
              : scriptError
              ? "Payment gateway unavailable"
              : "Pay with Razorpay"}
          </span>
        </button>
        
        <div className={styles.paymentInfo}>
          <p>Supports: Credit/Debit Cards, UPI, Net Banking, Wallets</p>
          <p className={styles.secureText}>🔒 Secure payment powered by Razorpay</p>
        </div>
      </div>

      {scriptError && (
        <div className={styles.errorBox}>
          <p>{scriptError}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}
    </div>
    </div>

      <PaymentSuccessModal
        isOpen={successAmount !== null}
        onClose={() => {
          setSuccessAmount(null);
          if (returnUrl) {
            const separator = returnUrl.includes('?') ? '&' : '?';
            navigate(`${returnUrl}${separator}fromPayment=true`);
          } else {
            navigate("/");
          }
        }}
        amount={successAmount}
      />
    </>
  );
};

export default FinalPay;
