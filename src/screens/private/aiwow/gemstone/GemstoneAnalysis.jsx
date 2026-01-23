import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GemstoneAnalysis.module.scss';
import { analyzeGemstone } from '../../../../services/appServices/aiWowService';
import { Toast } from '../../../../component';

/**
 * Helper to normalize error to a string (bulletproof)
 */
const getErrorMessage = (error) => {
  if (!error) return 'Analysis failed. Please try again.';
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    // Handle nested error structures
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    if (error.error?.message && typeof error.error.message === 'string') {
      return error.error.message;
    }
    // Fallback for any object
    return 'Analysis failed. Please try again.';
  }
  
  return 'Analysis failed. Please try again.';
};

const GemstoneAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [gemstoneImage, setGemstoneImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Get the captured/uploaded image from localStorage
    const storedImage = localStorage.getItem('gemstoneImage');
    if (storedImage) {
      setGemstoneImage(storedImage);
      performAnalysis(storedImage);
    } else {
      // If no image, redirect back to instructions
      Toast.error('No image found. Please capture or upload an image.');
      navigate('/aiwow/gemstone/instructions');
      return;
    }
  }, [navigate]);

  const performAnalysis = async (imageData) => {
    let progressInterval = null;
    
    try {
      // Start progress animation
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            return 90; // Stop at 90% until API responds
          }
          return prev + 5;
        });
      }, 200);

      // Call the API
      const result = await analyzeGemstone(imageData);

      // Clear interval
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (result?.success && result?.data) {
        // Store the analysis result
        localStorage.setItem('gemstoneResult', JSON.stringify(result?.data || {}));
        
        // Complete progress
        setProgress(100);
        setAnalysisComplete(true);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          navigate('/aiwow/gemstone/result');
        }, 1000);
      } 
      else {
        // Handle API error response
        setProgress(0);
        setHasError(true);
        
        // CRITICAL: Always convert to string immediately to prevent React render errors
        const errorMsg = String(getErrorMessage(result?.error || result));
        setErrorMessage(errorMsg);
        
        console.error('API returned error:', result);
        
        // Service already showed toast, just navigate back
        setTimeout(() => {
          navigate('/aiwow/gemstone/instructions');
        }, 3000);
      }
    } catch (error) {
      // Clear interval if still running
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      console.error('Analysis exception:', error);
      
      // CRITICAL: Extract error message and convert to string immediately
      const axiosMessage = String(
        error?.response?.data?.message ||
        error?.message ||
        'An unexpected error occurred.'
      );
      
      // Update state to show error UI
      setProgress(0);
      setHasError(true);
      setErrorMessage(axiosMessage);
      
      // Service already showed toast
      
      setTimeout(() => {
        navigate('/aiwow/gemstone/instructions');
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/gemstone/result');
    }
  };

  console.log('hasError :>> ', hasError);
  console.log('gemstoneImage :>> ', gemstoneImage);
  console.log('progress :>> ', progress);
  console.log('errorMessage :>> ', errorMessage);
  console.log('errorMessage type :>> ', typeof errorMessage);
  console.log('analysisComplete :>> ', analysisComplete);
  console.log('isAnalyzing :>> ', isAnalyzing);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {hasError ? 'Analysis Failed' : 'Analysing gemstone'}
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

        {!hasError && (
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
        )}

        <div className={styles.messageSection}>
          {hasError ? (
            <>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.errorIcon}>
                <circle cx="20" cy="20" r="18" stroke="#ef4444" strokeWidth="2" fill="none"/>
                <path d="M20 12V22" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="20" cy="28" r="1.5" fill="#ef4444"/>
              </svg>
              <h3 className={styles.message}>
                {typeof errorMessage === 'string' ? errorMessage : 'Failed to analyze gemstone'}
              </h3>
              <p className={styles.subMessage}>Redirecting back to try again...</p>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.sparkleIcon}>
                <path d="M20 5L22.5 15L30 17.5L22.5 20L20 30L17.5 20L10 17.5L17.5 15L20 5Z" fill="#1f2937"/>
              </svg>
              <h3 className={styles.message}>Hold tight as we are analysing your gemstone</h3>
            </>
          )}
        </div>

        <button 
          className={styles.resultButton}
          onClick={hasError ? () => navigate('/aiwow/gemstone/instructions') : handleShowResult}
          disabled={!analysisComplete && !hasError}
          style={{ opacity: (analysisComplete || hasError) ? 1 : 0.6 }}
        >
          {hasError ? 'Try Again' : isAnalyzing ? 'Analyzing...' : 'Show Result'}
        </button>
      </div>
    </div>
  );
};

export default GemstoneAnalysis;
