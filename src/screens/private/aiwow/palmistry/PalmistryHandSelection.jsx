import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './PalmistryHandSelection.module.scss';
import { setPalmistrySelectedHand } from '../../../../redux/aiwow/aiwowSlice';
import Footer from '../../../../layouts/Footer';
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
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/aiwow/ai-palmistry-scanner')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Select Hand</h1>
        </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clip-path="url(#clip0_9475_7868)">
                  <path d="M13 24C9.73998 24 6.80998 22.01 5.59998 18.98L2.56998 11.37C2.25998 10.58 2.99998 9.79 3.80998 10.05L4.59998 10.31C5.15998 10.49 5.61998 10.92 5.83998 11.47L7.24998 15H7.99998V3.25C7.99998 2.56 8.55998 2 9.24998 2C9.93998 2 10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 0.56 12.06 0 12.75 0C13.44 0 14 0.56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5C20.44 4.5 21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z" fill="url(#paint0_linear_9475_7868)"/>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_9475_7868" x1="2.4978" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F75801"/>
                    <stop offset="1" stop-color="#D43400"/>
                  </linearGradient>
                  <clipPath id="clip0_9475_7868">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clip-path="url(#clip0_9475_7871)">
                  <path d="M11 24C14.26 24 17.19 22.01 18.4 18.98L21.43 11.37C21.74 10.58 21 9.79 20.19 10.05L19.4 10.31C18.84 10.49 18.38 10.92 18.16 11.47L16.75 15H16V3.25C16 2.56 15.44 2 14.75 2C14.06 2 13.5 2.56 13.5 3.25V12H12.5V1.25C12.5 0.56 11.94 0 11.25 0C10.56 0 10 0.56 10 1.25V12H9.00002V2.75C9.00002 2.06 8.44002 1.5 7.75002 1.5C7.06002 1.5 6.50002 2.06 6.50002 2.75V12H5.50002V5.75C5.50002 5.06 4.94002 4.5 4.25002 4.5C3.56002 4.5 3.00002 5.06 3.00002 5.75V16C3.00002 20.42 6.58002 24 11 24Z" fill="url(#paint0_linear_9475_7871)"/>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_9475_7871" x1="21.5022" y1="12" x2="3.00002" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F75801"/>
                    <stop offset="1" stop-color="#D43400"/>
                  </linearGradient>
                  <clipPath id="clip0_9475_7871">
                    <rect width="24" height="24" fill="white" transform="matrix(-1 0 0 1 24 0)"/>
                  </clipPath>
                </defs>
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
    <Footer />
    </>
  );
};

export default PalmistryHandSelection;
