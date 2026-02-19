import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './SignatureAnalysis.module.scss';
import { Toast } from '../../../../component';
import { analyzeSignature } from '../../../../services/appServices/aiWowService';
import { setSignatureResult, clearSignatureData } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';

const SignatureAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const signatureImage = useSelector((state) => state.aiwow.signature.image);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (signatureImage) {
      performAnalysis(signatureImage);
    } else {
      navigate(PATH.privateRoutes.SIGNATURE_INSTRUCTIONS.path);
      return;
    }
  }, [navigate, signatureImage]);

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
      const result = await analyzeSignature(imageData);

      clearInterval(progressInterval);

      if (result.success) {
        dispatch(setSignatureResult(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        setTimeout(() => {
          navigate(PATH.privateRoutes.SIGNATURE_RESULT.path);
        }, 1000);
      } else {
        // DON'T clear data on error - keep image for retry
        // dispatch(clearSignatureData());
        
        setProgress(0);
        setError(result.error || { message: 'Analysis failed. Please try again.' });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // DON'T clear data on error - keep image for retry
      // dispatch(clearSignatureData());
      
      setProgress(0);
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate(PATH.privateRoutes.SIGNATURE_RESULT.path);
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearSignatureData());
    navigate(PATH.privateRoutes.SIGNATURE_INSTRUCTIONS.path);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {error ? 'Analysis Failed' : 'Analysing Signature'}
        </h2>

        <div className={styles.imageWrapper}>
          {signatureImage ? (
            <img 
              src={signatureImage} 
              alt="Signature being analyzed" 
              className={styles.signatureImage}
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
              <h3 className={styles.message}>Hold tight as we are analysing your signature</h3>
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

export default SignatureAnalysis;
