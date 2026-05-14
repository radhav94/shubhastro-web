import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FaceReadingLanding.module.scss';
import SmileIcon from '../../../../assets/icons/Smile.png';
import CakeIcon from '../../../../assets/icons/Cake.png';
import FlowerIcon from '../../../../assets/icons/Flower.png';
import ContactsIcon from '../../../../assets/icons/Contacts.png';
import Footer from '../../../../layouts/Footer';
import TTSButton from '../../../../component/UI/TTSButton';
const FaceReadingLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/astro-face-reading");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  if (!localStorage.getItem("shubhtalk_customer_token")) return null;

  const features = [
    {
      icon: SmileIcon,
      title: 'Emotion Recognition',
      description: 'Identify and interpret human emotions through facial expressions in real-time',
    },
    {
      icon: CakeIcon,
      title: 'Facial features',
      description: 'Analyze facial features to uncover personality traits, emotional patterns, and insights about an individuals character.'
    },
    {
      icon: FlowerIcon,
      title: 'Aura Reading',
      description: 'Analyze auras to reveal insights about your personality, emotional state, and spiritual well-being.',
    },
    {
      icon: ContactsIcon,
      title: 'Character Insights',
      description: 'Gain deep insights into your character, strengths and potential areas for personal growth through detailed face analysis.',
    },
  ];

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>AI Powered Face Reading</h1>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Use AI Face Reading to reveal hidden aspects of yourself. Get personalized insights into your personality and potential through facial analysis.
        </p>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`${[feature?.title, feature?.description].filter(Boolean).join('. ')}`} />
              </span>
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
          onClick={() => navigate('/astro-face-reading/instructions')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
    <Footer />
</>
  );
};

export default FaceReadingLanding;
