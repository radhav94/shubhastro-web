import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GemstoneAnalysis.module.scss';
import { analyzeGemstone } from '../../../../services/appServices/aiWowService';
import { Toast } from '../../../../component';

const GemstoneAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [gemstoneImage, setGemstoneImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    setIsAnalyzing(true);
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

      // Clear interval in all cases
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (result.success && result.data) {
        // Store the analysis result
        localStorage.setItem('gemstoneResult', JSON.stringify(result.data));
        
        // Complete progress
        setProgress(100);
        setAnalysisComplete(true);
        setIsAnalyzing(false);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          navigate('/aiwow/gemstone/result');
        }, 1000);
      } else {
        // Handle error - stop progress and show error
        setProgress(0);
        setIsAnalyzing(false);
        setHasError(true);
        
        const errorMsg = result.error || 'Analysis failed. Please try again.';
        setErrorMessage(errorMsg);
        
        // Show specific error message based on error code
        if (result.code === 'AI_ERROR') {
          Toast.error('Could not analyze this gemstone image. Please try with a clearer, well-lit photo.');
        } else if (result.code === 'TIMEOUT') {
          Toast.error('Analysis is taking too long. Please try again.');
        } else if (result.code === 'FILE_TOO_LARGE') {
          Toast.error('Image file is too large. Please use a smaller image.');
        } else if (result.code === 'INVALID_FORMAT') {
          Toast.error('Invalid image format. Please use JPG, PNG, or WEBP.');
        } else if (result.code === 'SERVER_ERROR') {
          Toast.error('Server error occurred. Please try again later.');
        } else {
          Toast.error(errorMsg);
        }
        
        // Navigate back to instructions after showing error
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
      
      console.error('Analysis error:', error);
      setProgress(0);
      setIsAnalyzing(false);
      Toast.error('An unexpected error occurred. Please try again.');
      
      setTimeout(() => {
        navigate('/aiwow/gemstone/instructions');
      }, 2000);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/gemstone/result');
    }
  };

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
              <h3 className={styles.message}>{errorMessage || 'Failed to analyze gemstone'}</h3>
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
