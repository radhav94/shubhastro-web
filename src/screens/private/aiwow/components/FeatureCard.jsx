import React from 'react';
import styles from './FeatureCard.module.scss';
import { getAIWowIcon } from '../../../../utils/appImages';

const FeatureCard = ({ badge, badgeType, title, description, icon, onStartNow, largeIcon }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        {badge && (
          <span className={`${styles.badge} ${styles[badgeType]}`}>
            {badge}
          </span>
        )}
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <button className={styles.startButton} onClick={onStartNow}>
          Start Now
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className={`${styles.iconWrapper} ${largeIcon ? styles.largeIcon : ''}`}>
        <img src={getAIWowIcon(icon)} alt={title} className={styles.icon} />
      </div>
    </div>
  );
};

export default FeatureCard;
