import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import styles from "./FinalPay.module.scss";
import { FaCcMastercard } from "react-icons/fa";
import { useGetPlanByIdQuery } from "../../../redux/api/plansApi/plansApi";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useRazorpayPayment } from "../../../utils/hooks/useRazorpay";
import Toast from "../../../component/toast";
import BackButton from "../../../component/UI/BackButton/BackButton";
import PaymentSuccessModal from "../../../component/UI/modal/WelcomeBonusModal/PaymentSuccessModal";
import { trackEvent } from "../../../utils/analytics";

const FinalPay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const planId = location.state?.planId;
  const returnUrl = location.state?.returnUrl; // Get return URL from state
  const { data, isLoading: isPlanLoading, error: planError } = useGetPlanByIdQuery(planId, {
    skip: !planId,
  });

  /*
    In-flight latch as a ref released in `finally`, not a state flag cleared by
    onFailure. initiatePayment has three early returns that toast and return
    *without* ever calling onFailure (payment already processing, gateway not
    loaded, Razorpay key unconfigured). With a state flag, any of those latched
    the only button on this page permanently dead until a reload.
  */
  const submittingRef = useRef(false);
  const [successAmount, setSuccessAmount] = useState(null);

  const amount = data?.data?.actualPrice || 0;
  const extra = data?.data?.discountedPrice || 0;

  const gst = +(amount * 0.18).toFixed(2);
  const totalAmount = +(amount + gst).toFixed(2);

  // Wallet balance hook
  const { refreshWallet } = useWalletBalance();
  
  // Razorpay payment hook
  const { initiatePayment, isProcessing, isLoaded, scriptError, retryScriptLoad } = useRazorpayPayment();

  // Redirect if no plan ID
  useEffect(() => {
    if (!planId) {
      Toast.error("No plan selected. Please select a plan first.");
      // "/payment" is not a route — only "/payment/webhook" is — so this fell
      // through to the "*" NotFound element. planId travels only in
      // location.state, which is dropped on reload or a restored history entry,
      // so reloading this screen reliably dumped the user on a 404.
      navigate("/recharge", { replace: true });
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
      navigate("/recharge", { replace: true });
    }
  }, [planError, navigate]);

  /*
    A settled-but-empty response is a dead end, not a no-op.

    The query can resolve without rejecting and still carry no usable plan —
    an unexpected payload shape, or a `{ success: false }` body. That combination
    (not loading, no error, no data) fell through to `return null` below, which
    rendered a completely blank page at /recharge/payment: no heading, no
    message, no control, and no effect to move the user anywhere. Nothing was
    broken enough to trip the planError branch above, so the visitor was left
    looking at an empty screen at the last step of a recharge with no way
    forward except leaving.

    Treated the same as a load failure: say so and send them back to plan
    selection, where they can retry.
  */
  useEffect(() => {
    if (!planId || isPlanLoading || planError) return;
    if (data?.data) return;
    Toast.error("We couldn't load that plan. Please pick a recharge amount again.");
    navigate("/recharge", { replace: true });
  }, [planId, isPlanLoading, planError, data, navigate]);

  /*
    Every blocker is checked here and named out loud, because the button is no
    longer `disabled`. A disabled <button> dispatches no click event at all, so
    tapping the single CTA on this screen was a literal dead click — and it
    swallowed the very toast that would have explained the wait.
  */
  const handlePayment = async () => {
    if (submittingRef.current || isProcessing) {
      Toast.warning("Payment already initiated. Please complete or cancel the current payment.");
      return;
    }

    // The gateway script loads over the network and can lag behind first paint,
    // especially on mobile. Say so rather than absorbing the tap.
    //
    // A failed load is retried in place rather than only reported: the hook drops
    // the dead <script> tag and fetches again, so the visitor is not pushed into
    // reloading the page at the last step of a recharge.
    if (scriptError) {
      Toast.info("Retrying the payment gateway…");
      retryScriptLoad();
      return;
    }
    if (!isLoaded) {
      Toast.error("The payment gateway is still loading. Please try again in a moment.");
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

    submittingRef.current = true;

    // Same single-gateway situation as the recharge modal: the instrument is
    // chosen inside Razorpay's checkout, so committing to Razorpay here is the
    // observable "method selected" step. See PaymentDetailsModal.handlePay.
    trackEvent("recharge_payment_method_selected", {
      amount,
      payment_method: "razorpay",
      source: "recharge_screen",
    });

    try {
      await initiatePayment({
        planId: data?.data?._id || planId,
        planData: data.data,
        onSuccess: () => {
          // Refresh wallet balance
          refreshWallet();

          // Show payment success popup (actualPrice + bonus)
          setSuccessAmount(amount + extra);
        },
        onFailure: (error) => {
          // Cancellation and gateway errors are already toasted by the hook.
          console.error("Payment failed:", error);
        },
      });
    } finally {
      // Released whether the checkout opened, failed, or bailed out early. While
      // the Razorpay sheet is genuinely open, `isProcessing` holds the guard.
      submittingRef.current = false;
    }
  };

  // Loading state
  if (isPlanLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading payment details...</div>
      </div>
    );
  }

  /*
    No plan data. The effect above is already redirecting, but effects run after
    render, so returning `null` here would still paint an empty page for at least
    one frame — and for the whole round trip if that redirect is ever prevented.
    Render the reason and an explicit way out instead of nothing.
  */
  if (!data?.data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <p>We couldn&apos;t load that plan.</p>
          <button
            type="button"
            onClick={() => navigate("/recharge", { replace: true })}
            className={styles.retryButton}
          >
            Choose a recharge amount
          </button>
        </div>
      </div>
    );
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
          className={`${styles.razorpayButton} ${
            isProcessing || !isLoaded || scriptError ? styles.blocked : ""
          }`.trim()}
          aria-disabled={isProcessing || !isLoaded || !!scriptError}
          aria-busy={isProcessing}
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
          {/* Re-fetches just the gateway script. Was window.location.reload(),
              which worked but threw away the whole page — including the selected
              plan — to recover from one failed third-party request. */}
          <button type="button" onClick={retryScriptLoad} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}
    </div>
    </div>

      <PaymentSuccessModal
        isOpen={successAmount !== null}
        redirectTo={null}
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
