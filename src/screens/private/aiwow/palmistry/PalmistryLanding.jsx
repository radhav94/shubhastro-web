import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PalmistryLanding.module.scss';

const PalmistryLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Palm Line Analysis',
      description: 'Examine the major lines on the palm to determine aspects of personality and destiny.',
    },
    {
      title: 'Mount Identification',
      description: 'Identify the mounts on the palm that indicate strengths and challenges in various life areas.',
    },
    {
      title: 'Age Prediction',
      description: 'Estimate the age of individuals based on the characteristics of their palm features.',
    },
    {
      title: 'Compatibility Assessment',
      description: 'Evaluate relationship compatibility by analysing the palm prints of two individuals.',
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Palmistry Scanner</h1>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Explore your destiny with our Palmistry Scanner, which analyzes the lines and shapes of your hands to provide guidance on your life path and relationships.
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
          onClick={() => navigate('/aiwow/palmistry/hand-selection')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
  );
};

export default PalmistryLanding;
