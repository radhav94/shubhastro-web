import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignatureLanding.module.scss';
import StrokeIcon from '../../../../assets/icons/Stroke.png';
import PressureIcon from '../../../../assets/icons/pressure.png';
import LetterIcon from '../../../../assets/icons/letter.png';
import SignatureSizeIcon from '../../../../assets/icons/signauresize.png';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';

const SignatureLanding = () => {
  const navigate = useNavigate();
  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'signature-analysis')?.title || 'AI Signature Analysis';

  const handleProceed = () => {
    // Guests can browse freely; auth is requested at the photo capture/upload step.
    navigate('/ai-wow/signature-analysis/instructions');
  };
  const features = [
    {
      icon: StrokeIcon,
      title: 'Stroke Formation',
      description: 'Analyze stroke formation to reveal hidden talents and potential career paths.',
    },
    {
      icon: PressureIcon,
      title: 'Pressure Analysis',
      description: 'Evaluate pressure points to uncover emotional depth and communication style.',
    },
    {
      icon: LetterIcon,
      title: 'Letter Slant',
      description: 'Determine personality traits based on the slant and angle of letters.',
    },
    {
      icon: SignatureSizeIcon,
      title: 'Signature Size',
      description: 'Assess self-confidence and social presence by measuring signature size.',
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
          <h1 className={styles.title}>{featureTitle}</h1>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Unlock the secrets of your inner self with our AI Signature Analysis, which deciphers the unique patterns in your signature to reveal insights about your personality, strengths, and potential.
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
          onClick={handleProceed}
        >
          Proceed Ahead
        </button>
      </div>
    </div>
    </>
  );
};

export default SignatureLanding;
