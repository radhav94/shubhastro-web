import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useRazorpayPayment } from '../../utils/hooks/useRazorpay';
import Toast from '../toast';
import styles from './paymentDetailsModal.module.scss';

const GST_RATE = 0.18;

const PaymentDetailsModal = ({ isOpen, onClose, selectedPlan, onSuccess, onBack }) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { initiatePayment, isProcessing, isLoaded, scriptError } = useRazorpayPayment();

  const rechargeAmount = selectedPlan?.actualPrice || 0;
  const gstAmount = Math.round(rechargeAmount * GST_RATE);
  const totalAmount = rechargeAmount + gstAmount;
  const bonusAmount = selectedPlan?.discountedPrice || 0;

  useEffect(() => {
    if (isOpen) {
      setPaymentLoading(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handlePay = useCallback(async () => {
    if (paymentLoading || isProcessing || !selectedPlan) return;

    // The gateway not being ready used to be folded into `disabled`, which made
    // this the final step of a recharge with a permanently dead button. Checked
    // here rather than inside initiatePayment: that guard returns without
    // calling onFailure, so setting paymentLoading first would strand the
    // button on "Processing..." forever.
    if (scriptError) {
      Toast.error('Payment gateway could not load. Check your connection, then reload the page and try again.');
      return;
    }
    if (!isLoaded) {
      Toast.error('Payment gateway is still loading. Please try again in a moment.');
      return;
    }

    setPaymentLoading(true);

    try {
      const planId = selectedPlan._id || selectedPlan.plan_id;
      await initiatePayment({
        planId,
        planData: selectedPlan,
        onSuccess: (paymentData) => {
          setPaymentLoading(false);
          onClose();
          if (typeof onSuccess === 'function') onSuccess(paymentData);
        },
        onFailure: () => {
          setPaymentLoading(false);
        },
      });
    } catch {
      setPaymentLoading(false);
    }
  }, [selectedPlan, paymentLoading, isProcessing, isLoaded, scriptError, initiatePayment, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    if (paymentLoading || isProcessing) return;
    onClose();
  }, [paymentLoading, isProcessing, onClose]);

  const handleBack = useCallback(() => {
    if (paymentLoading || isProcessing) return;
    if (typeof onBack === 'function') onBack();
  }, [paymentLoading, isProcessing, onBack]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose();
  }, [handleClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !paymentLoading && !isProcessing) handleClose();
  }, [paymentLoading, isProcessing, handleClose]);

  if (!isOpen || !selectedPlan) return null;

  // Only a genuine in-flight payment disables the button. "Gateway not ready"
  // is dimmed via aria-disabled instead, so the tap still reaches handlePay.
  const isPayDisabled = paymentLoading || isProcessing;
  const isGatewayNotReady = !isLoaded || !!scriptError;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-details-title"
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={handleBack}
            disabled={paymentLoading || isProcessing} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 id="payment-details-title" className={styles.title}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
            </svg>
            Payment Details
          </h2>
          <button type="button" className={styles.closeButton} onClick={handleClose}
            disabled={paymentLoading || isProcessing} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Breakdown */}
        <div className={styles.body}>
          <div className={styles.breakdownCard}>
            <div className={styles.row}>
              <span>Recharge Amount</span>
              <span className={styles.amount}>₹{rechargeAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.row}>
              <span>GST @18%</span>
              <span className={styles.amount}>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.divider} />
            <div className={`${styles.row} ${styles.totalRow}`}>
              <span>Total Amount</span>
              <span className={styles.totalAmount}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {bonusAmount > 0 && (
            <div className={styles.bonusBanner}>
              <span className={styles.bonusIcon} aria-hidden="true">🎁</span>
              <span>₹{bonusAmount} bonus in your wallet after recharge</span>
            </div>
          )}

          <div className={styles.paymentInfo}>
            <p>Supports: Credit/Debit Cards, UPI, Net Banking, Wallets</p>
            <p className={styles.secureText}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.payButton} onClick={handlePay}
            disabled={isPayDisabled}
            aria-disabled={isGatewayNotReady}
            aria-label={`Pay ${totalAmount} rupees with Razorpay`}
            aria-busy={paymentLoading || isProcessing}>
            {paymentLoading || isProcessing ? (
              <><span className={styles.spinner} aria-hidden="true" />Processing...</>
            ) : scriptError ? (
              // Was showing "Loading Payment Gateway..." forever, which is a
              // lie once the script has actually failed. Not labelled "Retry":
              // useRazorpayPayment exposes no way to reload the script, so the
              // tap can only explain, not fix.
              'Payment Gateway Unavailable'
            ) : !isLoaded ? (
              'Loading Payment Gateway...'
            ) : (
              <>Pay with RazorPay <span aria-hidden="true">›</span></>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

PaymentDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
  onSuccess: PropTypes.func,
  onBack: PropTypes.func,
};

export default PaymentDetailsModal;
