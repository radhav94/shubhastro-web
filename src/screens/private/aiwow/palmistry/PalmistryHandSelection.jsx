import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './PalmistryHandSelection.module.scss';
import { setPalmistrySelectedHand } from '../../../../redux/aiwow/aiwowSlice';

const PalmistryHandSelection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedHand, setSelectedHand] = useState(null);

  const handleHandSelect = (hand) => {
    setSelectedHand(hand);
  };

  const handleProceed = () => {
    if (selectedHand) {
      dispatch(setPalmistrySelectedHand(selectedHand));
      navigate('/aiwow/palmistry/instructions');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Select Hand</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.instructionSection}>
          <h2 className={styles.instructionTitle}>Which hand would you like to scan?</h2>
          <p className={styles.instructionText}>
            Select the hand you want to analyze. In palmistry, the dominant hand shows your present and future, while the non-dominant hand reveals your potential and past.
          </p>
        </div>

        <div className={styles.handOptions}>
          <button
            className={`${styles.handCard} ${selectedHand === 'left' ? styles.selected : ''}`}
            onClick={() => handleHandSelect('left')}
          >
            <div className={styles.handIcon}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M20 60V30C20 28 21 27 23 27C25 27 26 28 26 30V20C26 18 27 17 29 17C31 17 32 18 32 20V15C32 13 33 12 35 12C37 12 38 13 38 15V20C38 18 39 17 41 17C43 17 44 18 44 20V35L50 28C51 27 52 27 53 28C54 29 54 30 53 31L44 50C43 52 42 54 40 56C38 58 36 59 34 60H20Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h3 className={styles.handLabel}>Left Hand</h3>
            <p className={styles.handDescription}>Potential & Past</p>
            {selectedHand === 'left' && (
              <div className={styles.checkmark}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#F75801"/>
                  <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>

          <button
            className={`${styles.handCard} ${selectedHand === 'right' ? styles.selected : ''}`}
            onClick={() => handleHandSelect('right')}
          >
            <div className={styles.handIcon}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M60 60V30C60 28 59 27 57 27C55 27 54 28 54 30V20C54 18 53 17 51 17C49 17 48 18 48 20V15C48 13 47 12 45 12C43 12 42 13 42 15V20C42 18 41 17 39 17C37 17 36 18 36 20V35L30 28C29 27 28 27 27 28C26 29 26 30 27 31L36 50C37 52 38 54 40 56C42 58 44 59 46 60H60Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h3 className={styles.handLabel}>Right Hand</h3>
            <p className={styles.handDescription}>Present & Future</p>
            {selectedHand === 'right' && (
              <div className={styles.checkmark}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#F75801"/>
                  <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        </div>

        <button 
          className={`${styles.proceedButton} ${!selectedHand ? styles.disabled : ''}`}
          onClick={handleProceed}
          disabled={!selectedHand}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PalmistryHandSelection;
