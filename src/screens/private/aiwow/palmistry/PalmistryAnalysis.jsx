import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './PalmistryAnalysis.module.scss';
import { analyzePalm } from '../../../../services/appServices/aiWowService';
import { setPalmistryResult, setPalmistryResultId, clearPalmistryData } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import BackButton from '../../../../component/UI/BackButton/BackButton';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';

const PalmistryAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const palmImage = useSelector((state) => state.aiwow.palmistry.image);
  const selectedHand = useSelector((state) => state.aiwow.palmistry.selectedHand);
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'palmistry' });

  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({
    required: true,
    showToast: true,
    redirectPath: '/ai-palmistry-scanner',
  });

  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  
  // Track component mount status to prevent navigation after unmount
  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef(null);
  const hasStartedRef = React.useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (profileLoading) return; // Wait for profile to load

    if (!palmImage || !selectedHand) {
      navigate(PATH.privateRoutes.PALMISTRY_HAND_SELECTION.path[0]);
      return;
    }

    if (profile && !isAnalyzing && !analysisComplete && !error) {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;
      performAnalysis(palmImage, selectedHand);
    }
  }, [palmImage, selectedHand, profile, profileLoading]);

  const performAnalysis = async (imageData, hand) => {
    setIsAnalyzing(true);
    
    // Create AbortController to cancel request on unmount
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
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

      // Call the API with hand parameter and abort signal
      const result = await runWithEntitlement(() => analyzePalm(imageData, hand, abortController.signal));

      clearInterval(progressInterval);

      // Check if component is still mounted before processing result
      if (!isMountedRef.current) {
        console.log('Component unmounted - ignoring API result');
        return;
      }

      // Entitlement block handled by the gate (plans popup / recharge toast).
      if (result.blocked) {
        setProgress(0);
        setIsAnalyzing(false);
        setError({ message: 'Choose a plan to continue with your report.' });
        return;
      }

      if (result.success) {
        const resultId = result.data?.id || result.data?._id;
        
        if (resultId) {
          // Store result in Redux
          dispatch(setPalmistryResult(result.data));
          dispatch(setPalmistryResultId(resultId));
          
          setProgress(100);
          setAnalysisComplete(true);
          
          // Only navigate if component is still mounted
          setTimeout(() => {
            if (isMountedRef.current) {
              navigate(`${PATH.privateRoutes.PALMISTRY_RESULT.path[0]}/${resultId}`, { replace: true });
            } else {
              console.log('Component unmounted - skipping navigation to result');
            }
          }, 1000);
        } else {
          // Fallback: Store result without ID
          dispatch(setPalmistryResult(result.data));
          
          setProgress(100);
          setAnalysisComplete(true);
          
          // Only navigate if component is still mounted
          setTimeout(() => {
            if (isMountedRef.current) {
              navigate(PATH.privateRoutes.PALMISTRY_RESULT.path[0], { replace: true });
            } else {
              console.log('Component unmounted - skipping navigation to result');
            }
          }, 1000);
        }
      } else {
        // DON'T clear data on error - keep image and hand selection for retry
        // dispatch(clearPalmistryData());
        
        setProgress(0);
        // Don't show Toast here - interceptor already showed it
        // Show generic error to users
        const errMsg = result.error;
        const userMessage = (typeof errMsg === 'string' && (
          errMsg.includes('GoogleGenerativeAI') || errMsg.includes('googleapis') ||
          errMsg.includes('Too Many Requests') || errMsg.includes('prepayment') ||
          errMsg.includes('Error fetching') || errMsg.includes('INTERNAL') ||
          errMsg.length > 100
        )) ? 'Something went wrong. Please try again.' : (errMsg || 'Analysis failed. Please try again.');
        setError({ message: typeof userMessage === 'string' ? userMessage : 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      // Ignore abort errors - user navigated away
      if (error.name === 'AbortError' || error.message === 'canceled') {
        console.log('API request aborted - user navigated away');
        return;
      }

      // Check if component is still mounted before showing error
      if (!isMountedRef.current) {
        console.log('Component unmounted - ignoring error');
        return;
      }

      console.error('Analysis error:', error);
      
      // DON'T clear data on error - keep image and hand selection for retry
      // dispatch(clearPalmistryData());
      
      setProgress(0);
      // Don't show Toast here - interceptor already showed it
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleShowResult = () => {
    if (analysisComplete && !isNavigating) {
      setIsNavigating(true);
      navigate(PATH.privateRoutes.PALMISTRY_RESULT.path[0], { replace: true });
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearPalmistryData());
    navigate(PATH.privateRoutes.PALMISTRY_HAND_SELECTION.path[0]);
  };

  const handleBack = () => {
    dispatch(clearPalmistryData());
    navigate('/ai-wow/ai-palmistry-scanner/hand-selection', { replace: true });
  };

  return (
    <div className={styles.container}>
      <BackButton onClick={handleBack} disabled={isAnalyzing} />
      <div className={styles.content}>
        <div className={styles.leftSection}>
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
              <h3 className={styles.message}>Hold tight as we are analysing your palm</h3>
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
      {subscriptionModal}
    </div>
  );
};

export default PalmistryAnalysis;
