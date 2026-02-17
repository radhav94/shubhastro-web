import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './GemstoneAnalysis.module.scss';
import { analyzeGemstone } from '../../../../services/appServices/aiWowService';
import { setGemstoneResult, clearGemstoneData } from '../../../../redux/aiwow/aiwowSlice';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';

const GemstoneAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gemstoneImage = useSelector((state) => state.aiwow.gemstone.image);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (gemstoneImage) {
      performAnalysis(gemstoneImage);
    } else {
      navigate(PATH.privateRoutes.GEMSTONE_INSTRUCTIONS.path);
      return;
    }
  }, [navigate, gemstoneImage]);

  const performAnalysis = async (imageData) => {
    setIsAnalyzing(true);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90% until API responds
          }
          return prev + 5;
        });
      }, 200);

      // Call the API
      const result = await analyzeGemstone(imageData);

      clearInterval(progressInterval);

      if (result.success) {
        dispatch(setGemstoneResult(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        setTimeout(() => {
          navigate(PATH.privateRoutes.GEMSTONE_RESULT.path);
        }, 1000);
      } else {
        // DON'T clear data on error - keep image for retry
        // dispatch(clearGemstoneData());
        
        setProgress(0);
        setError(result.error || { message: 'Analysis failed. Please try again.' });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // DON'T clear data on error - keep image for retry
      // dispatch(clearGemstoneData());
      
      setProgress(0);
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate(PATH.privateRoutes.GEMSTONE_RESULT.path);
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearGemstoneData());
    navigate(PATH.privateRoutes.GEMSTONE_INSTRUCTIONS.path);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {error ? 'Analysis Failed' : 'Analysing gemstone'}
        </h2>

        <div className={styles.imageWrapper}>
          {gemstoneImage ? (
            <img 
              src={gemstoneImage} 
              alt="Gemstone being analyzed" 
              className={styles.gemstoneImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>Loading image...</div>
          )}
          <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
          <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
          <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
          <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
        </div>

        {!error ? (
          <>
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.max(0, progress - 20)}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.messageSection}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.sparkleIcon}>
                <path d="M20 5L22.5 15L30 17.5L22.5 20L20 30L17.5 20L10 17.5L17.5 15L20 5Z" fill="#1f2937"/>
              </svg>
              <h3 className={styles.message}>Hold tight as we are analysing your gemstone</h3>
            </div>

            <button 
              className={styles.resultButton}
              onClick={handleShowResult}
              disabled={!analysisComplete}
              style={{ opacity: analysisComplete ? 1 : 0.6 }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Show Result'}
            </button>
          </>
        ) : (
          <div className={styles.errorSection}>
            <div className={styles.errorIcon}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#ef4444" strokeWidth="2" fill="none"/>
                <path d="M32 20V36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="32" cy="44" r="2" fill="#ef4444"/>
              </svg>
            </div>

            <div className={styles.errorDetails}>
              <h3 className={styles.errorMessage}>{error.message}</h3>
              
              {error.details && (
                <div className={styles.errorDetailsBox}>
                  {error.details.detectedIssue && (
                    <div className={styles.errorDetailItem}>
                      <strong>Issue Detected:</strong>
                      <p>{error.details.detectedIssue}</p>
                    </div>
                  )}
                  
                  {error.details.expected && (
                    <div className={styles.errorDetailItem}>
                      <strong>Expected:</strong>
                      <p>{error.details.expected}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              className={styles.retryButton}
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GemstoneAnalysis;
