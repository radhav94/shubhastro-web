import React from 'react';
import styles from './ComingSoonCard.module.scss';
import { getAIWowIcon } from '../../../../utils/appImages';

const ComingSoonCard = ({ title, description, icon }) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <div className={styles.iconBackground}>
          <img src={getAIWowIcon(icon)} alt={title} className={styles.icon} />
        </div>
      </div>
      
      <div className={styles.content}>
        <span className={styles.badge}>Coming Soon</span>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.lockIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
};

export default ComingSoonCard;
