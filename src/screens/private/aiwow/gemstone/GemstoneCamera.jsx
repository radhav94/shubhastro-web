import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './GemstoneCamera.module.scss';
import { useObjectDetection } from '../../../../utils/hooks/useObjectDetection';
import { useAutoCapture } from '../../../../utils/hooks/useAutoCapture';
import { setGemstoneImage } from '../../../../redux/aiwow/aiwowSlice';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const GemstoneCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  const {
    detectionReady,
    objectDetected,
    detectionQuality,
    startDetection,
    stopDetection
  } = useObjectDetection({ videoRef, canvasRef: detectionCanvasRef, detectionType: 'gemstone' });

  useEffect(() => {
    console.log('GemstoneCamera mounted, starting camera');
    startCamera();
    
    return () => {
      console.log('GemstoneCamera unmounting, stopping camera');
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      stopCamera();

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
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } }
          });
        } else {
          throw constraintErr;
        }
      }
      
      if (videoRef.current) {
        // iOS Safari: React doesn't reliably set the `muted` DOM property from
        // the JSX prop, and iOS blocks inline playback of an unmuted video —
        // so play() rejects and the camera never shows. Set these imperatively.
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute('muted', '');
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('webkit-playsinline', '');

        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);

        // Detect actual camera facing mode from track
        const videoTrack = mediaStream.getVideoTracks()[0];
        const trackFacing = videoTrack?.getSettings?.()?.facingMode;
        // If facingMode is 'user' or undefined (desktop webcam), it's front-facing
        setIsFrontCamera(trackFacing !== 'environment');

        const tryPlay = () => {
          const p = videoRef.current?.play();
          if (p && typeof p.catch === 'function') {
            p.catch((e) => console.warn('Gemstone camera play() failed:', e));
          }
        };
        videoRef.current.onloadedmetadata = tryPlay;
        videoRef.current.oncanplay = tryPlay;
        tryPlay();

        videoRef.current.onplay = () => {
          startDetection();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      
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

  // Draw the current full video frame onto a canvas.
  const cropCurrentFrameToCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      // Camera not ready yet — nothing to capture.
      return;
    }
    stopDetection();
    const canvas = cropCurrentFrameToCanvas();
    if (!canvas) return;
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
    stopCamera();
  };

  // Auto-capture the sharpest frame once the gemstone is steady in the frame.
  // Gemstone detection is heuristic, so require a strong-quality, longer-held
  // detection before auto-capturing to avoid firing on false positives.
  const { autoCapturing } = useAutoCapture({
    ready: detectionReady && objectDetected && detectionQuality >= 55,
    active: !capturedImage,
    getFrameCanvas: cropCurrentFrameToCanvas,
    onCapture: (dataUrl) => {
      stopDetection();
      setCapturedImage(dataUrl);
      stopCamera();
    },
    options: { minHoldMs: 1000 },
  });

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitImage = () => {
    dispatch(setGemstoneImage(capturedImage));
    navigate('/ai-wow/gemstone-authenticity/capture');
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
          navigate('/ai-wow/gemstone-authenticity');
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
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: '10%', left: '5%' }}></div>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: '10%', right: '5%' }}></div>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: '20%', left: '5%' }}></div>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: '20%', right: '5%' }}></div>
            </div>
            {!objectDetected && detectionReady && (
              <div className={styles.detectionMessage}>
                <p>Position your gemstone in the center</p>
              </div>
            )}
            {objectDetected && autoCapturing && detectionReady && (
              <div className={styles.detectionMessage}>
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
            className={`${styles.captureButton} ${!stream ? styles.disabled : ''}`} 
            onClick={captureImage}
            disabled={!stream}
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3" opacity={!stream ? "0.5" : "1"}/>
                <circle cx="20" cy="20" r="14" fill="white" opacity={!stream ? "0.5" : "1"}/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!stream ? 'Loading...' : (objectDetected ? 'Capture' : 'Capture Gemstone')}
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

export default GemstoneCamera;
