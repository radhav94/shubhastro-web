import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClothColorForm.module.scss';
import { Toast } from '../../../../component';

const ClothColorForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    analysisDate: new Date().toISOString().split('T')[0],
    intention: 'career_success',
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIntentionSelect = (intentionId) => {
    setFormData(prev => ({
      ...prev,
      intention: intentionId
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.dateOfBirth) {
      Toast.error('Please enter your date of birth');
      return;
    }
    
    if (!formData.placeOfBirth) {
      Toast.error('Please enter your place of birth');
      return;
    }

    // Check if date is not in future
    const selectedDate = new Date(formData.dateOfBirth);
    const today = new Date();
    if (selectedDate > today) {
      Toast.error('Date of birth cannot be in the future');
      return;
    }

    // Store form data in localStorage
    localStorage.setItem('clothColorFormData', JSON.stringify(formData));
    
    // Navigate to instructions
    navigate('/aiwow/cloth-color/instructions');
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
          We need your birth information for accurate astrological calculations
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Date of Birth */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.labelIcon}>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={styles.input}
              required
              max={new Date().toISOString().split('T')[0]}
            />
            <p className={styles.hint}>Date cannot be in the future</p>
          </div>

          {/* Time of Birth */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.labelIcon}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Time of Birth (Optional)
            </label>
            <input
              type="time"
              name="timeOfBirth"
              value={formData.timeOfBirth}
              onChange={handleInputChange}
              className={styles.input}
            />
            <p className={styles.hint}>More accurate results with birth time</p>
          </div>

          {/* Place of Birth */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.labelIcon}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Place of Birth *
            </label>
            <input
              type="text"
              name="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={handleInputChange}
              placeholder="City, Country"
              className={styles.input}
              required
            />
          </div>

          {/* Analysis Date */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Analysis Date</label>
            <input
              type="date"
              name="analysisDate"
              value={formData.analysisDate}
              onChange={handleInputChange}
              className={styles.input}
            />
            <p className={styles.hint}>Date for which you want color recommendations</p>
          </div>

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
