import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './ClothColorAnalysis.module.scss';
import { analyzeClothColor } from '../../../../services/appServices/aiWowService';
import { setClothColorResult, clearClothColorData, setClothColorImage } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import BackButton from '../../../../component/UI/BackButton/BackButton';
import { countFacesInImage } from '../../../../utils/helper/detectFaces';

// Session flag: set while an analysis is in progress / not yet successful, so a
// page reload doesn't auto re-analyze the same image (which would trigger a
// fresh paid analysis). Capture screens clear it on a fresh capture.
export const CLOTH_COLOR_ANALYSIS_FLAG = 'clothColorAnalysisStarted';

const ClothColorAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const clothImage = useSelector((state) => state.aiwow.clothColor.image);
  const formData = useSelector((state) => state.aiwow.clothColor.formData);
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'clothes-color' });

  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({
    required: true,
    showToast: true,
    redirectPath: PATH.privateRoutes.AI_WOW?.path || '/ai-wow',
  });

  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const hasStartedRef = useRef(false);
  // Set when an entitlement block sends the user back to the landing step, so
  // the `finally` below doesn't briefly flip back to the pre-analysis checklist
  // while the route change is in flight.
  const leavingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (profileLoading) return;

    if (!clothImage) {
      navigate(PATH.privateRoutes.CLOTH_COLOR_LANDING.path[0]);
      return;
    }

    // Auto-start analysis as soon as the image and profile are ready so the
    // user isn't shown an extra confirmation screen after capture/upload.
    if (profile && !hasStartedRef.current && !isAnalyzing && !analysisComplete) {
      hasStartedRef.current = true;
      setError(null);
      performAnalysis(clothImage);
    }
  }, [clothImage, profile, profileLoading]);

  const performAnalysis = async (imageData) => {
    setIsAnalyzing(true);

    // Reject images with more than one person — cloth colour analysis expects a
    // single subject. (A photo with 0 detectable faces, e.g. torso-only, is
    // allowed; detection failure fails open so we never wrongly block a user.)
    const faceCount = await countFacesInImage(imageData);
    if (faceCount > 1) {
      if (isMountedRef.current) {
        setIsAnalyzing(false);
        setProgress(0);
        setError({ message: 'Multiple people detected in the photo. Please use an image with only one person.' });
      }
      return;
    }

    // Create AbortController to cancel request on unmount
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      // Get form data from Redux
      const birthData = formData || null;

      const result = await runWithEntitlement(() => analyzeClothColor(imageData, birthData, abortController.signal));

      clearInterval(progressInterval);

      // Check if component is still mounted before processing result
      if (!isMountedRef.current) {
        console.log('Component unmounted - ignoring API result');
        return;
      }

      // Entitlement block handled by the gate (plans popup / recharge toast).
      // Once the user closes the subscription modal, start fresh from the first
      // step (landing screen). We intentionally do NOT flip back to the
      // pre-analysis checklist here — that would flash "this screen" before the
      // route changes. Clearing the data + navigating unmounts us straight away.
      if (result.blocked) {
        leavingRef.current = true;
        hasStartedRef.current = false;
        dispatch(clearClothColorData());
        // The gate already routed to /recharge — don't override that redirect.
        if (!result.redirectedToRecharge) {
          navigate(PATH.privateRoutes.CLOTH_COLOR_LANDING.path[0], { replace: true });
        }
        return;
      }

      if (result.success) {
        dispatch(setClothColorResult(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        // Only navigate if component is still mounted
        setTimeout(() => {
          if (isMountedRef.current) {
            navigate(PATH.privateRoutes.CLOTH_COLOR_RESULT.path[0], { replace: true });
          } else {
            console.log('Component unmounted - skipping navigation to result');
          }
        }, 1000);
      } else {
        // DON'T clear data on error - keep image and form data for retry
        // dispatch(clearClothColorData());
        
        setProgress(0);
        setError({ message: 'Something went wrong. Please try again.' });
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
      
      // DON'T clear data on error - keep image and form data for retry
      // dispatch(clearClothColorData());
      
      setProgress(0);
      setError({ message: 'An unexpected error occurred. Please try again.' });
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
    if (!clothImage || !profile) return;
    hasStartedRef.current = true;
    setError(null);
    performAnalysis(clothImage);
  };

  const handleRetakePicture = () => {
    // Clear only the captured image and go back to the instructions screen.
    dispatch(setClothColorImage(null));
    navigate(PATH.privateRoutes.CLOTH_COLOR_INSTRUCTIONS.path[0]);
  };

  const handleShowResult = () => {
    if (analysisComplete && !isNavigating) {
      setIsNavigating(true);
      navigate(PATH.privateRoutes.CLOTH_COLOR_RESULT.path[0], { replace: true });
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearClothColorData());
    navigate(PATH.privateRoutes.CLOTH_COLOR_LANDING.path[0]);
  };

  const handleBack = () => {
    dispatch(clearClothColorData());
    navigate(PATH.privateRoutes.CLOTH_COLOR_INSTRUCTIONS.path[0], { replace: true });
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
          <h1 className={styles.headerTitle}>Colour Clothes Analysis</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.pageTitle}>
          {error ? 'Analysis Failed' : 'Analysing Clothes'}
        </h2>
        <div className={styles.middleContent}>
        <div className={styles.leftSection}>
          <div className={styles.imageWrapper}>
            {clothImage ? (
              <img 
                src={clothImage} 
                alt="Clothes being analyzed" 
                className={styles.clothImage}
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
                    <h3 className={styles.checkTitle}>Analyze Wardrobe Choices</h3>
                    <p className={styles.checkDescription}>Examine how the choice of clothing colors reflects personal traits and moods.</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Identify Color Preferences</h3>
                    <p className={styles.checkDescription}>Explore which colors individuals gravitate towards and what they signify about their personality.</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Assess Seasonal Impact</h3>
                    <p className={styles.checkDescription}>Consider how seasonal color trends influence personal style and self-expression.</p>
                  </div>
                </div>
              </div>

              <div className={styles.disclaimer}>
                <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                <p className={styles.disclaimerText}>
                  This color analysis is for informational purposes only and is not a substitute for professional style advice. Our insights are generated using advanced algorithms.
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
                <h3 className={styles.message}>Hold tight as we are analysing your clothes</h3>
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

export default ClothColorAnalysis;
