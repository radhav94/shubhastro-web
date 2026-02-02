import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PalmistryAnalysis.module.scss';
import { Toast } from '../../../../component';
import { analyzePalm } from '../../../../services/appServices/aiWowService';

const PalmistryAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [palmImage, setPalmImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHand, setSelectedHand] = useState('');

  useEffect(() => {
    // Get the captured/uploaded image from localStorage
    const storedImage = localStorage.getItem('palmistryImage');
    const hand = localStorage.getItem('selectedHand');
    
    if (storedImage && hand) {
      setPalmImage(storedImage);
      setSelectedHand(hand);
      performAnalysis(storedImage, hand);
    } else {
      // If no image or hand selection, silently redirect back
      navigate('/aiwow/palmistry/hand-selection');
      return;
    }
  }, [navigate]);

  const performAnalysis = async (imageData, hand) => {
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

      // Call the API with hand parameter
      const result = await analyzePalm(imageData, hand);

      clearInterval(progressInterval);

      if (result.success) {
        localStorage.setItem('palmistryResult', JSON.stringify(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        setTimeout(() => {
          navigate('/aiwow/palmistry/result');
        }, 1000);
      } else {
        setProgress(0);
        setError(result.error || { message: 'Analysis failed. Please try again.' });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setProgress(0);
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/palmistry/result');
    }
  };

  const handleRetry = () => {
    setError(null);
    navigate('/aiwow/palmistry/hand-selection');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {error ? 'Analysis Failed' : 'Analysing Palm'}
        </h2>

        <div className={styles.imagesWrapper}>
          <div className={styles.imageWrapper}>
            {palmImage ? (
              <>
                <img 
                  src={palmImage} 
                  alt="Palm being analyzed" 
                  className={styles.palmImage}
                />
                <div className={styles.handLabel}>
                  {selectedHand === 'left' ? 'Left hand Palm' : 'Right hand Palm'}
                </div>
              </>
            ) : (
              <div className={styles.imagePlaceholder}>Loading image...</div>
            )}
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>
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
              <div className={styles.progressText}>{progress}%</div>
            </div>

            <div className={styles.messageSection}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.sparkleIcon}>
                <path d="M20 5L22.5 15L30 17.5L22.5 20L20 30L17.5 20L10 17.5L17.5 15L20 5Z" fill="url(#orangeGradient)"/>
                <defs>
                  <linearGradient id="orangeGradient" x1="10" y1="5" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/>
                    <stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
              <h3 className={styles.message}>Hold tight as we are analysing your palm</h3>
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
                  
                  {error.details.handProvided && (
                    <div className={styles.errorDetailItem}>
                      <strong>Hand Provided:</strong>
                      <p>{error.details.handProvided}</p>
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

export default PalmistryAnalysis;
