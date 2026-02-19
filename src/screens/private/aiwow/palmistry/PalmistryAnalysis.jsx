import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './PalmistryAnalysis.module.scss';
import { Toast } from '../../../../component';
import { analyzePalm } from '../../../../services/appServices/aiWowService';
import { setPalmistryResult, setPalmistryResultId, clearPalmistryData } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';

const PalmistryAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const palmImage = useSelector((state) => state.aiwow.palmistry.image);
  const selectedHand = useSelector((state) => state.aiwow.palmistry.selectedHand);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (palmImage && selectedHand) {
      performAnalysis(palmImage, selectedHand);
    } else {
      navigate(PATH.privateRoutes.PALMISTRY_HAND_SELECTION.path);
      return;
    }
  }, [palmImage, selectedHand, navigate]);

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
        const resultId = result.data?.id || result.data?._id;
        
        if (resultId) {
          // Store result in Redux
          dispatch(setPalmistryResult(result.data));
          dispatch(setPalmistryResultId(resultId));
          
          setProgress(100);
          setAnalysisComplete(true);
          
          setTimeout(() => {
            navigate(`${PATH.privateRoutes.PALMISTRY_RESULT.path}/${resultId}`);
          }, 1000);
        } else {
          // Fallback: Store result without ID
          dispatch(setPalmistryResult(result.data));
          
          setProgress(100);
          setAnalysisComplete(true);
          
          setTimeout(() => {
            navigate(PATH.privateRoutes.PALMISTRY_RESULT.path);
          }, 1000);
        }
      } else {
        // DON'T clear data on error - keep image and hand selection for retry
        // dispatch(clearPalmistryData());
        
        setProgress(0);
        // Don't show Toast here - interceptor already showed it
        // Just display the error details on screen
        setError(result.error || { message: 'Analysis failed. Please try again.' });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // DON'T clear data on error - keep image and hand selection for retry
      // dispatch(clearPalmistryData());
      
      setProgress(0);
      // Don't show Toast here - interceptor already showed it
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate(PATH.privateRoutes.PALMISTRY_RESULT.path);
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearPalmistryData());
    navigate(PATH.privateRoutes.PALMISTRY_HAND_SELECTION.path);
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
              {/* <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.max(0, progress - 20)}%` }}
                ></div>
              </div> */}
            </div>

            <div className={styles.messageSection}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.sparkleIcon}>
                <path d="M20 5L22.5 15L30 17.5L22.5 20L20 30L17.5 20L10 17.5L17.5 15L20 5Z" fill="#1f2937"/>
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
