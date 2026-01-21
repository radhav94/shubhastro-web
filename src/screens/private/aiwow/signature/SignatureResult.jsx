import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignatureResult.module.scss';
import { Toast } from '../../../../component';

const SignatureResult = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the analysis result from localStorage
    const storedResult = localStorage.getItem('signatureResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        
        // Transform API response to match display format
        if (parsedResult.data) {
          const apiData = parsedResult.data;
          const transformedData = transformSignatureData(apiData);
          setAnalysisData(transformedData);
        } else {
          setAnalysisData(parsedResult);
        }
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/signature/instructions');
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/signature/instructions');
    }
    
    setLoading(false);
  }, [navigate]);

  // Transform API response to display format
  const transformSignatureData = (apiData) => {
    const personalityTraits = apiData.personalityInsights?.personalityTraits || [];
    const leadershipQualities = apiData.personalityInsights?.leadershipQualities || {};
    const detailedAnalysis = apiData.detailedAnalysis || {};
    
    return {
      overall: [
        ...personalityTraits.slice(0, 4).map(trait => ({
          category: trait.trait.charAt(0).toUpperCase() + trait.trait.slice(1),
          strength: getStrengthLabel(trait.score),
          percentage: trait.score,
          description: trait.description,
        }))
      ],
      personality: [
        {
          category: 'Leadership',
          strength: getStrengthLabel(leadershipQualities.score || 75),
          percentage: leadershipQualities.score || 75,
          description: leadershipQualities.description || 'Strong leadership potential with visionary thinking.',
        },
        {
          category: 'Communication',
          strength: 'Strong',
          percentage: 85,
          description: apiData.personalityInsights?.communicationStyle?.description || 'Expressive and articulate communication style.',
        },
      ],
      aura: [
        {
          category: 'Social Confidence',
          strength: getStrengthLabel(apiData.personalityInsights?.socialConfidence?.score || 80),
          percentage: apiData.personalityInsights?.socialConfidence?.score || 80,
          description: apiData.personalityInsights?.socialConfidence?.description || 'High social confidence and charisma.',
        },
        {
          category: 'Emotional Balance',
          strength: 'Balanced',
          percentage: 75,
          description: apiData.personalityInsights?.emotionalPatterns?.description || 'Balanced emotional patterns with resilience.',
        },
      ],
    };
  };

  const getStrengthLabel = (score) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Very Strong';
    if (score >= 70) return 'Strong';
    if (score >= 60) return 'Above Average';
    if (score >= 50) return 'Moderate';
    return 'Developing';
  };

  const tabs = [
    { id: 'overall', label: 'Overall Analysis' },
    { id: 'personality', label: 'Personality Analysis' },
    { id: 'aura', label: 'Aura' },
  ];

  // Default data structure (fallback)
  const defaultData = {
    overall: [
      {
        category: 'Creativity',
        strength: 'Exceptional',
        percentage: 95,
        description: 'You possess a vivid imagination and excel at thinking outside the box to develop unique solutions.',
      },
      {
        category: 'Intuition',
        strength: 'Very Strong',
        percentage: 92,
        description: 'You have a deep understanding of situations and people, often sensing things that others may overlook.',
      },
      {
        category: 'Empathy',
        strength: 'High',
        percentage: 88,
        description: 'You are highly attuned to the emotions of others, making you a supportive and understanding friend and colleague.',
      },
      {
        category: 'Resilience',
        strength: 'Above Average',
        percentage: 82,
        description: 'You bounce back from setbacks and view challenges as opportunities for growth.',
      },
    ],
    personality: [
      {
        category: 'Confidence',
        strength: 'Very Strong',
        percentage: 90,
        description: 'You display strong self-assurance in your abilities and decisions.',
      },
      {
        category: 'Adaptability',
        strength: 'Strong',
        percentage: 85,
        description: 'You adjust well to new situations and embrace change positively.',
      },
    ],
    aura: [
      {
        category: 'Energy',
        strength: 'High',
        percentage: 88,
        description: 'Your signature radiates positive energy and enthusiasm.',
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
        <h1 className={styles.title}>Signature Analysis Report</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.resultHeader}>
          <h2 className={styles.resultTitle}>Result</h2>
          <p className={styles.resultSubtitle}>Your personalized signature analysis report is ready!</p>
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

export default SignatureResult;
