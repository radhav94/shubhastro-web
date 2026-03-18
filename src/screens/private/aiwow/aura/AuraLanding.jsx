import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuraLanding.module.scss';
import SmileIcon from '../../../../assets/icons/Smile.png';
import EnergyLevelsIcon from '../../../../assets/icons/energylevels.png';
import ChakraIcon from '../../../../assets/icons/chakra.png';
import AuraSizeIcon from '../../../../assets/icons/aurasize.png';
import Footer from '../../../../layouts/Footer';

const AuraLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: SmileIcon,
      title: 'Aura Color Detection',
      description: 'Discover the dominant colors in your aura and what they reveal about your energy',
    },
    {
      icon: EnergyLevelsIcon,
      title: 'Energy Analysis',
      description: 'Understand your current energy state and emotional vibrations',
    },
    {
      icon: ChakraIcon,
      title: 'Chakra Alignment',
      description: 'Get insights into your chakra balance and energy flow',
    },
    {
      icon: AuraSizeIcon,
      title: 'Spiritual Insights',
      description: 'Receive personalized guidance based on your aura reading and birth chart',
    },
  ];

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>AI Powered Aura Photography</h1>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Capture and analyze your aura to reveal your energy field, emotional state, and spiritual essence. Combine ancient wisdom with modern AI technology for deep insights.
        </p>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <img src={feature.icon} alt={feature.title} className={styles.featureIcon} />
              </div>
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
    <Footer />
    </>
  );
};

export default AuraLanding;
