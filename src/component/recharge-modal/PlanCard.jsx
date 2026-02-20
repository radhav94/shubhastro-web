import { useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './rechargeModal.module.scss';

/**
 * Plan Card Component
 * 
 * Displays an individual recharge plan with selection capability.
 * Supports keyboard navigation and accessibility features.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.plan - Plan data object
 * @param {string} props.plan._id - Plan unique identifier
 * @param {string} props.plan.plan_id - Alternative plan identifier
 * @param {number} props.plan.actualPrice - Base price of the plan
 * @param {number} [props.plan.discountedPrice] - Additional bonus amount
 * @param {string} [props.plan.validity] - Plan validity period
 * @param {string} [props.plan.description] - Plan description
 * @param {string[]} [props.plan.features] - List of plan features
 * @param {boolean} [props.plan.isBestValue] - Flag for best value badge
 * @param {boolean} props.isSelected - Whether this plan is currently selected
 * @param {Function} props.onSelect - Callback when plan is selected
 * @param {boolean} [props.disabled=false] - Whether the card is disabled
 * 
 * @example
 * <PlanCard
 *   plan={planData}
 *   isSelected={selectedPlanId === planData.plan_id}
 *   onSelect={(plan) => setSelectedPlan(plan)}
 *   disabled={isProcessing}
 * />
 */
const PlanCard = ({ plan, isSelected, onSelect, disabled = false }) => {
  // Destructure plan data with defaults
  const {
    actualPrice = 0,
    discountedPrice = 0,
    validity = '',
    features = [],
    description = '',
    isBestValue = false,
  } = plan || {};

  /**
   * Handle card click
   * Prevents selection if disabled
   */
  const handleClick = useCallback(() => {
    if (disabled) return;
    
    if (typeof onSelect === 'function') {
      onSelect(plan);
    }
  }, [plan, onSelect, disabled]);

  /**
   * Handle keyboard navigation
   * Supports Enter and Space keys for selection
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (typeof onSelect === 'function') {
        onSelect(plan);
      }
    }
  }, [plan, onSelect, disabled]);

  // Calculate total amount
  const totalAmount = actualPrice + (discountedPrice || 0);

  return (
    <div
      className={`${styles.planCard} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="radio"
      tabIndex={disabled ? -1 : 0}
      aria-checked={isSelected}
      aria-disabled={disabled}
      aria-label={`Recharge plan: ${actualPrice} rupees${discountedPrice ? ` plus ${discountedPrice} rupees extra` : ''}, total ${totalAmount} rupees${validity ? `, valid for ${validity}` : ''}`}
    >
      {/* Selection Indicator */}
      <div className={styles.selectionIndicator} aria-hidden="true">
        <div className={styles.radioButton}>
          {isSelected && <div className={styles.radioInner} />}
        </div>
      </div>

      {/* Plan Content */}
      <div className={styles.planContent}>
        {/* Price Section */}
        <div className={styles.priceSection}>
          <div className={styles.mainPrice}>₹{actualPrice}</div>
          {discountedPrice > 0 && (
            <div className={styles.extraAmount}>
              + ₹{discountedPrice} Extra
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className={styles.totalAmount}>
          Total: ₹{totalAmount}
        </div>

        {/* Description */}
        {description && (
          <div className={styles.description}>{description}</div>
        )}

        {/* Validity */}
        {validity && (
          <div className={styles.validity}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 3.5V7L9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Valid for {validity}</span>
          </div>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className={styles.features}>
            {features.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.3333 4L6 11.3333L2.66667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Value Badge (optional) */}
      {isBestValue && (
        <div className={styles.bestValueBadge} aria-label="Best value plan">
          Best Value
        </div>
      )}
    </div>
  );
};

// PropTypes for type checking
PlanCard.propTypes = {
  plan: PropTypes.shape({
    _id: PropTypes.string,
    plan_id: PropTypes.string,
    actualPrice: PropTypes.number.isRequired,
    discountedPrice: PropTypes.number,
    validity: PropTypes.string,
    description: PropTypes.string,
    features: PropTypes.arrayOf(PropTypes.string),
    isBestValue: PropTypes.bool,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

PlanCard.defaultProps = {
  disabled: false,
};

export default PlanCard;
