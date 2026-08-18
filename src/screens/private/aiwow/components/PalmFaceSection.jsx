import React from 'react';
import styles from './PalmFaceSection.module.scss';
import { getAIWowIcon } from '../../../../utils/appImages';

const PalmFaceSection = ({ onFeatureClick }) => {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Palm and Face Reading</h3>
      <div className={styles.grid}>
        <div className={styles.card} onClick={() => onFeatureClick('/ai-wow/ai-palmistry-scanner')}>
          <div className={styles.header}>
            <h4 className={styles.title}>Palmistry Scanner</h4>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.iconWrapper}>
            <img src={getAIWowIcon('palm')} alt="Palmistry" className={styles.icon} />
          </div>
          <p className={styles.description}>
            AI-powered palm reading analysing life, heart, fate and head lines
          </p>
        </div>

        <div className={styles.card} onClick={() => onFeatureClick('/ai-wow/astro-face-reading')}>
          <div className={styles.header}>
            <h4 className={styles.title}>Face Reading</h4>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.iconWrapper}>
            <img src={getAIWowIcon('face')} alt="Face Reading" className={styles.icon} />
          </div>
          <p className={styles.description}>
            AI-powered palm reading analysing life, heart, fate and head lines
          </p>
        </div>
      </div>
    </div>
  );
};

export default PalmFaceSection;
