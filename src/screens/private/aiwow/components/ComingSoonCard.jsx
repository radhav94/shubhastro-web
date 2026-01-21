import React from 'react';
import styles from './ComingSoonCard.module.scss';
import { getAIWowIcon } from '../../../../utils/appImages';

const ComingSoonCard = ({ title, description, icon }) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <img src={getAIWowIcon(icon)} alt={title} className={styles.icon} />
      </div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

export default ComingSoonCard;
