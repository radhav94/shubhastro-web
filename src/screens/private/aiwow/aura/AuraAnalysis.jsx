import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './AuraAnalysis.module.scss';
import { analyzeAura } from '../../../../services/appServices/aiWowService';
import { setAuraResult, clearAuraData } from '../../../../redux/aiwow/aiwowSlice';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import BackButton from '../../../../component/UI/BackButton/BackButton';

const AuraAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auraImage = useSelector((state) => state.aiwow.aura.image);
  
  // Use the hook to get selected Kundli profile with error handling
  const { profile, isLoading: profileLoading, error: profileError } = useSelectedKundliProfile({
    required: true,
    showToast: true,
    redirectPath: PATH.privateRoutes.AIWOW?.path || '/ai-wow',
  });
  
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = React.useRef(true); // Track if component is mounted
  const abortControllerRef = React.useRef(null); // Store abort controller
  const hasStartedRef = React.useRef(false);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Cleanup function to prevent navigation after unmount and abort API request
    return () => {
      isMountedRef.current = false;
      console.log('AuraAnalysis unmounting - aborting API request');
      
      // Do NOT abort here — request should complete even if component unmounts
    };
  }, []);

  useEffect(() => {
    // Only run analysis if we have both image and profile, and haven't started yet
    if (auraImage && profile && !profileLoading && !isAnalyzing && !analysisComplete && !error) {
      if (hasStartedRef.current) return;
      // Validate image format
      if (typeof auraImage !== 'string' || !auraImage.startsWith('data:image/')) {
        console.error('Invalid image format in Redux state:', typeof auraImage);
        Toast.error('Invalid image format. Please try again.');
        dispatch(clearAuraData());
        navigate(PATH.privateRoutes.AURA_INSTRUCTIONS.path[0]);
        return;
      }

      hasStartedRef.current = true;
      performAnalysis(auraImage);
    } else if (!auraImage && !isAnalyzing && !analysisComplete && !error && !profileLoading) {
      // Only redirect if we don't have an image and we're not in the middle of anything
      console.warn('No aura image found in Redux state, redirecting to instructions');
      navigate(PATH.privateRoutes.AURA_INSTRUCTIONS.path[0], { replace: true });
    }
  }, [auraImage, profile, profileLoading]); // Depend on profile and profileLoading

  const performAnalysis = async (imageData) => {
    // Double-check profile is available before API call
    if (!profile) {
      Toast.error('Profile not available. Please select a profile.');
      navigate(PATH.privateRoutes.AIWOW?.path || '/ai-wow');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    // Create AbortController to cancel request on unmount
    const abortController = new AbortController();
    abortControllerRef.current = abortController; // Store reference
    
    try {
      // Validate image data before sending
      if (!imageData || typeof imageData !== 'string') {
        throw new Error('Invalid image data');
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      // Pass only image data and abort signal to API
      const result = await analyzeAura(imageData, abortController.signal);

      clearInterval(progressInterval);

      // Check if component is still mounted before processing result
      if (!isMountedRef.current) {
        console.log('Component unmounted - ignoring API result');
        return;
      }

      // Validate API response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid API response format');
      }

      if (result.success) {
        // Validate result data exists
        if (!result.data) {
          console.error('API returned success but no data');
          throw new Error('No analysis data received from server');
        }

        // Store result in Redux
        dispatch(setAuraResult(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        // Only navigate if component is still mounted
        setTimeout(() => {
          if (isMountedRef.current) {
            navigate(PATH.privateRoutes.AURA_RESULT.path[0], { replace: true });
          } else {
            console.log('Component unmounted - skipping navigation to result');
          }
        }, 1000);
      } else {
        // DON'T clear data on error - keep image for retry
        // dispatch(clearAuraData());
        
        setProgress(0);
        
        // Handle structured error from API
        const errorMessage = result.error?.message || result.message || 'Analysis failed. Please try again.';
        const errorDetails = result.error?.details || null;
        
        // Don't show Toast here - interceptor already showed it
        // Just display the error details on screen
        setError({ 
          message: errorMessage,
          details: errorDetails
        });
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError' || error.message === 'canceled') {
        console.log('API request aborted - user navigated away');
        return;
      }

      console.error('Analysis error:', error);
      
      // Check if component is still mounted before showing error
      if (!isMountedRef.current) {
        console.log('Component unmounted - ignoring error');
        return;
      }
      
      // DON'T clear data on error - keep image for retry
      // dispatch(clearAuraData());
      
      setProgress(0);
      
      // Determine error message
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.message === 'Network Error' || error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message === 'Invalid image data') {
        errorMessage = 'Invalid image. Please capture a new image.';
      } else if (error.response?.status === 413) {
        errorMessage = 'Image file is too large. Please use a smaller image.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Something went wrong. Please try again later.';
      }
      
      // Don't show Toast here - interceptor already showed it
      setError({ message: errorMessage });
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleShowResult = () => {
    if (analysisComplete && !isNavigating) {
      setIsNavigating(true);
      navigate(PATH.privateRoutes.AURA_RESULT.path[0], { replace: true });
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearAuraData());
    navigate(PATH.privateRoutes.AURA_INSTRUCTIONS.path[0]);
  };

  return (
    <div className={styles.container}>
      <BackButton disabled={isAnalyzing} />
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <h2 className={styles.title}>
            {error ? 'Analysis Failed' : 'Analysing your aura'}
          </h2>

          <div className={styles.imageWrapper}>
            {auraImage ? (
              <img 
                src={auraImage} 
                alt="Aura being analyzed" 
                className={styles.auraImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>Loading image...</div>
            )}
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>
        </div>

        <div className={styles.rightSection}>
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
              <h3 className={styles.message}>Hold tight as we are analysing your aura</h3>
            </div>

            <button 
              className={styles.resultButton}
              onClick={handleShowResult}
              disabled={!analysisComplete || isNavigating}
              style={{ opacity: (analysisComplete && !isNavigating) ? 1 : 0.6, cursor: (!analysisComplete || isNavigating) ? 'not-allowed' : 'pointer' }}
            >
              {analysisComplete ? 'View Result' : 'Analysing...'}
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
    </div>
  );
};

export default AuraAnalysis;
