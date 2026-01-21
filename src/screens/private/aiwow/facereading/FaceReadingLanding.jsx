import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FaceReadingLanding.module.scss';

const FaceReadingLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Emotion Recognition',
      description: 'Identify and interpret human emotions through facial expressions in real-time',
    },
    {
      title: 'Age Estimation',
      description: 'Estimate age based on facial features with surprising accuracy.',
    },
    {
      title: 'Aura Reading',
      description: 'Analyze auras to reveal insights about your personality, emotional state, and spiritual well-being.',
    },
    {
      title: 'Character Insights',
      description: 'Gain deep insights into your character, strengths and potential areas for personal growth through detailed face analysis.',
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
        <h1 className={styles.title}>AI Powered Face Reading</h1>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Use AI Face Reading to reveal hidden aspects of yourself. Get personalized insights into your personality and potential through facial analysis.
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
          onClick={() => navigate('/aiwow/face-reading/instructions')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
  );
};

export default FaceReadingLanding;
