import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './AuraAnalysis.module.scss';
import { analyzeAura } from '../../../../services/appServices/aiWowService';
import { setAuraResult, clearAuraData, setAuraImage } from '../../../../redux/aiwow/aiwowSlice';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';

const AuraAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auraImage = useSelector((state) => state.aiwow.aura.image);
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'aura-photography' });
  
  // Use the hook to get selected Kundli profile with error handling
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({
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
  // Set when an entitlement block sends the user back to the landing step, so
  // the `finally` below doesn't briefly flip back to the pre-analysis checklist
  // while the route change is in flight.
  const leavingRef = React.useRef(false);

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
        navigate(PATH.privateRoutes.AURA_LANDING.path[0], { replace: true });
        return;
      }

      hasStartedRef.current = true;
      performAnalysis(auraImage);
    } else if (!auraImage && !isAnalyzing && !analysisComplete && !error && !profileLoading) {
      // Only redirect if we don't have an image and we're not in the middle of anything
      console.warn('No aura image found in Redux state, redirecting to landing');
      navigate(PATH.privateRoutes.AURA_LANDING.path[0], { replace: true });
    }
  }, [auraImage, profile, profileLoading]); // Depend on profile and profileLoading

  const performAnalysis = async (imageData) => {
    // Double-check profile is available before API call
    if (!profile) {
      Toast.error('Profile not available. Please select a profile.');
      navigate(PATH.privateRoutes.AIWOW?.path || '/ai-wow', { replace: true });
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

      // Pass the generate call through the entitlement gate. It auto-purchases
      // the extended pack (and retries) or opens the plans popup when the
      // backend blocks generation on subscription/quota.
      const result = await runWithEntitlement(() => analyzeAura(imageData, abortController.signal));

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

      // Entitlement block handled by the gate (plans popup / recharge toast).
      // Once the user closes the subscription modal, start fresh from the first
      // step (landing screen). We intentionally do NOT flip back to the
      // pre-analysis checklist here — that would flash "this screen" before the
      // route changes. Clearing the data + navigating unmounts us straight away.
      if (result.blocked) {
        leavingRef.current = true;
        hasStartedRef.current = false;
        dispatch(clearAuraData());
        // The gate already routed to /recharge — don't override that redirect.
        if (!result.redirectedToRecharge) {
          navigate(PATH.privateRoutes.AURA_LANDING.path[0], { replace: true });
        }
        return;
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
      // Skip when we're navigating away after an entitlement block — flipping
      // isAnalyzing back to false would flash the pre-analysis checklist.
      if (isMountedRef.current && !leavingRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleGenerateAnalysis = () => {
    if (isAnalyzing || analysisComplete) return;
    if (!auraImage || !profile) return;
    hasStartedRef.current = true;
    setError(null);
    performAnalysis(auraImage);
  };

  const handleRetakePicture = () => {
    // Clear only the captured image and go back to the landing screen.
    dispatch(setAuraImage(null));
    navigate(PATH.privateRoutes.AURA_LANDING.path[0], { replace: true });
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
    navigate(PATH.privateRoutes.AURA_LANDING.path[0], { replace: true });
  };

  const handleBack = () => {
    dispatch(clearAuraData());
    navigate(PATH.privateRoutes.AURA_LANDING.path[0], { replace: true });
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack} disabled={isAnalyzing}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.headerTitle}>AI Powered Aura Photography</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.pageTitle}>
          {error ? 'Analysis Failed' : 'Analysing your aura'}
        </h2>
        <div className={styles.middleContent}>
        <div className={styles.leftSection}>
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
          !isAnalyzing && !analysisComplete ? (
            <>
              <div className={styles.checklistSection}>
                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Good Lighting</h3>
                    <p className={styles.checkDescription}>Ensure your room is well-lit for accurate aura capture</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Neutral Background</h3>
                    <p className={styles.checkDescription}>Stand against a plain background for best results</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Camera Permission</h3>
                    <p className={styles.checkDescription}>Allow camera access when prompted</p>
                  </div>
                </div>
              </div>

              <div className={styles.disclaimer}>
                <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                <p className={styles.disclaimerText}>
                  This aura analysis is for informational and spiritual guidance purposes only. The analysis combines AI technology with astrological principles to provide insights about your energy field and emotional state.
                </p>
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={styles.retakeButton}
                  onClick={handleRetakePicture}
                >
                  Retake picture
                </button>
                <button
                  className={styles.resultButton}
                  onClick={handleGenerateAnalysis}
                  disabled={!profile || profileLoading}
                  style={{ opacity: (!profile || profileLoading) ? 0.6 : 1, cursor: (!profile || profileLoading) ? 'not-allowed' : 'pointer' }}
                >
                  Generate analysis
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
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
          )
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
      {subscriptionModal}
    </div>
  );
};

export default AuraAnalysis;
