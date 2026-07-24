import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './PalmistryCamera.module.scss';
import { useHandDetection } from '../../../../utils/hooks/useHandDetection';
import { useAutoCapture } from '../../../../utils/hooks/useAutoCapture';
import { setPalmistryImage } from '../../../../redux/aiwow/aiwowSlice';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const PalmistryCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedHand = useSelector((state) => state.aiwow.palmistry.selectedHand) || 'right';
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);

  // Lock body scroll when camera is open (fullscreen on mobile)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const captureAreaRef = useRef(null); // Reference to capture area div

  // Show the flip button only when the device actually has more than one
  // camera. (Previously it was hidden on any screen >= 769px, which wrongly
  // hid it on tablets that do have front + rear cameras.)
  const detectCameras = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(cams.length > 1);
    } catch {
      /* ignore — leave flip hidden if we can't detect */
    }
  };

  useEffect(() => {
    detectCameras();
  }, []);

  // Calculate capture box bounds dynamically
  const getCaptureBoxBounds = () => {
    if (!captureAreaRef.current || !videoRef.current) {
      // Return default bounds if refs not ready
      return {
        left: 0.15,
        right: 0.85,
        top: 0.10,
        bottom: 0.90
      };
    }

    try {
      const videoRect = videoRef.current.getBoundingClientRect();
      const boxRect = captureAreaRef.current.getBoundingClientRect();

      // Calculate bounds as percentage of video dimensions
      const bounds = {
        left: (boxRect.left - videoRect.left) / videoRect.width,
        right: (boxRect.right - videoRect.left) / videoRect.width,
        top: (boxRect.top - videoRect.top) / videoRect.height,
        bottom: (boxRect.bottom - videoRect.top) / videoRect.height,
      };

      console.log('📐 Orange Box Bounds:', bounds);
      return bounds;
    } catch (error) {
      console.error('Error calculating bounds:', error);
      return {
        left: 0.15,
        right: 0.85,
        top: 0.10,
        bottom: 0.90
      };
    }
  };

  const {
    handsLoaded,
    handDetected,
    isPalmOpen,
    isInBounds,
    detectedHandSide,
    isTooFar,
    startDetection,
    stopDetection
  } = useHandDetection({ 
    videoRef, 
    canvasRef: detectionCanvasRef,
    getCaptureBoxBounds,
    isFrontCamera,
  });

  // Wrong hand: hand detected but it's not the selected hand
  const isWrongHand = handDetected && detectedHandSide !== null && detectedHandSide !== selectedHand;

  // ─── Auto-capture (blur-safe) ────────────────────────────────────────────
  // Fire automatically once a valid palm is steadily in frame; the shared hook
  // picks the sharpest frame so we never save a blurry image.
  const ready = handsLoaded && handDetected && isPalmOpen && isInBounds && !isWrongHand && !isTooFar;

  // Draw the current video frame, cropped to the orange box, onto a canvas.
  const cropCurrentFrameToCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const bounds = getCaptureBoxBounds();
    const boxX = bounds.left * canvas.width;
    const boxY = bounds.top * canvas.height;
    const boxWidth = (bounds.right - bounds.left) * canvas.width;
    const boxHeight = (bounds.bottom - bounds.top) * canvas.height;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = boxWidth;
    cropCanvas.height = boxHeight;
    cropCanvas.getContext('2d').drawImage(
      canvas,
      boxX, boxY, boxWidth, boxHeight,
      0, 0, boxWidth, boxHeight
    );
    return cropCanvas;
  };

  const { autoCapturing } = useAutoCapture({
    ready,
    active: !capturedImage,
    getFrameCanvas: cropCurrentFrameToCanvas,
    onCapture: (dataUrl) => {
      setCapturedImage(dataUrl);
      stopCamera();
    },
  });

  // Start detection when models are loaded and video is ready
  useEffect(() => {
    if (handsLoaded && videoRef.current && videoRef.current.readyState >= 2) {
      console.log('Hands loaded, starting detection for existing video');
      setTimeout(() => {
        startDetection();
      }, 300);
    }
  }, [handsLoaded]);

  useEffect(() => {
    console.log('[PalmistryCamera] facingMode changed to:', facingMode);
    // Small delay to let old camera tracks fully release on mobile
    const timer = setTimeout(() => {
      startCamera();
    }, 200);
    
    return () => {
      clearTimeout(timer);
      console.log('PalmistryCamera unmounting, stopping camera');
      stopCamera();
    };
  }, [facingMode, handsLoaded]);

  const startCamera = async () => {
    try {
      // Stop existing stream first
      stopCamera();

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported on this device or browser.');
        return;
      }

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (constraintErr) {
        if (constraintErr.name === 'OverconstrainedError') {
          // Fallback for iOS — retry without resolution constraints
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } }
          });
        } else {
          throw constraintErr;
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);

        // Detect actual camera facing mode from track
        const videoTrack = mediaStream.getVideoTracks()[0];
        const trackFacing = videoTrack?.getSettings?.()?.facingMode;
        setIsFrontCamera(trackFacing !== 'environment');

        // Re-check camera count now that permission is granted (device labels
        // and full list are only reliably available after permission).
        detectCameras();

        // Start hand detection once video is playing.
        // Guard with optional chaining: this fires asynchronously and the
        // component may have unmounted (e.g. quick back navigation), leaving
        // videoRef.current null — calling .play() on null throws
        // "null is not an object".
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };

        videoRef.current.onplay = () => {
          // Wait a bit for video to stabilize, then start detection
          if (handsLoaded) {
            setTimeout(() => {
              startDetection();
            }, 300);
          }
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      // Provide specific error messages based on error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not meet the required specifications.');
      } else if (err.name === 'SecurityError') {
        setError('Camera access is blocked due to security settings. Please use HTTPS.');
      } else {
        setError('Unable to access camera. Please check permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    stopDetection();
    
    // Stop all tracks from video element
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        console.log('[PalmistryCamera] Stopping track:', track.kind, track.label);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    // Also stop from stream state (belt & suspenders)
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    const cropCanvas = cropCurrentFrameToCanvas();
    if (!cropCanvas) return;
    const croppedImage = cropCanvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(croppedImage);
    stopCamera();
  };

  const switchCamera = () => {
    // Stop current camera completely before switching
    stopCamera();
    
    // Switch facing mode
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    
    // Start camera with new mode will be handled by useEffect
  };

  const retakePhoto = () => {
    setCapturedImage(null); // clearing this re-activates auto-capture in the hook
    startCamera();
  };

  const submitImage = () => {
    // New image → allow a fresh analysis (clear the reload guard from a
    // previous attempt).
    sessionStorage.removeItem('palmistryAnalysisStarted');
    dispatch(setPalmistryImage(capturedImage));
    // Replace (not push) so the live camera screen is removed from history.
    // The analysis screen then replaces itself with the result, so pressing
    // browser Back on the result page returns to the instructions screen
    // instead of re-opening the camera (which would restart getUserMedia,
    // auto-capture again, and trigger a fresh paid analysis in a loop).
    navigate('/ai-wow/ai-palmistry-scanner/capture', { replace: true });
  };

  const proceedWithImage = () => {
    if (!capturedImage) return;
    // Guests must add a kundli + verify OTP at the moment the photo is submitted.
    if (!localStorage.getItem("shubhtalk_customer_token")) {
      setShowGuestAuthModal(true);
      return;
    }
    submitImage();
  };

  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    submitImage();
  };

  const handleBack = () => {
    console.log('Back button clicked, stopping camera immediately');
    
    // Stop detection immediately
    stopDetection();
    
    // Stop all video tracks immediately
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        console.log('Stopping track immediately:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    // Stop stream state immediately
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    // Navigate after stopping camera
    navigate(-1);
  };

  if (error) {
    return createPortal(
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.errorContainer}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className={styles.errorIcon}>
            <circle cx="32" cy="32" r="30" stroke="#ef4444" strokeWidth="2" fill="none"/>
            <path d="M32 20V36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="32" cy="44" r="2" fill="#ef4444"/>
          </svg>
          <h3 className={styles.errorTitle}>Camera Access Required</h3>
          <p className={styles.errorText}>{error}</p>
          <div className={styles.errorButtons}>
            <button className={styles.retryButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
            <button className={styles.backButton} onClick={handleBack}>
              Go Back
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // While the guest auth flow is open, hide the camera view entirely.
  if (showGuestAuthModal) {
    return createPortal(
      <GuestKundliAuthModal
        isOpen
        onClose={() => {
          setShowGuestAuthModal(false);
          navigate('/ai-wow/ai-palmistry-scanner/instructions');
        }}
        onSuccess={handleGuestAuthSuccess}
      />,
      document.body
    );
  }

  return createPortal(
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {!capturedImage && hasMultipleCameras && (
          <button className={styles.switchBtn} onClick={switchCamera}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M17 8L21 12M21 12L17 16M21 12H9M7 16L3 12M3 12L7 8M3 12H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      <div className={styles.cameraWrapper}>
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.video}
              style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
            />
            <canvas
              ref={detectionCanvasRef}
              className={styles.detectionCanvas}
              style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
            />
            <div className={styles.overlay}>
              <div className={styles.blurTop}></div>
              <div className={styles.blurBottom}></div>
              <div className={styles.blurLeft}></div>
              <div className={styles.blurRight}></div>
              
              {/* Capture area frame - smaller and centered on palm */}
              <div className={styles.captureArea} ref={captureAreaRef}>
                <div className={`${styles.frameCorner} ${
                  handDetected && isPalmOpen && isInBounds ? styles.detected : 
                  handDetected && !isInBounds ? styles.outOfBounds : 
                  styles.notDetected
                }`} style={{ top: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${
                  handDetected && isPalmOpen && isInBounds ? styles.detected : 
                  handDetected && !isInBounds ? styles.outOfBounds : 
                  styles.notDetected
                }`} style={{ top: 0, right: 0 }}></div>
                <div className={`${styles.frameCorner} ${
                  handDetected && isPalmOpen && isInBounds ? styles.detected : 
                  handDetected && !isInBounds ? styles.outOfBounds : 
                  styles.notDetected
                }`} style={{ bottom: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${
                  handDetected && isPalmOpen && isInBounds ? styles.detected : 
                  handDetected && !isInBounds ? styles.outOfBounds : 
                  styles.notDetected
                }`} style={{ bottom: 0, right: 0 }}></div>
              </div>
              
              <div className={styles.palmLabel}>
                <span>{selectedHand === 'left' ? 'Left hand' : 'Right hand'}</span>
                <span>Palm</span>
              </div>
            </div>
            {(!handDetected || !isPalmOpen || !isInBounds || isWrongHand || isTooFar) && handsLoaded && (
              <div className={`${styles.handDetectionMessage} ${isWrongHand ? styles.wrongHandMessage : ''}`}>
                <p>
                  {isWrongHand
                    ? `Wrong hand! Please show your ${selectedHand} hand`
                    : isTooFar ? `Move your ${selectedHand} hand closer to the camera`
                    : !handDetected ? `Move your ${selectedHand} hand closer to the camera`
                    : !isPalmOpen ? 'Open your palm fully'
                    : !isInBounds ? 'Move your hand inside the box'
                    : ''}
                </p>
              </div>
            )}
            {ready && autoCapturing && handsLoaded && (
              <div className={styles.handDetectionMessage}>
                <p>Hold steady… capturing</p>
              </div>
            )}
          </>
        ) : (
          <>
            <img src={capturedImage} alt="Captured" className={styles.capturedImage} />
            <div className={styles.overlay}>
              <div className={styles.palmLabel}>
                <span>{selectedHand === 'left' ? 'Left hand' : 'Right hand'}</span>
                <span>Palm</span>
              </div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className={styles.controls}>
        {!capturedImage ? (
          <button 
            className={`${styles.captureButton} ${(!handDetected || !isPalmOpen || !isInBounds || isWrongHand || isTooFar) && handsLoaded ? styles.disabled : ''}`} 
            onClick={captureImage}
            disabled={(!handDetected || !isPalmOpen || !isInBounds || isWrongHand || isTooFar) && handsLoaded}
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3" opacity={(!handDetected || !isPalmOpen || !isInBounds || isWrongHand || isTooFar) && handsLoaded ? "0.5" : "1"}/>
                <circle cx="20" cy="20" r="14" fill="white" opacity={(!handDetected || !isPalmOpen || !isInBounds || isWrongHand || isTooFar) && handsLoaded ? "0.5" : "1"}/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!handsLoaded ? 'Loading...' :
               isWrongHand ? `Use ${selectedHand} hand` :
               isTooFar ? 'Move Hand Closer' :
               (handDetected && isPalmOpen && isInBounds ? 'Capture' : 
                !handDetected ? 'Move Hand Closer' :
                !isPalmOpen ? 'Open Palm' :
                'Move Inside Box')}
            </span>
          </button>
        ) : (
          <div className={styles.actionButtons}>
            <button className={styles.retakeButton} onClick={retakePhoto}>
              Retake
            </button>
            <button className={styles.proceedButton} onClick={proceedWithImage}>
              Use Photo
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PalmistryCamera;
