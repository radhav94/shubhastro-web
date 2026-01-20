import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FaceReadingResult.module.scss';
import { Toast } from '../../../../component';

const FaceReadingResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the analysis result from localStorage
    const storedResult = localStorage.getItem('faceReadingResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        
        // Transform API response to match display format
        if (parsedResult.data) {
          const apiData = parsedResult.data;
          const transformedData = transformFaceData(apiData);
          setAnalysisData(transformedData);
        } else {
          setAnalysisData(parsedResult);
        }
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/face-reading/instructions');
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/face-reading/instructions');
    }
    
    setLoading(false);
  }, [navigate]);

  // Transform API response to display format
  const transformFaceData = (apiData) => {
    const personality = apiData.personalityAnalysis || {};
    const auraColors = apiData.auraColors || {};
    
    return {
      overall: [
        {
          category: 'Leadership',
          strength: personality.leadership?.level || 'Strong',
          percentage: personality.leadership?.score || 80,
          description: personality.leadership?.description || 'Natural leadership qualities with strategic thinking.',
        },
        {
          category: 'Analytical Mind',
          strength: personality.analyticalMind?.level || 'Excellent',
          percentage: personality.analyticalMind?.score || 90,
          description: personality.analyticalMind?.description || 'Exceptional logical reasoning and systematic approach.',
        },
        {
          category: 'Communication',
          strength: personality.communication?.level || 'Good',
          percentage: personality.communication?.score || 70,
          description: personality.communication?.description || 'Clear, concise, and honest communication style.',
        },
        {
          category: 'Intuition',
          strength: personality.intuition?.level || 'Strong',
          percentage: personality.intuition?.score || 70,
          description: personality.intuition?.description || 'Strong inner world and intuitive knowing.',
        },
      ],
      personality: [
        {
          category: 'Emotional Intelligence',
          strength: personality.emotionalIntelligence?.level || 'Very Good',
          percentage: personality.emotionalIntelligence?.score || 75,
          description: personality.emotionalIntelligence?.description || 'Ability to perceive nuances and process feelings thoughtfully.',
        },
        {
          category: 'Creativity',
          strength: personality.creativity?.level || 'Good',
          percentage: personality.creativity?.score || 65,
          description: personality.creativity?.description || 'Strong capacity for innovative problem-solving.',
        },
      ],
      aura: [
        {
          category: auraColors.primary?.color || 'Blue',
          strength: 'Primary',
          percentage: auraColors.primary?.percentage || 45,
          description: auraColors.primary?.meaning || 'Connection to truth, communication, and calm.',
        },
        {
          category: auraColors.secondary?.color || 'Gold',
          strength: 'Secondary',
          percentage: auraColors.secondary?.percentage || 30,
          description: auraColors.secondary?.meaning || 'Wisdom and spiritual understanding.',
        },
        {
          category: auraColors.tertiary?.color || 'Green',
          strength: 'Tertiary',
          percentage: auraColors.tertiary?.percentage || 15,
          description: auraColors.tertiary?.meaning || 'Connection to nature and healing.',
        },
      ],
    };
  };

  const tabs = [
    { id: 'overall', label: 'Overall Analysis' },
    { id: 'personality', label: 'Personality Analysis' },
    { id: 'aura', label: 'Aura Reading' },
  ];

  // Default data structure (fallback)
  const defaultData = {
    overall: [
      {
        category: 'Leadership',
        strength: 'Very Strong',
        percentage: 90,
        description: 'You are driven, independent, and naturally inclined to take charge and create your own path.',
      },
      {
        category: 'Teamwork',
        strength: 'Strong',
        percentage: 85,
        description: 'You collaborate effectively, valuing input from others while also contributing your own ideas.',
      },
      {
        category: 'Adaptability',
        strength: 'Moderate',
        percentage: 70,
        description: 'You adjust well to change but may need time to fully embrace new situations or strategies.',
      },
    ],
    personality: [
      {
        category: 'Emotional Intelligence',
        strength: 'Very Strong',
        percentage: 92,
        description: 'You have exceptional ability to understand and manage emotions, both yours and others.',
      },
      {
        category: 'Creativity',
        strength: 'Strong',
        percentage: 85,
        description: 'You possess strong creative abilities and innovative thinking patterns.',
      },
    ],
    aura: [
      {
        category: 'Energy Level',
        strength: 'Strong',
        percentage: 88,
        description: 'Your aura indicates high energy levels and positive vibrations.',
      },
      {
        category: 'Spiritual Awareness',
        strength: 'Moderate',
        percentage: 75,
        description: 'You show good spiritual awareness with room for deeper exploration.',
      },
    ],
  };

  // Use API data if available, otherwise use default data
  const displayData = analysisData || defaultData;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>AI Powered Face Reading</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.resultHeader}>
          <h2 className={styles.resultTitle}>Result</h2>
          <p className={styles.resultSubtitle}>Your personalized face reading report is ready!</p>
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
          {displayData[activeTab]?.map((item, index) => (
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

export default FaceReadingResult;
