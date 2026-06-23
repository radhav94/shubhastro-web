import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import PlanCard from './PlanCard';
import PaymentDetailsModal from './PaymentDetailsModal';
import PaymentSuccessModal from '../UI/modal/WelcomeBonusModal/PaymentSuccessModal';
import { useRechargePlans } from './useRechargePlans';
import { useWalletBalance } from '../../screens/private/wallet/useWalletBalance';
import { AppIcons } from '../../utils/appImages';
import styles from './rechargeModal.module.scss';

/**
 * Reusable Recharge Modal Component — Two-step flow
 *
 * Step 1: Select amount (this modal)
 * Step 2: Payment details breakdown → Razorpay (PaymentDetailsModal)
 *
 * @component
 */
const RechargeModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'ADD MONEY TO WALLET',
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [successAmount, setSuccessAmount] = useState(null);
  const isMountedRef = useRef(true);

  const { plans, isLoading, error, refetch } = useRechargePlans(!isOpen);
  const { balance, isFetching: isBalanceFetching, refreshWallet } = useWalletBalance();

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
      setShowPaymentDetails(false);
      refetch();
      refreshWallet();
    }
  }, [isOpen, refetch, refreshWallet]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen && !showPaymentDetails) {
      document.body.style.overflow = 'hidden';
    } else if (!isOpen) {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, showPaymentDetails]);

  const handleSelectPlan = useCallback((plan) => {
    if (!plan) return;
    setSelectedPlan(plan);
  }, []);

  /** "Add Money" button → open second popup */
  const handleAddMoney = useCallback(() => {
    if (!selectedPlan) return;
    setShowPaymentDetails(true);
  }, [selectedPlan]);

  const handleClose = useCallback(() => {
    if (showPaymentDetails) return; // let payment modal handle its own close
    if (typeof onClose === 'function') onClose();
  }, [showPaymentDetails, onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose();
  }, [handleClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleClose();
  }, [handleClose]);

  /** When user clicks back on payment details modal */
  const handlePaymentBack = useCallback(() => {
    setShowPaymentDetails(false);
  }, []);

  /** When payment details modal closes (after pay or dismiss) */
  const handlePaymentClose = useCallback(() => {
    setShowPaymentDetails(false);
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  /** Payment success — bubble up */
  const handlePaymentSuccess = useCallback((data) => {
    setShowPaymentDetails(false);
    refreshWallet();
    const baseAmount = selectedPlan?.actualPrice || selectedPlan?.amount || selectedPlan?.price || data?.amount || 0;
    const bonus = selectedPlan?.discountedPrice || 0;
    const totalAdded = Number(baseAmount) + Number(bonus);
    setSuccessAmount(totalAdded);
    if (typeof onClose === 'function') onClose();
    if (typeof onSuccess === 'function') onSuccess({ ...data, amount: totalAdded });
  }, [onClose, onSuccess, refreshWallet, selectedPlan]);

  if (!isOpen && successAmount === null) return null;

  if (!isOpen) {
    return (
      <PaymentSuccessModal
        isOpen={successAmount !== null}
        onClose={() => setSuccessAmount(null)}
        amount={successAmount}
      />
    );
  }

  const displayBalance = balance !== null && balance !== undefined
    ? `₹${Number(balance).toLocaleString('en-IN')}`
    : '...';

  return (
    <>
      {/* ── Step 1: Select Amount ── */}
      {!showPaymentDetails && createPortal(
        <div
          className={styles.modalOverlay}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="recharge-modal-title"
        >
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()} role="document">
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 id="recharge-modal-title" className={styles.modalTitle}>{title}</h2>
              <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className={styles.modalBody}>
              {/* Current Balance */}
              <div className={styles.balanceCard}>
                <div className={styles.balanceLeft}>
                  <span className={styles.balanceIcon} aria-hidden="true">
                    <img src={AppIcons.RupeeCoin} alt="" width="28" height="28" />
                  </span>
                  <span className={styles.balanceLabel}>Current Balance</span>
                </div>
                <span className={styles.balanceValue}>
                  {isBalanceFetching ? '...' : displayBalance}
                </span>
              </div>

              {/* Suggested Top Ups label */}
              <p className={styles.sectionLabel}>SUGGESTED TOP UPS</p>

              {/* Loading */}
              {isLoading && (
                <div className={styles.loadingContainer} role="status" aria-live="polite">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={styles.skeletonCard} aria-hidden="true">
                      <div className={styles.skeletonRadio} />
                      <div className={styles.skeletonContent}>
                        <div className={styles.skeletonPrice} />
                        <div className={styles.skeletonText} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && !isLoading && (
                <div className={styles.errorContainer} role="alert">
                  <div className={styles.errorIcon} aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="2" />
                      <path d="M24 14V26" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="24" cy="32" r="1.5" fill="#ef4444" />
                    </svg>
                  </div>
                  <p className={styles.errorMessage}>{error}</p>
                  <button type="button" className={styles.retryButton} onClick={refetch}>Try Again</button>
                </div>
              )}

              {/* Empty */}
              {!isLoading && !error && plans.length === 0 && (
                <div className={styles.emptyContainer} role="status">
                  <p className={styles.emptyMessage}>No recharge plans available</p>
                </div>
              )}

              {/* Plans Grid */}
              {!isLoading && !error && plans.length > 0 && (
                <div className={styles.plansContainer} role="radiogroup" aria-label="Available recharge plans">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan._id || plan.plan_id}
                      plan={plan}
                      isSelected={selectedPlan?._id === plan._id}
                      onSelect={handleSelectPlan}
                      disabled={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer — "Add Money" opens step 2 */}
            {!isLoading && !error && plans.length > 0 && (
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.payButton}
                  onClick={handleAddMoney}
                  disabled={!selectedPlan}
                  aria-label={selectedPlan ? 'Proceed to payment details' : 'Select a plan to continue'}
                >
                  {selectedPlan ? (
                    <>Add Money <span aria-hidden="true">›</span></>
                  ) : (
                    'Select a Plan'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Step 2: Payment Details ── */}
      <PaymentDetailsModal
        isOpen={showPaymentDetails}
        onClose={handlePaymentClose}
        selectedPlan={selectedPlan}
        onSuccess={handlePaymentSuccess}
        onBack={handlePaymentBack}
      />

      {/* ── Payment Success Popup ── */}
      <PaymentSuccessModal
        isOpen={successAmount !== null}
        onClose={() => setSuccessAmount(null)}
        amount={successAmount}
      />
    </>
  );
};

RechargeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  title: PropTypes.string,
};

RechargeModal.defaultProps = {
  onSuccess: null,
  title: 'ADD MONEY TO WALLET',
};

export default RechargeModal;
