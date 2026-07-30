import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styles from './SignatureAnalysis.module.scss';
import { analyzeSignature } from '../../../../services/appServices/aiWowService';
import { setSignatureResult, clearSignatureData, setSignatureImage } from '../../../../redux/aiwow/aiwowSlice';
import { PATH } from '../../../../utils/routes/Paths';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';

const SignatureAnalysis = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const signatureImage = useSelector((state) => state.aiwow.signature.image);
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'signature' });

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
  
  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef(null);
  const hasStartedRef = React.useRef(false);

  // Turn the backend error into a clear, user-friendly message. Low-quality /
  // unreadable signature photos should get a specific "retake a clearer photo"
  // message instead of a generic "Something went wrong".
  const buildSignatureError = (err) => {
    const rawMsg = (typeof err === 'string' ? err : err?.message) || '';
    const code = String(err?.code || '').toUpperCase();
    const lower = rawMsg.toLowerCase();

    const looksLowQuality =
      /QUALITY|BLUR|DETECT|UNCLEAR|LOW_RES|NOT_FOUND/.test(code) ||
      ['quality', 'blur', 'unclear', 'not clear', 'clearer', 'not detect',
       'no signature', 'signature not', 'lighting', 'too dark', 'too small',
       'low resolution', 'illegible'].some((k) => lower.includes(k));

    if (looksLowQuality) {
      return {
        message:
          "We couldn't read your signature clearly. Please retake a sharp, well-lit photo of your signature on plain paper.",
        details: err?.details || null,
      };
    }

    // Surface a meaningful (non-technical) backend message if we have one.
    const isTechnical = /googleapis|GoogleGenerativeAI|INTERNAL|prepayment|Too Many Requests|Error fetching/i.test(rawMsg);
    if (rawMsg && rawMsg.length <= 120 && !isTechnical) {
      return { message: rawMsg, details: err?.details || null };
    }

    return { message: 'Something went wrong. Please try again.', details: err?.details || null };
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (profileLoading) return;

    if (!signatureImage) {
      navigate(PATH.privateRoutes.SIGNATURE_LANDING.path[0]);
      return;
    }
    // Note: analysis is no longer triggered automatically on mount.
    // The user must explicitly click "Generate analysis".
  }, [signatureImage, profile, profileLoading]);

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
      const result = await runWithEntitlement(() => analyzeSignature(imageData, abortController.signal));

      clearInterval(progressInterval);

      // Check if component is still mounted before processing result
      if (!isMountedRef.current) {
        console.log('Component unmounted - ignoring API result');
        return;
      }

      // Entitlement block handled by the gate (plans popup / recharge toast).
      // Do NOT show the "Analysis Failed" screen — just return to the previous
      // (pre-analysis) screen so the user can try again.
      if (result.blocked) {
        setProgress(0);
        setIsAnalyzing(false);
        setAnalysisComplete(false);
        setError(null);
        hasStartedRef.current = false;
        return;
      }

      if (result.success) {
        dispatch(setSignatureResult(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        // Only navigate if component is still mounted
        setTimeout(() => {
          if (isMountedRef.current) {
            navigate(PATH.privateRoutes.SIGNATURE_RESULT.path[0], { replace: true });
          } else {
            console.log('Component unmounted - skipping navigation to result');
          }
        }, 1000);
      } else {
        // DON'T clear data on error - keep image for retry
        // dispatch(clearSignatureData());
        
        setProgress(0);
        setError(buildSignatureError(result.error));
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
      // dispatch(clearSignatureData());
      
      setProgress(0);
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleGenerateAnalysis = () => {
    if (isAnalyzing || analysisComplete) return;
    if (!signatureImage || !profile) return;
    hasStartedRef.current = true;
    setError(null);
    performAnalysis(signatureImage);
  };

  const handleRetakePicture = () => {
    // Clear only the captured image and go back to the instructions screen.
    dispatch(setSignatureImage(null));
    navigate(PATH.privateRoutes.SIGNATURE_INSTRUCTIONS.path[0]);
  };

  const handleShowResult = () => {
    if (analysisComplete && !isNavigating) {
      setIsNavigating(true);
      navigate(PATH.privateRoutes.SIGNATURE_RESULT.path[0], { replace: true });
    }
  };

  const handleRetry = () => {
    // Clear error and data, then navigate back to start over
    setError(null);
    dispatch(clearSignatureData());
    navigate(PATH.privateRoutes.SIGNATURE_LANDING.path[0]);
  };

  const handleBack = () => {
    dispatch(clearSignatureData());
    navigate(PATH.privateRoutes.SIGNATURE_INSTRUCTIONS.path[0], { replace: true });
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
          <h1 className={styles.headerTitle}>AI Signature Analysis</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.pageTitle}>
          {error ? 'Analysis Failed' : 'Analysing Signature'}
        </h2>
        <div className={styles.middleContent}>
        <div className={styles.leftSection}>
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
                    <h3 className={styles.checkTitle}>Highlight Signature</h3>
                    <p className={styles.checkDescription}>Emphasize the signature area to draw attention to authenticity.</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Adjust Contrast</h3>
                    <p className={styles.checkDescription}>Enhance contrast to make the signature more legible against the background.</p>
                  </div>
                </div>

                <div className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>Add Annotations</h3>
                    <p className={styles.checkDescription}>Include notes or markers to indicate specific features of the signature.</p>
                  </div>
                </div>
              </div>

              <div className={styles.disclaimer}>
                <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                <p className={styles.disclaimerText}>
                  This signature analysis is for informational purposes only, not a substitute for professional authentication. Analysis is AI-driven.
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
                <h3 className={styles.message}>Hold tight as we are analysing your signature</h3>
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

export default SignatureAnalysis;
