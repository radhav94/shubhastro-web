import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuraLanding.module.scss';

const AuraLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Aura Color Detection',
      description: 'Discover the dominant colors in your aura and what they reveal about your energy',
    },
    {
      title: 'Energy Analysis',
      description: 'Understand your current energy state and emotional vibrations',
    },
    {
      title: 'Chakra Alignment',
      description: 'Get insights into your chakra balance and energy flow',
    },
    {
      title: 'Spiritual Insights',
      description: 'Receive personalized guidance based on your aura reading and birth chart',
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
        <h1 className={styles.title}>AI Powered Aura Photography</h1>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Capture and analyze your aura to reveal your energy field, emotional state, and spiritual essence. Combine ancient wisdom with modern AI technology for deep insights.
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
          onClick={() => navigate('/aiwow/aura/instructions')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
  );
};

export default AuraLanding;
