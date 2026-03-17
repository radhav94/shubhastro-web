import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import PlanCard from './PlanCard';
import { useRechargePlans } from './useRechargePlans';
import { useRazorpayPayment } from '../../utils/hooks/useRazorpay';
import styles from './rechargeModal.module.scss';

/**
 * Reusable Recharge Modal Component
 * 
 * Provides a complete payment flow for wallet recharge:
 * - Fetches available plans from API
 * - Allows single plan selection
 * - Integrates with Razorpay payment gateway
 * - Handles loading, error, and empty states
 * - Prevents double payments and race conditions
 * - Accessible with keyboard navigation and ARIA labels
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} [props.onSuccess] - Callback on successful payment with payment data
 * @param {string} [props.title='Recharge Wallet'] - Optional custom modal title
 * 
 * @example
 * <RechargeModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={(data) => console.log('Payment successful:', data)}
 *   title="Add Balance"
 * />
 */
const RechargeModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Recharge Wallet',
}) => {
  // State management
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Refs for cleanup and preventing race conditions
  const isMountedRef = useRef(true);
  const paymentInProgressRef = useRef(false);

  // API hooks
  const { plans, isLoading, error, refetch } = useRechargePlans();
  const { initiatePayment, isProcessing, isLoaded, scriptError } = useRazorpayPayment();

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      document.body.style.overflow = '';
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(null);
      setPaymentLoading(false);
      paymentInProgressRef.current = false;
      refetch();
    }
  }, [isOpen, refetch]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Handle plan selection
   * @param {Object} plan - Selected plan object
   */
  const handleSelectPlan = useCallback((plan) => {
    if (!plan || paymentLoading || isProcessing) return;
    setSelectedPlan(plan);
  }, [paymentLoading, isProcessing]);

  /**
   * Validate payment prerequisites
   * @returns {Object} Validation result with isValid flag and error message
   */
  const validatePayment = useCallback(() => {
    // Check if Razorpay script loaded
    if (scriptError) {
      return { isValid: false, error: scriptError };
    }

    if (!isLoaded) {
      return { isValid: false, error: 'Payment gateway is loading. Please wait...' };
    }

    // Check if plan selected
    if (!selectedPlan) {
      return { isValid: false, error: 'Please select a plan first' };
    }

    // Validate plan data
    if (!selectedPlan._id && !selectedPlan.plan_id) {
      return { isValid: false, error: 'Invalid plan selected. Please try again.' };
    }

    // Validate plan amount
    const amount = selectedPlan.actualPrice || selectedPlan.totalPrice || 0;
    if (!amount || amount <= 0) {
      return { isValid: false, error: 'Invalid plan amount. Please select another plan.' };
    }

    // Check if payment already in progress
    if (paymentInProgressRef.current) {
      return { isValid: false, error: 'Payment already in progress. Please wait...' };
    }

    return { isValid: true };
  }, [selectedPlan, isLoaded, scriptError]);

  /**
   * Handle payment initiation
   * Validates prerequisites and initiates Razorpay payment flow
   */
  const handlePay = useCallback(async () => {
    // Prevent double clicks
    if (paymentLoading || isProcessing || paymentInProgressRef.current) {
      console.warn('[RechargeModal] Payment already in progress');
      return;
    }

    // Validate payment prerequisites
    const validation = validatePayment();
    if (!validation.isValid) {
      console.error('[RechargeModal] Payment validation failed:', validation.error);
      return;
    }

    // Mark payment as in progress
    paymentInProgressRef.current = true;
    setPaymentLoading(true);

    try {
      const planId = selectedPlan._id || selectedPlan.plan_id;

      await initiatePayment({
        planId,
        planData: selectedPlan,
        onSuccess: (paymentData) => {
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setPaymentLoading(false);
            paymentInProgressRef.current = false;
            onClose();
            
            // Call success callback if provided
            if (typeof onSuccess === 'function') {
              try {
                onSuccess(paymentData);
              } catch (callbackError) {
                console.error('[RechargeModal] Success callback error:', callbackError);
              }
            }
          }
        },
        onFailure: (error) => {
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setPaymentLoading(false);
            paymentInProgressRef.current = false;
            console.error('[RechargeModal] Payment failed:', error);
          }
        },
      });
    } catch (error) {
      // Handle unexpected errors
      console.error('[RechargeModal] Payment initiation error:', error);
      
      if (isMountedRef.current) {
        setPaymentLoading(false);
        paymentInProgressRef.current = false;
      }
    }
  }, [
    selectedPlan,
    paymentLoading,
    isProcessing,
    validatePayment,
    initiatePayment,
    onClose,
    onSuccess,
  ]);

  /**
   * Handle modal close
   * Prevents closing during payment processing
   */
  const handleClose = useCallback(() => {
    if (paymentLoading || isProcessing || paymentInProgressRef.current) {
      console.warn('[RechargeModal] Cannot close during payment');
      return;
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [paymentLoading, isProcessing, onClose]);

  /**
   * Handle backdrop click
   * @param {Event} e - Click event
   */
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !paymentLoading && !isProcessing && !paymentInProgressRef.current) {
      handleClose();
    }
  }, [paymentLoading, isProcessing, handleClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // API response: actualPrice = amount to pay, discountedPrice = discount given
  const totalAmount = selectedPlan ? selectedPlan.actualPrice : 0;

  // Check if payment button should be disabled
  const isPayButtonDisabled = !selectedPlan || paymentLoading || isProcessing || paymentInProgressRef.current || !isLoaded;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recharge-modal-title"
      aria-describedby="recharge-modal-description"
    >
      <div 
        className={styles.modalContainer} 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 id="recharge-modal-title" className={styles.modalTitle}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={paymentLoading || isProcessing || paymentInProgressRef.current}
            aria-label="Close recharge modal"
            title="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div 
          id="recharge-modal-description" 
          className={styles.modalBody}
          role="region"
          aria-label="Recharge plans"
        >
          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingContainer} role="status" aria-live="polite" aria-label="Loading plans">
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard} aria-hidden="true">
                  <div className={styles.skeletonRadio} />
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonPrice} />
                    <div className={styles.skeletonText} />
                    <div className={styles.skeletonText} />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading recharge plans...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className={styles.errorContainer} role="alert" aria-live="assertive">
              <div className={styles.errorIcon} aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="2" />
                  <path
                    d="M24 14V26"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="24" cy="32" r="1.5" fill="#ef4444" />
                </svg>
              </div>
              <p className={styles.errorMessage}>{error}</p>
              <button 
                type="button"
                className={styles.retryButton} 
                onClick={refetch}
                aria-label="Retry loading plans"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && plans.length === 0 && (
            <div className={styles.emptyContainer} role="status" aria-live="polite">
              <div className={styles.emptyIcon} aria-hidden="true">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="#d1d5db" strokeWidth="2" />
                  <path
                    d="M32 20V32L40 40"
                    stroke="#d1d5db"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className={styles.emptyMessage}>No recharge plans available</p>
            </div>
          )}

          {/* Plans List */}
          {!isLoading && !error && plans.length > 0 && (
            <div 
              className={styles.plansContainer}
              role="radiogroup"
              aria-label="Available recharge plans"
            >
              {plans.map((plan) => (
                <PlanCard
                  key={plan._id || plan.plan_id}
                  plan={plan}
                  isSelected={selectedPlan?._id === plan._id}
                  onSelect={handleSelectPlan}
                  disabled={paymentLoading || isProcessing || paymentInProgressRef.current}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && plans.length > 0 && (
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.payButton}
              onClick={handlePay}
              disabled={isPayButtonDisabled}
              aria-label={selectedPlan ? `Pay ${totalAmount} rupees` : 'Select a plan to continue'}
              aria-busy={paymentLoading || isProcessing}
            >
              {paymentLoading || isProcessing ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Processing...
                </>
              ) : !isLoaded ? (
                'Loading Payment Gateway...'
              ) : selectedPlan ? (
                `Pay ₹${totalAmount}`
              ) : (
                'Select a Plan'
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// PropTypes for type checking
RechargeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  title: PropTypes.string,
};

RechargeModal.defaultProps = {
  onSuccess: null,
  title: 'Recharge Wallet',
};

export default RechargeModal;
