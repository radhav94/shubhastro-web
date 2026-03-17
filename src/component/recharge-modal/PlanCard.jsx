import { useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './rechargeModal.module.scss';

const PlanCard = ({ plan, isSelected, onSelect, disabled = false }) => {
  const {
    name = '',
    actualPrice = 0,
    discountedPrice = 0,
    offerPrice = 0,
  } = plan || {};

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (typeof onSelect === 'function') onSelect(plan);
  }, [plan, onSelect, disabled]);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (typeof onSelect === 'function') onSelect(plan);
    }
  }, [plan, onSelect, disabled]);

  return (
    <div
      className={`${styles.planCard} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="radio"
      tabIndex={disabled ? -1 : 0}
      aria-checked={isSelected}
      aria-disabled={disabled}
      aria-label={`${name} plan: ₹${actualPrice}${discountedPrice > 0 ? `, save ₹${discountedPrice}` : ''}`}
    >
      {/* Selection Indicator */}
      <div className={styles.selectionIndicator} aria-hidden="true">
        <div className={styles.radioButton}>
          {isSelected && <div className={styles.radioInner} />}
        </div>
      </div>

      {/* Plan Content */}
      <div className={styles.planContent}>
        {name && <div className={styles.planName}>{name}</div>}

        <div className={styles.priceSection}>
          {offerPrice > actualPrice && (
            <span className={styles.strikePrice}>₹{offerPrice}</span>
          )}
          <div className={styles.mainPrice}>₹{actualPrice}</div>
        </div>

        {discountedPrice > 0 && (
          <div className={styles.extraAmount}>Save ₹{discountedPrice}</div>
        )}
      </div>
    </div>
  );
};

PlanCard.propTypes = {
  plan: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    actualPrice: PropTypes.number.isRequired,
    discountedPrice: PropTypes.number,
    offerPrice: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default PlanCard;
