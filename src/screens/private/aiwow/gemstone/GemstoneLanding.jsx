import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GemstoneLanding.module.scss';

const GemstoneLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Clarity Analysis',
      description: 'Assess gemstone clarity to reveal its inner beauty and potential market value.',
    },
    {
      title: 'Color Grading',
      description: 'Evaluate color saturation to determine rarity and aesthetic appeal.',
    },
    {
      title: 'Cut Precision',
      description: 'Determine light performance based on the precision of angles and facets.',
    },
    {
      title: 'Carat Weight',
      description: 'Assess gemstone size and density to determine value and rarity.',
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Gemstone Authenticity</h1>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Unlock the value of your gemstones with our AI Gemstone Authenticity Check, which analyzes the unique characteristics of your gemstone to reveal insights about its quality, rarity, and potential market value.
        </p>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        <button 
          className={styles.proceedButton}
          onClick={() => navigate('/aiwow/gemstone/instructions')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
  );
};

export default GemstoneLanding;
