import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './GemstoneAnalysis.module.scss';
import { analyzeGemstone } from '../../../../services/appServices/aiWowService';
import { setGemstoneResult, clearGemstoneData, setGemstoneImage } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';

const GemstoneAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gemstoneImage = useSelector((state) => state.aiwow.gemstone.image);
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'gemstone-scanner' });

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

  /*
    Inline answer for a blocked tap on this screen's two action buttons.

    Both were rendered with a native `disabled`, and handleGenerateAnalysis
    answered every blocker with a bare `return`. A natively disabled button emits
    no click event at all, so a tap on it produced nothing: no feedback for the
    visitor, and in Clarity it scores as a dead click with nothing to attribute it
    to. That is worst here, on the LAST step of a flow the visitor has already
    spent minutes on — capture or upload a photo, then this.

    Ported from PalmistryAnalysis, which was converted first against Clarity
    session phtszy ("Use Photo" at 03:12, "Generate analysis" at 03:25, session
    over) and is the settled pattern: aria-disabled keeps the inert look while the
    button still fires, and the reason is written next to the control rather than
    sent to a toast. react-hot-toast renders top-right while these actions sit
    near the bottom of a full-viewport screen, and Clarity cannot see toasts at
    all.

    `seq` is bumped on every announcement so a repeated reason still remounts the
    node: replay sees a DOM mutation and screen readers re-announce.
  */
  const [actionNotice, setActionNotice] = useState(null);
  const noticeSeqRef = useRef(0);

  const announceActionNotice = (text) => {
    noticeSeqRef.current += 1;
    setActionNotice({ seq: noticeSeqRef.current, text });
  };

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

    if (!gemstoneImage) {
      navigate(PATH.privateRoutes.GEMSTONE_LANDING.path[0], { replace: true });
      return;
    }

    // Auto-start analysis as soon as the image and profile are ready so the
    // user isn't shown an extra confirmation screen after capture/upload.
    if (profile && !hasStartedRef.current && !isAnalyzing && !analysisComplete) {
      hasStartedRef.current = true;
      setError(null);
      performAnalysis(gemstoneImage);
    }
  }, [gemstoneImage, profile, profileLoading]);

  const performAnalysis = async (imageData) => {
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

      // Call the API with abort signal
      const result = await runWithEntitlement(() => analyzeGemstone(imageData, abortController.signal));

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
        dispatch(clearGemstoneData());
        navigate(PATH.privateRoutes.GEMSTONE_LANDING.path[0], { replace: true });
        return;
      }

      if (result.success) {
        dispatch(setGemstoneResult(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        // Only navigate if component is still mounted
        setTimeout(() => {
          if (isMountedRef.current) {
            navigate(PATH.privateRoutes.GEMSTONE_RESULT.path[0], { replace: true });
          } else {
            console.log('Component unmounted - skipping navigation to result');
          }
        }, 1000);
      } else {
        // DON'T clear data on error - keep image for retry
        // dispatch(clearGemstoneData());
        
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
      
      // DON'T clear data on error - keep image for retry
      // dispatch(clearGemstoneData());
      
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

  /*
    Every blocker used to be a bare `return`, behind a button that was also
    natively disabled — so the tap neither fired nor explained itself. Each one
    now names itself. `profileLoading` is a state the visitor can wait out, so it
    says so and stays put; the other two are already navigating elsewhere by the
    time they are reachable, so the page change is the feedback.
  */
  const handleGenerateAnalysis = () => {
    if (isAnalyzing) {
      announceActionNotice('Already reading your gemstone — one moment.');
      return;
    }
    if (analysisComplete) {
      handleShowResult();
      return;
    }
    if (profileLoading) {
      announceActionNotice('Loading your birth details — one moment.');
      return;
    }
    if (!profile) {
      // useSelectedKundliProfile is used here with `required: true`, so by the
      // time this is reachable it has already toasted and started a replace-
      // navigation to /ai-wow. Don't toast twice; just don't swallow the tap.
      announceActionNotice('Taking you back to pick your birth details.');
      return;
    }
    if (!gemstoneImage) {
      // The mount effect normally redirects before this can be reached; if the
      // image went missing afterwards, go back to capture rather than ignore the
      // tap. The route change is the feedback.
      handleRetakePicture();
      return;
    }
    setActionNotice(null);
    hasStartedRef.current = true;
    setError(null);
    performAnalysis(gemstoneImage);
  };

  const handleRetakePicture = () => {
    // Clear only the captured image and go back to the landing screen.
    dispatch(setGemstoneImage(null));
    navigate(PATH.privateRoutes.GEMSTONE_LANDING.path[0], { replace: true });
  };

  const handleShowResult = () => {
    if (analysisComplete && !isNavigating) {
      setIsNavigating(true);
      navigate(PATH.privateRoutes.GEMSTONE_RESULT.path[0], { replace: true });
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearGemstoneData());
    navigate(PATH.privateRoutes.GEMSTONE_LANDING.path[0], { replace: true });
  };

  const handleBack = () => {
    dispatch(clearGemstoneData());
    navigate(PATH.privateRoutes.GEMSTONE_LANDING.path[0], { replace: true });
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
          <h1 className={styles.headerTitle}>Gemstone Authenticity</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.pageTitle}>
          {error ? 'Analysis Failed' : 'Analysing gemstone'}
        </h2>
        <div className={styles.middleContent}>
        <div className={styles.leftSection}>
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
                    <h3 className={styles.checkTitle}>Verify Certification</h3>
                    <p className={styles.checkDescription}>Ensure the gemstone comes with a valid certification from a recognized authority.</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Inspect Clarity</h3>
                    <p className={styles.checkDescription}>Evaluate the clarity of the gemstone to determine its quality and authenticity.</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Examine Cut Quality</h3>
                    <p className={styles.checkDescription}>Assess the cut of the gemstone for precision and craftsmanship, which contribute to its value.</p>
                  </div>
                </div>
              </div>

              <div className={styles.disclaimer}>
                <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                <p className={styles.disclaimerText}>
                  This gemstone authenticity check is for informational purposes only and should not replace professional appraisal. Our analysis is powered by advanced AI.
                </p>
              </div>

              {/* Above the buttons, so the answer is next to the control that
                  was tapped. See announceActionNotice. */}
              {actionNotice && (
                <p
                  key={actionNotice.seq}
                  className={styles.actionNotice}
                  role="status"
                  aria-live="polite"
                >
                  {actionNotice.text}
                </p>
              )}

              <div className={styles.actionButtons}>
                <button
                  className={styles.retakeButton}
                  onClick={handleRetakePicture}
                >
                  Retake picture
                </button>
                {/*
                  aria-disabled, not `disabled`. The dimming stays so the state is
                  still visible, but the button keeps firing so
                  handleGenerateAnalysis can explain the blocker. `cursor` is back
                  to pointer for the same reason — 'not-allowed' on a control that
                  does respond would be a lie, and it does nothing on touch anyway.
                */}
                <button
                  className={styles.resultButton}
                  onClick={handleGenerateAnalysis}
                  aria-disabled={!profile || profileLoading}
                  style={{ opacity: (!profile || profileLoading) ? 0.6 : 1 }}
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
                <h3 className={styles.message}>Hold tight as we are analysing your gemstone</h3>
              </div>

              {actionNotice && (
                <p
                  key={actionNotice.seq}
                  className={styles.actionNotice}
                  role="status"
                  aria-live="polite"
                >
                  {actionNotice.text}
                </p>
              )}

              {/*
                aria-disabled, not `disabled`. The label already reads
                "Analysing..." while the work is in flight, but a natively disabled
                button emits no click at all, so someone tapping it to ask "is this
                actually going?" got nothing — during the longest wait in the flow.
                It stays tappable and answers.
              */}
              <button 
                className={styles.resultButton}
                onClick={() => {
                  if (isNavigating) {
                    announceActionNotice('Opening your reading — one moment.');
                    return;
                  }
                  if (!analysisComplete) {
                    announceActionNotice('Still reading your gemstone. This can take a few moments.');
                    return;
                  }
                  handleShowResult();
                }}
                aria-disabled={!analysisComplete || isNavigating}
                aria-busy={isAnalyzing || isNavigating || undefined}
                style={{ opacity: (analysisComplete && !isNavigating) ? 1 : 0.6 }}
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

export default GemstoneAnalysis;
