import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ClothColorForm.module.scss';
import { Toast } from '../../../../component';
import { setClothColorFormData } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';

const ClothColorForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const [formData, setFormData] = useState({
    intention: 'career_success',
  });

  // Check if profile is selected from Redux
  useEffect(() => {
    if (!selectedProfile) {
      Toast.error('Please select a Kundli profile first from AI WOW main page');
      navigate(PATH.privateRoutes.AIWOW.path);
    }
  }, [selectedProfile, navigate]);

  const intentions = [
    {
      id: 'career_success',
      icon: '💼',
      title: 'Career & Success',
      description: 'Professional meetings, interviews, work',
    },
    {
      id: 'love_relationships',
      icon: '💕',
      title: 'Love & Relationships',
      description: 'Dates, social events, romance',
    },
    {
      id: 'peace_calm',
      icon: '🧘',
      title: 'Peace & Calm',
      description: 'Meditation, relaxation, stress relief',
    },
    {
      id: 'focus_study',
      icon: '📚',
      title: 'Focus & Study',
      description: 'Learning, concentration, mental clarity',
    },
    {
      id: 'energy_confidence',
      icon: '⚡',
      title: 'Energy & Confidence',
      description: 'Motivation, enthusiasm, boldness',
    },
  ];

  const handleIntentionSelect = (intentionId) => {
    setFormData(prev => ({
      ...prev,
      intention: intentionId
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Store form data in Redux
    dispatch(setClothColorFormData(formData));
    
    // Navigate to instructions
    navigate(PATH.privateRoutes.CLOTH_COLOR_INSTRUCTIONS.path);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Colour Clothes Analysis</h1>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Select your intention for the day to get personalized color recommendations
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Your Intention */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Intention</label>
            <div className={styles.intentionsGrid}>
              {intentions.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  className={`${styles.intentionCard} ${formData.intention === intent.id ? styles.selected : ''}`}
                  onClick={() => handleIntentionSelect(intent.id)}
                >
                  <span className={styles.intentionIcon}>{intent.icon}</span>
                  <div className={styles.intentionContent}>
                    <h3 className={styles.intentionTitle}>{intent.title}</h3>
                    <p className={styles.intentionDescription}>{intent.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClothColorForm;
