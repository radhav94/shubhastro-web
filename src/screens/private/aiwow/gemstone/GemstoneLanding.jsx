import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GemstoneLanding.module.scss';
import ClarityIcon from '../../../../assets/icons/clarity.png';
import ColorGradingIcon from '../../../../assets/icons/colorgrading.png';
import CutPrecisionIcon from '../../../../assets/icons/curprecision.png';
import TTSButton from '../../../../component/UI/TTSButton';
import CaratIcon from '../../../../assets/icons/carat.png';
import Footer from '../../../../layouts/Footer';

const GemstoneLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      localStorage.setItem("shubhtalk_redirect_after_login", "/gemstone-authenticity");
      window.location.href = "/login?skip=welcome";
    }
  }, []);

  if (!localStorage.getItem("shubhtalk_customer_token")) return null;
  const features = [
    {
      icon: ClarityIcon,
      title: 'Clarity Analysis',
      description: 'Assess gemstone clarity to reveal its inner beauty and potential market value.',
    },
    {
      icon: ColorGradingIcon,
      title: 'Color Grading',
      description: 'Evaluate color saturation to determine rarity and aesthetic appeal.',
    },
    {
      icon: CutPrecisionIcon,
      title: 'Cut Precision',
      description: 'Determine light performance based on the precision of angles and facets.',
    },
    {
      icon: CaratIcon,
      title: 'Carat Weight',
      description: 'Assess gemstone size and density to determine value and rarity.',
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
        <h1 className={styles.title}>Gemstone Authenticity</h1>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Unlock the value of your gemstones with our AI Gemstone Authenticity Check, which analyzes the unique characteristics of your gemstone to reveal insights about its quality, rarity, and potential market value.
        </p>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className={styles.iconWrapper}>
                    <img src={feature.icon} alt={feature.title} className={styles.featureIcon} />
                  </div>
                  <span style={{ marginLeft: 'auto', display: 'flex' }}>
                    <TTSButton text={`${[feature?.title,feature?.description].filter(Boolean).join('. ')}`} />
                  </span>
                </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        <button 
          className={styles.proceedButton}
          onClick={() => navigate('/gemstone-authenticity/instructions')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default GemstoneLanding;
