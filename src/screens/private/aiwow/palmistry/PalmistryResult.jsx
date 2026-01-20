import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PalmistryResult.module.scss';

const PalmistryResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');

  const tabs = [
    { id: 'overall', label: 'Overall Analysis' },
    { id: 'personality', label: 'Personality Analysis' },
    { id: 'career', label: 'Career Insights' },
  ];

  const analysisData = {
    overall: [
      {
        category: 'Life Line',
        strength: 'Very Strong',
        percentage: 90,
        description: 'You possess strong vitality and resilience. Your life line indicates good health and a long, fulfilling life journey.',
      },
      {
        category: 'Heart Line',
        strength: 'Strong',
        percentage: 85,
        description: 'You have deep emotional capacity and form meaningful relationships. Your heart line shows warmth and compassion.',
      },
      {
        category: 'Head Line',
        strength: 'Moderate',
        percentage: 70,
        description: 'You have balanced thinking patterns. Your head line suggests practical intelligence with creative potential.',
      },
    ],
    personality: [
      {
        category: 'Leadership',
        strength: 'Very Strong',
        percentage: 90,
        description: 'You are driven, independent, and naturally inclined to take charge and create your own path.',
      },
      {
        category: 'Creativity',
        strength: 'Strong',
        percentage: 85,
        description: 'You have strong creative abilities and innovative thinking patterns.',
      },
    ],
    career: [
      {
        category: 'Professional Growth',
        strength: 'Strong',
        percentage: 85,
        description: 'Your palm indicates strong potential for career advancement and professional success.',
      },
    ],
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>AI Powered Palm Reading</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.resultHeader}>
          <h2 className={styles.resultTitle}>Result</h2>
          <p className={styles.resultSubtitle}>Your personalized palm reading report is ready!</p>
        </div>

        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.analysisSection}>
          {analysisData[activeTab].map((item, index) => (
            <div key={index} className={styles.analysisCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.category}>{item.category}</p>
                  <h3 className={styles.strength}>{item.strength}</h3>
                </div>
                <div className={styles.percentage}>{item.percentage}%</div>
              </div>
              <p className={styles.description}>{item.description}</p>
            </div>
          ))}
        </div>

        <button className={styles.detailButton}>
          Get Detailed Report
        </button>
      </div>
    </div>
  );
};

export default PalmistryResult;
