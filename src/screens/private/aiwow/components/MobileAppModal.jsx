import React from 'react';
import styles from './MobileAppModal.module.scss';
import { Toast } from '../../../../component';
import {
  PLAY_STORE_URL,
  APP_STORE_URL,
  IOS_UNAVAILABLE_MESSAGE,
} from '../../../../utils/helper/appStoreLinks';

const MobileAppModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Mobile handle bar */}
        <div className={styles.handleBar}></div>
        
        <button className={`${styles.closeBtn} notranslate`} onClick={onClose} translate="no">×</button>
        
        <div className={styles.iconWrapper}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="16" fill="#FFF5EB"/>
            <path d="M40 20C31.7157 20 25 26.7157 25 35V45C25 53.2843 31.7157 60 40 60C48.2843 60 55 53.2843 55 45V35C55 26.7157 48.2843 20 40 20Z" stroke="#F75801" strokeWidth="2"/>
            <rect x="35" y="28" width="10" height="24" rx="2" fill="#F75801"/>
            <circle cx="40" cy="54" r="2" fill="#F75801"/>
          </svg>
        </div>

        <h2 className={styles.title}>AR Vastu Scanner</h2>
        <p className={styles.subtitle}>Available on Mobile App</p>
        
        <p className={styles.description}>
          Experience the full power of AR Vastu Scanner with augmented reality features on our mobile app. 
          Scan your space in real-time and get instant Vastu recommendations.
        </p>

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.6667 8.33333L10 15L3.33334 8.33333" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 3.33333V15" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Real-time AR scanning</span>
          </div>
          <div className={styles.featureItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.6667 8.33333L10 15L3.33334 8.33333" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 3.33333V15" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>360° room analysis</span>
          </div>
          <div className={styles.featureItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.6667 8.33333L10 15L3.33334 8.33333" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 3.33333V15" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Instant Vastu remedies</span>
          </div>
        </div>

        <div className={styles.downloadSection}>
          <p className={styles.downloadText}>Download ShubhTalk App</p>
          <div className={styles.storeButtons}>
            <a 
              href={PLAY_STORE_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.storeBtn}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="currentColor"/>
                <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="currentColor"/>
                <path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" fill="currentColor"/>
                <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="currentColor"/>
              </svg>
              <div className={styles.storeInfo}>
                <span className={styles.storeLabel}>GET IT ON</span>
                <span className={styles.storeName}>Google Play</span>
              </div>
            </a>
            
            {/*
              This modal is the whole exit from an app-only feature (AR Vastu
              Scanner), so a dead App Store link left iOS visitors with no way
              forward at all. Kept visible but honest until APP_STORE_URL is set.
            */}
            {APP_STORE_URL ? (
              <a 
                href={APP_STORE_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.storeBtn}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17.05 20.28C16.03 21.23 14.96 21.08 13.93 20.63C12.85 20.17 11.85 20.15 10.71 20.63C9.28 21.25 8.52 21.07 7.62 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C19.01 17.7 18.27 19.19 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z" fill="currentColor"/>
                </svg>
                <div className={styles.storeInfo}>
                  <span className={styles.storeLabel}>Download on the</span>
                  <span className={styles.storeName}>App Store</span>
                </div>
              </a>
            ) : (
              <button
                type="button"
                className={styles.storeBtn}
                onClick={() => Toast.info(IOS_UNAVAILABLE_MESSAGE)}
                aria-disabled="true"
                title="iOS app coming soon"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17.05 20.28C16.03 21.23 14.96 21.08 13.93 20.63C12.85 20.17 11.85 20.15 10.71 20.63C9.28 21.25 8.52 21.07 7.62 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C19.01 17.7 18.27 19.19 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z" fill="currentColor"/>
                </svg>
                <div className={styles.storeInfo}>
                  <span className={styles.storeLabel}>Coming soon to the</span>
                  <span className={styles.storeName}>App Store</span>
                </div>
              </button>
            )}
          </div>
        </div>

        <button className={styles.okayBtn} onClick={onClose}>
          Okay, Got It
        </button>
      </div>
    </div>
  );
};

export default MobileAppModal;
