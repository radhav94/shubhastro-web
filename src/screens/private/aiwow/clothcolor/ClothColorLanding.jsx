import { useNavigate } from 'react-router-dom';
import styles from './ClothColorLanding.module.scss';

const ClothColorLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Aura Spectrum',
      description: 'Analyze the dominant colors to reveal the wearer\'s personality traits.',
    },
    {
      title: 'Vibrancy Index',
      description: 'Measure color intensity to reflect the wearer\'s energy and mood.',
    },
    {
      title: 'Pattern Psychology',
      description: 'Understand how patterns mirror the wearer\'s inner self and aspirations.',
    },
    {
      title: 'Style Archetype',
      description: 'Determine the wearer\'s unique style archetype based on color preferences.',
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
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
            <div key={index} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        <button 
          className={styles.proceedButton}
          onClick={() => navigate('/aiwow/cloth-color/form')}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
  );
};

export default ClothColorLanding;
