import { useNavigate } from 'react-router-dom';
import styles from './ClothColorLanding.module.scss';
import AuraSpectrumIcon from '../../../../assets/icons/auraspectrum.png';
import VibrancyIcon from '../../../../assets/icons/vibrancy.png';
import PatternIcon from '../../../../assets/icons/pattern.png';
import StyleCaratIcon from '../../../../assets/icons/stylecarat.png';
import Footer from '../../../../layouts/Footer';
import TTSButton from '../../../../component/UI/TTSButton';

const ClothColorLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: AuraSpectrumIcon,
      title: 'Aura Spectrum',
      description: 'Analyze the dominant colors to reveal the wearer\'s personality traits.',
    },
    {
      icon: VibrancyIcon,
      title: 'Vibrancy Index',
      description: 'Measure color intensity to reflect the wearer\'s energy and mood.',
    },
    {
      icon: PatternIcon,
      title: 'Pattern Psychology',
      description: 'Understand how patterns mirror the wearer\'s inner self and aspirations.',
    },
    {
      icon: StyleCaratIcon,
      title: 'Style Archetype',
      description: 'Determine the wearer\'s unique style archetype based on color preferences.',
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
        <h1 className={styles.title}>Colour Clothes Analysis</h1>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Unlock the secrets of your style with AI Color Analysis, which connects your clothing's colors to your personality, revealing insights about your mood, energy, and style.
        </p>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }}>
                <TTSButton text={`${[feature?.title, feature.description].filter(Boolean).join('. ')}`} />
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
          onClick={() => navigate('/clothes-colour-analysis/form')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default ClothColorLanding;
