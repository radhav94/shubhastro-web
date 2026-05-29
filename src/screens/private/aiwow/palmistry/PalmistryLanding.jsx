import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PalmistryLanding.module.scss';
import PalmLineIcon from '../../../../assets/icons/palmline.png';
import PalmMountIcon from '../../../../assets/icons/palmmount.png';
import CakeIcon from '../../../../assets/icons/Cake.png';
import LoveIcon from '../../../../assets/icons/loveIcon.png';


const PalmistryLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/ai-palmistry-scanner");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  if (!localStorage.getItem("shubhtalk_customer_token")) return null;
  const features = [
    {
      icon: PalmLineIcon,
      title: 'Palm Line Analysis',
      description: 'Examine the major lines on the palm to determine aspects of personality and destiny.',
    },
    {
      icon: PalmMountIcon,
      title: 'Mount Identification',
      description: 'Identify the mounts on the palm that indicate strengths and challenges in various life areas.',
    },
    {
      icon: CakeIcon,
      title: 'Career and Life',
      description: 'Gain insights into your career path and life journey based on key personal and astrological indicators.',
    },
    {
      icon: LoveIcon,
      title: 'Relationship',
      description: 'Evaluate relationship compatibility by analysing the palm prints of two individuals.',
    },
  ];

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
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
          onClick={() => navigate('/ai-palmistry-scanner/hand-selection')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
    </>
  );
};

export default PalmistryLanding;
