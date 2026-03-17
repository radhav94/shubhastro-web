import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useVerifyPaymentMutation } from "../../../redux/api/payment/paymentApi";
import { useLazyGetWalletBalanceQuery } from "../../../redux/api/wallet/walletApi";
import Toast from "../../../component/toast";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import styles from "./PaymentWebhook.module.scss";

const STATUS = {
  VERIFYING: "verifying",
  SUCCESS: "success",
  FAILED: "failed",
};

const PaymentWebhook = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState(STATUS.VERIFYING);
  const [message, setMessage] = useState("Verifying your payment...");

  const [updateOrder] = useVerifyPaymentMutation();
  const [getWalletBalance] = useLazyGetWalletBalanceQuery();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processPayment = async () => {
      const paymentParams = Object.fromEntries(searchParams.entries());
      const razorpay_payment_id = paymentParams.razorpay_payment_id;
      const razorpay_order_id = paymentParams.razorpay_order_id;
      const razorpay_signature = paymentParams.razorpay_signature;

      const orderId = paymentParams.orderId;
      const planId = paymentParams.planId;

      if (!orderId || !planId) {
        setStatus(STATUS.FAILED);
        setMessage("Missing order details. Please try again or contact support.");
        Toast.error("Invalid payment link.");
        return;
      }

      // Determine payment status from gateway params (same logic as normal flow)
      const isPaymentSuccess = !!(razorpay_payment_id && razorpay_order_id && razorpay_signature);
      const orderStatus = isPaymentSuccess ? "completed" : "failure";

      // Build payload: core fields + all extra params from Razorpay redirect
      const { orderId: _oid, planId: _pid, returnUrl: _rurl, ...extraParams } = paymentParams;
      const requestPayload = {
        orderId: String(orderId),
        planId,
        orderStatus,
        ...extraParams,
      };

      try {
        setMessage("Updating order status...");

        const response = await updateOrder(requestPayload).unwrap();
        console.log("[PaymentWebhook] orders/update response:", response);

        if (isPaymentSuccess) {
          // Match handlePaymentSuccess flow exactly
          // Step 1: Refresh wallet balance
          try {
            await getWalletBalance();
          } catch (_refreshError) {
            // Don't throw - wallet was credited by backend, just refresh failed
          }

          // Step 2: Show success
          Toast.success("Payment successful! Wallet credited.");

          // Step 3: Dispatch wallet update events
          window.dispatchEvent(new Event("wallet-updated"));
          window.dispatchEvent(new Event("walletBalanceUpdated"));

          setStatus(STATUS.SUCCESS);
          setMessage("Payment successful! Redirecting...");
        } else {
          // Match handlePaymentFailure flow
          Toast.error("Payment failed.");
          setStatus(STATUS.FAILED);
          setMessage("Payment failed or was cancelled.");
        }
      } catch (error) {
        setStatus(STATUS.FAILED);
        setMessage(error?.data?.message || "Something went wrong during payment verification.");
        Toast.error("Payment verification failed. Please contact support.");
      }
    };

    processPayment();
  }, [searchParams, updateOrder, getWalletBalance]);

  // Auto-redirect after success/failure
  useEffect(() => {
    if (status === STATUS.VERIFYING) return;

    const returnUrl = searchParams.get("returnUrl");
    const delay = status === STATUS.SUCCESS ? 2000 : 4000;

    const timer = setTimeout(() => {
      navigate(returnUrl || "/");
    }, delay);

    return () => clearTimeout(timer);
  }, [status, navigate, searchParams]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === STATUS.VERIFYING && <PrimaryLoader isLoading />}

        {status === STATUS.SUCCESS && (
          <div className={styles.iconSuccess} aria-label="Payment successful">✓</div>
        )}

        {status === STATUS.FAILED && (
          <div className={styles.iconFailed} aria-label="Payment failed">✕</div>
        )}

        <p className={styles.message}>{message}</p>

        {status !== STATUS.VERIFYING && (
          <button className={styles.button} onClick={() => navigate(searchParams.get("returnUrl") || "/")}>
            {status === STATUS.SUCCESS ? "Continue" : "Go Back"}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentWebhook;
