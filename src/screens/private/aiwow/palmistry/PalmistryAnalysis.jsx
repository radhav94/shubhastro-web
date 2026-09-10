import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './PalmistryAnalysis.module.scss';
import { analyzePalm } from '../../../../services/appServices/aiWowService';
import { setPalmistryResult, setPalmistryResultId, clearPalmistryData, setPalmistryImage, setPalmistrySelectedHand } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import Toast from '../../../../component/toast';

// Session flag: set while an analysis is in progress / not yet successful, so a
// page reload doesn't auto re-analyze a failed image. Shared with the capture
// screens so a fresh capture clears it.
export const PALMISTRY_ANALYSIS_FLAG = 'palmistryAnalysisStarted';

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

  /*
    Inline answer for a blocked tap on this screen's two action buttons.

    Every blocker in handleGenerateAnalysis was answered with Toast only. This is
    a full-viewport AI-Wow screen with its actions pinned near the bottom, while
    react-hot-toast renders top-right — and Clarity does not record toasts, so the
    tap read as dead both to the visitor and in the report. That matters more here
    than almost anywhere: this is the LAST step of a flow the visitor has already
    spent minutes on, and the same pattern is already used by FaceReadingCamera,
    PalmistryCamera and AuraCamera.

    Clarity session phtszy (Instagram WebView): "Use Photo" at 03:12, then
    "Generate analysis" at 03:25, then the session ended on
    /ai-wow/ai-palmistry-scanner/capture. Staying on that URL rules out the
    `!profile` branch, which navigates away — so the tap hit `profileLoading` or
    `isAnalyzing`, both of which toasted and stayed put.

    `seq` is bumped on every announcement so a repeated reason still remounts the
    node: replay sees a DOM mutation and screen readers re-announce.
  */
  const [actionNotice, setActionNotice] = useState(null);
  const noticeSeqRef = React.useRef(0);

  const announceActionNotice = (text) => {
    noticeSeqRef.current += 1;
    setActionNotice({ seq: noticeSeqRef.current, text });
  };
  
  // Track component mount status to prevent navigation after unmount
  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef(null);
  const hasStartedRef = React.useRef(false);
  // Set when an entitlement block sends the user back to the landing step, so
  // the `finally` below doesn't briefly flip back to the pre-analysis checklist
  // while the route change is in flight.
  const leavingRef = React.useRef(false);
  // Ensures we only auto-retry with the opposite hand once, to avoid a loop
  // when the image isn't a valid palm at all.
  const handSwapAttemptedRef = React.useRef(false);

  // The backend AI rejects the image when the detected palm side doesn't match
  // the selected hand (e.g. "please upload your left hand"). Hand-side detection
  // is unreliable (mirroring), so instead of blocking the user we transparently
  // re-run the analysis for the opposite hand.
  const isHandMismatchError = (err) => {
    const msg = (typeof err === 'string' ? err : err?.message || '').toLowerCase();
    if (!msg.includes('hand') && !msg.includes('palm')) return false;
    return (
      msg.includes('left') ||
      msg.includes('right') ||
      msg.includes('upload') ||
      msg.includes('other') ||
      msg.includes('different') ||
      msg.includes('match')
    );
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (profileLoading) return; // Wait for profile to load

    if (!palmImage || !selectedHand) {
      navigate(PATH.privateRoutes.PALMISTRY_LANDING.path[0], { replace: true });
      return;
    }

    // Auto-start analysis as soon as the image, hand and profile are ready so
    // the user isn't shown an extra confirmation screen after capture/upload.
    // The session flag guards against a page reload re-triggering a paid
    // analysis; capture screens clear it on a fresh capture.
    if (
      profile &&
      !hasStartedRef.current &&
      !isAnalyzing &&
      !analysisComplete &&
      !sessionStorage.getItem(PALMISTRY_ANALYSIS_FLAG)
    ) {
      hasStartedRef.current = true;
      sessionStorage.setItem(PALMISTRY_ANALYSIS_FLAG, '1');
      setError(null);
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
      // Once the user closes the subscription modal, start fresh from the first
      // step (landing screen). We intentionally do NOT flip back to the
      // pre-analysis checklist here — that would flash "this screen" before the
      // route changes. Clearing the data + navigating unmounts us straight away.
      if (result.blocked) {
        leavingRef.current = true;
        hasStartedRef.current = false;
        sessionStorage.removeItem(PALMISTRY_ANALYSIS_FLAG);
        dispatch(clearPalmistryData());
        navigate(PATH.privateRoutes.PALMISTRY_LANDING.path[0], { replace: true });
        return;
      }

      if (result.success) {
        // Analysis succeeded — clear the reload guard.
        sessionStorage.removeItem(PALMISTRY_ANALYSIS_FLAG);
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

        const errorCode = typeof result.error === 'object' ? result.error?.code : null;

        // INVALID_PALM_IMAGE means the photo itself isn't a usable palm (blurry,
        // fingers not visible, etc.) — this is NOT a hand-side mismatch, so never
        // auto-retry with the other hand. Surface the backend's guidance so the
        // user can retake the picture.
        if (errorCode === 'INVALID_PALM_IMAGE') {
          setProgress(0);
          const invalidMsg = (typeof result.error === 'object' && result.error?.message)
            ? result.error.message
            : 'Please upload a clear image of your palm with all fingers visible.';
          setError({ message: invalidMsg });
          return;
        }

        // Hand-side mismatch: the backend thinks this is the other hand.
        // Auto-retry once with the opposite hand so the user isn't blocked,
        // and update the stored selection so the result shows the right label.
        if (isHandMismatchError(result.error) && !handSwapAttemptedRef.current) {
          handSwapAttemptedRef.current = true;
          const otherHand = hand === 'left' ? 'right' : 'left';
          dispatch(setPalmistrySelectedHand(otherHand));
          setProgress(0);
          await performAnalysis(imageData, otherHand);
          return;
        }

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
      // Skip when we're navigating away after an entitlement block — flipping
      // isAnalyzing back to false would flash the pre-analysis checklist.
      if (isMountedRef.current && !leavingRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleRetakePicture = () => {
    // Clear only the captured image and go back to the instructions screen.
    // Keep the selected hand so hand selection is skipped.
    dispatch(setPalmistryImage(null));
    navigate('/ai-wow/ai-palmistry-scanner', { replace: true });
  };

  const handleShowResult = () => {
    if (analysisComplete && !isNavigating) {
      setIsNavigating(true);
      navigate(PATH.privateRoutes.PALMISTRY_RESULT.path[0], { replace: true });
    }
  };

  /*
    Every early exit here used to be a bare `return`, and the button was rendered
    `disabled` on top of that — so a blocked tap produced no click event, no
    message and no change of any kind. This is the last step of a flow the
    visitor has already spent minutes on (instructions, hand selection, capture
    or upload), which is why Clarity records dead clicks on it immediately after a
    photo upload.

    Each blocker now names itself. `profileLoading` is a state the visitor can
    simply wait out, so it explains and stays put; a genuinely missing profile is
    actionable, so it sends them somewhere they can pick one.

    Declared after handleRetakePicture and handleShowResult so neither is
    referenced while still in its temporal dead zone.
  */
  const handleGenerateAnalysis = () => {
    if (isAnalyzing) {
      announceActionNotice('Already reading your palm — one moment.');
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
      // This one navigates, so the page change is the feedback; the notice would
      // unmount immediately. Keep the toast for the destination screen.
      Toast.error('Select a birth profile first, then generate your reading.');
      navigate(PATH.privateRoutes.AI_WOW?.path || '/ai-wow');
      return;
    }
    if (!palmImage || !selectedHand) {
      // The mount effect normally redirects before this can be reached; if the
      // data went missing afterwards, say so rather than ignoring the tap.
      Toast.error('Your palm photo is missing. Please take it again.');
      handleRetakePicture();
      return;
    }

    setActionNotice(null);
    hasStartedRef.current = true;
    setError(null);
    performAnalysis(palmImage, selectedHand);
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    sessionStorage.removeItem(PALMISTRY_ANALYSIS_FLAG);
    setError(null);
    dispatch(clearPalmistryData());
    navigate(PATH.privateRoutes.PALMISTRY_LANDING.path[0], { replace: true });
  };

  const handleBack = () => {
    dispatch(clearPalmistryData());
    navigate('/ai-wow/ai-palmistry-scanner', { replace: true });
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          {/*
            aria-disabled, not `disabled`. Matches FaceReadingAnalysis, which was
            fixed first; this screen carried the identical defect.

            A disabled control fires no click at all, so while the analysis was
            running the back arrow — the only visible way off a screen that can
            sit on its progress state for a while — silently absorbed every tap.
            A dead click on an exit affordance is the worst kind: the visitor
            concludes the page is stuck.

            Stays tappable and says why it is not going anywhere yet. handleBack
            itself is unchanged.
          */}
          <button
            className={styles.backButton}
            onClick={() => {
              if (isAnalyzing) {
                announceActionNotice('Still reading your palm — one moment.');
                return;
              }
              handleBack();
            }}
            aria-disabled={isAnalyzing}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.headerTitle}>AI Palmistry Scanner</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.pageTitle}>
          {error ? 'Analysis Failed' : 'Analysing Palm'}
        </h2>
        <div className={styles.middleContent}>
        <div className={styles.leftSection}>
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
                    <h3 className={styles.checkTitle}>Clear Background</h3>
                    <p className={styles.checkDescription}>Use a neutral background to avoid distractions in the photo</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Focus on Your Palm</h3>
                    <p className={styles.checkDescription}>Make sure your palm is centered and clearly visible in the frame</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Steady Hands</h3>
                    <p className={styles.checkDescription}>Keep your hands steady to avoid blurriness for better detail</p>
                  </div>
                </div>
              </div>

              <div className={styles.disclaimer}>
                <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                <p className={styles.disclaimerText}>
                  This palm reading is for informational purposes only and not a substitute for professional advice. Analysis is based on AI interpretation.
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
                  aria-disabled, not `disabled`. The dimming stays so the state
                  is still visible, but the button keeps firing so
                  handleGenerateAnalysis can explain the blocker. `cursor` is
                  left as pointer for the same reason — 'not-allowed' on a
                  control that does respond would be a lie, and it does nothing
                  on touch anyway.
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
                <h3 className={styles.message}>Hold tight as we are analysing your palm</h3>
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
                "Analysing..." while the work is in flight, but a natively
                disabled button emits no click at all, so someone tapping it to
                ask "is this actually going?" got nothing — on the one screen
                where the wait is longest. It stays tappable and answers.
              */}
              <button 
                className={styles.resultButton}
                onClick={() => {
                  if (isNavigating) {
                    announceActionNotice('Opening your reading — one moment.');
                    return;
                  }
                  if (!analysisComplete) {
                    announceActionNotice('Still reading your palm. This can take a few moments.');
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

export default PalmistryAnalysis;
