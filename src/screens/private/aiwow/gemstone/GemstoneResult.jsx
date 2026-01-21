import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GemstoneResult.module.scss';
import { Toast } from '../../../../component';

const GemstoneResult = () => {
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the analysis result from localStorage
    const storedResult = localStorage.getItem('gemstoneResult');
    const storedImage = localStorage.getItem('gemstoneImage');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        
        // Extract data from API response
        const apiData = parsedResult.data || parsedResult;
        
        setResultData({
          image: apiData.gemstoneImage || storedImage,
          gemstoneName: apiData.gemstoneIdentification?.name || 'Gemstone',
          gemstoneHindiName: apiData.gemstoneIdentification?.hindiName || '',
          authenticityScore: apiData.suitabilityAnalysis?.score || apiData.confidenceScore || 80,
          summary: apiData.overallReading?.summary || 'This gemstone appears to be authentic based on our AI analysis.',
          detailedAnalysis: apiData.overallReading?.recommendation || 'Our gemologists have carefully analyzed your gemstone using state-of-the-art technology and industry-leading practices.',
          gemstoneDetails: apiData.gemstoneDetails || {},
          astrologicalProperties: apiData.astrologicalProperties || {},
          wearingGuidelines: apiData.wearingGuidelines || {},
        });
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/gemstone/instructions');
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/gemstone/instructions');
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
        <h1 className={styles.title}>Gemstone Authenticity</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.resultHeader}>
          <h2 className={styles.resultTitle}>Result</h2>
          <p className={styles.resultSubtitle}>Your personalized gemstone authentication report is ready!</p>
        </div>

        <div className={styles.gemstoneImageWrapper}>
          <img 
            src={resultData.image} 
            alt="Gemstone" 
            className={styles.gemstoneImage}
          />
        </div>

        <div className={styles.authenticitySection}>
          <h3 className={styles.authenticityTitle}>
            Your {resultData.gemstoneName.toLowerCase()} gemstone is
          </h3>
          <div className={styles.authenticityScore}>
            {resultData.authenticityScore}% authentic
          </div>
        </div>

        <div className={styles.reportSection}>
          <p className={styles.reportText}>
            {resultData.summary}
          </p>
          <p className={styles.reportText}>
            {resultData.detailedAnalysis}
          </p>
        </div>

        <button className={styles.detailButton}>
          Get Detailed Report
        </button>
      </div>
    </div>
  );
};

export default GemstoneResult;
