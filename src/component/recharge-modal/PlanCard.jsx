import { useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './rechargeModal.module.scss';

const PlanCard = ({ plan, isSelected, onSelect, disabled = false }) => {
  const {
    actualPrice = 0,
    discountedPrice = 0,
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
      aria-label={`₹${actualPrice}${discountedPrice > 0 ? `, Bonus ₹${discountedPrice}` : ''}`}
    >
      <div className={styles.planContent}>
        <div className={styles.mainPrice}>₹ {actualPrice}</div>
        {discountedPrice > 0 && (
          <div className={styles.extraAmount}>Bonus ₹ {discountedPrice}</div>
        )}
      </div>
    </div>
  );
};

PlanCard.propTypes = {
  plan: PropTypes.shape({
    _id: PropTypes.string,
    actualPrice: PropTypes.number.isRequired,
    discountedPrice: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default PlanCard;
