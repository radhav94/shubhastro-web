import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './FaceReadingCamera.module.scss';
import { useFaceDetection } from '../../../../utils/hooks/useFaceDetection';
import { useAutoCapture } from '../../../../utils/hooks/useAutoCapture';
import { setFaceReadingImage } from '../../../../redux/aiwow/aiwowSlice';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const FaceReadingCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [videoReady, setVideoReady] = useState(false); // ⭐ Track video ready state

  const {
    modelsLoaded,
    faceDetected,
    faceInCircle,
    isTooFar,
    startDetection,
    stopDetection
  } = useFaceDetection({ 
    videoRef, 
    canvasRef: detectionCanvasRef,
    getCircleBounds: () => getCircleBounds()
  });

  // Function to get circle bounds dynamically
  const getCircleBounds = () => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    const videoRect = video.getBoundingClientRect();
    
    // Circle is centered in the video
    const centerX = videoRect.width / 2;
    const centerY = videoRect.height / 2;
    
    // Circle radius based on screen size
    let radius = 310; // 620px diameter / 2
    if (window.innerWidth <= 768) {
      radius = 210; // 420px diameter / 2
    }
    if (window.innerWidth <= 480) {
      radius = 180; // 360px diameter / 2
    }
    
    return { centerX, centerY, radius };
  };

  // Safety net cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting - final cleanup');
      stopDetection();
      
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // Start detection when BOTH models and video are ready
  useEffect(() => {
    if (modelsLoaded && videoReady) {
      console.log("Models + Video ready → Starting detection");
      startDetection();
    }
  }, [modelsLoaded, videoReady]);

  useEffect(() => {
    console.log('[FaceReadingCamera] facingMode changed to:', facingMode);
    const timer = setTimeout(() => {
      startCamera();
    }, 200);
    
    // ✅ FIX: Only cleanup timer, not detection (that's handled by unmount effect)
    return () => {
      clearTimeout(timer);
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream first (only if stream exists)
      if (stream) {
        stopCamera();
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported on this device or browser.');
        return;
      }

      // Request camera permission
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
        
        // Set video ready when data is loaded
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current.play();
        };
        
        videoRef.current.onloadeddata = () => {
          console.log("Video ready");
          setVideoReady(true);
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
    setVideoReady(false); // Reset video ready state
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
  };

  const switchCamera = () => {
    // Stop current camera completely before switching
    stopCamera();
    
    // Switch facing mode
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    
    // Start camera with new mode will be handled by useEffect
  };

  // Capture allowed only when face is detected, in circle, and not too far
  const canCapture = faceDetected && faceInCircle && !isTooFar;

  // Draw the current video frame, cropped to the face circle, onto a canvas.
  const cropCurrentFrameToCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;

    const circleBounds = getCircleBounds();
    if (!circleBounds) return null;

    const { centerX, centerY, radius } = circleBounds;
    const scaleX = video.videoWidth / video.offsetWidth;
    const scaleY = video.videoHeight / video.offsetHeight;
    const scaledCenterX = centerX * scaleX;
    const scaledCenterY = centerY * scaleY;
    const scaledRadius = radius * Math.min(scaleX, scaleY);
    const diameter = scaledRadius * 2;

    canvas.width = diameter;
    canvas.height = diameter;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.arc(diameter / 2, diameter / 2, scaledRadius, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(
      video,
      scaledCenterX - scaledRadius,
      scaledCenterY - scaledRadius,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter
    );
    context.restore();
    return canvas;
  };

  const captureImage = () => {
    const canvas = cropCurrentFrameToCanvas();
    if (!canvas) return;
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
    stopCamera();
  };

  // Auto-capture the sharpest frame once a valid face is steady in the circle.
  const { autoCapturing } = useAutoCapture({
    ready: modelsLoaded && videoReady && canCapture,
    active: !capturedImage,
    getFrameCanvas: cropCurrentFrameToCanvas,
    onCapture: (dataUrl) => {
      setCapturedImage(dataUrl);
      stopCamera();
    },
  });

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitImage = () => {
    dispatch(setFaceReadingImage(capturedImage));
    navigate('/ai-wow/astro-face-reading/capture');
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
    console.log('Back button clicked - HARD STOP');
    
    // 1️⃣ Stop detection loop immediately
    stopDetection();
    
    // 2️⃣ Stop ALL media tracks
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    // 3️⃣ REMOVE video element from DOM (forces camera LED off)
    setVideoActive(false);
    
    // 4️⃣ Navigate immediately
    navigate(-1);
  };

  if (error) {
    return (
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
      </div>
    );
  }

  // While the guest auth flow is open, hide the camera view entirely.
  if (showGuestAuthModal) {
    return (
      <GuestKundliAuthModal
        isOpen
        onClose={() => {
          setShowGuestAuthModal(false);
          navigate('/ai-wow/astro-face-reading');
        }}
        onSuccess={handleGuestAuthSuccess}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {!capturedImage && (
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
            {videoActive && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
                style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
              />
            )}
            <canvas
              ref={detectionCanvasRef}
              className={styles.detectionCanvas}
              style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
            />
            <div className={styles.overlay}>
              {/* Circular face frame */}
              <div className={`${styles.faceCircle} ${canCapture ? styles.detected : styles.notDetected}`}>
                <svg className={styles.circleSvg} viewBox="0 0 300 300">
                  <circle 
                    cx="150" 
                    cy="150" 
                    r="140" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    strokeDasharray="10 5"
                  />
                </svg>
              </div>
            </div>
            {!canCapture && modelsLoaded && (
              <div className={styles.faceDetectionMessage}>
                <p>
                  {!faceDetected
                    ? 'Move your face closer to the camera'
                    : isTooFar
                    ? 'Move your face closer to the camera'
                    : !faceInCircle
                    ? 'Position your face within the circle'
                    : ''}
                </p>
              </div>
            )}
            {canCapture && autoCapturing && modelsLoaded && (
              <div className={styles.faceDetectionMessage}>
                <p>Hold steady… capturing</p>
              </div>
            )}
          </>
        ) : (
          <img src={capturedImage} alt="Captured" className={styles.capturedImage} />
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className={styles.controls}>
        {!capturedImage ? (
          <button 
            className={`${styles.captureButton} ${(!canCapture && modelsLoaded) ? styles.disabled : ''}`} 
            onClick={captureImage}
            disabled={!canCapture && modelsLoaded}
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3" opacity={(!canCapture && modelsLoaded) ? "0.5" : "1"}/>
                <circle cx="20" cy="20" r="14" fill="white" opacity={(!canCapture && modelsLoaded) ? "0.5" : "1"}/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!modelsLoaded ? 'Loading...' : 
               canCapture ? 'Capture' : 
               !faceDetected || isTooFar ? 'Move Closer' : 
               'Move Inside Circle'}
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
    </div>
  );
};

export default FaceReadingCamera;
