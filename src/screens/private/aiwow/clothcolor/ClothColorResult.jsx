import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClothColorResult.module.scss';
import { Toast } from '../../../../component';

const ClothColorResult = () => {
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResult = localStorage.getItem('clothColorResult');
    const storedImage = localStorage.getItem('clothColorImage');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        const apiData = parsedResult.data || parsedResult;
        
        setResultData({
          image: apiData.clothesImage || storedImage,
          matchPercentage: apiData.auraMatchScore || apiData.matchPercentage || 50,
          analysis: apiData.analysis || apiData.summary || 'Unfortunately, your clothes clash with your aura. This report highlights the colors that detract from your natural radiance and suggests alternative shades to enhance your overall appearance.',
        });
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/cloth-color/instructions');
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/cloth-color/instructions');
    }
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return null;
  }

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
        <div className={styles.resultHeader}>
          <h2 className={styles.resultTitle}>Result</h2>
          <p className={styles.resultSubtitle}>Your personalized colour clothes analysis report is ready!</p>
        </div>

        <div className={styles.clothImageWrapper}>
          <img 
            src={resultData.image} 
            alt="Analyzed clothes" 
            className={styles.clothImage}
          />
        </div>

        <div className={styles.matchSection}>
          <h3 className={styles.matchTitle}>Your clothes match</h3>
          <div className={styles.matchPercentage}>
            {resultData.matchPercentage}% of your aura.
          </div>
        </div>

        <div className={styles.analysisSection}>
          <p className={styles.analysisText}>
            {resultData.analysis}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClothColorResult;
