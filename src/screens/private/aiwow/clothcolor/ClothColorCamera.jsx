import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './ClothColorCamera.module.scss';
import { useObjectDetection } from '../../../../utils/hooks/useObjectDetection';
import { useAutoCapture } from '../../../../utils/hooks/useAutoCapture';
import { setClothColorImage } from '../../../../redux/aiwow/aiwowSlice';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';
import { countFacesInImage } from '../../../../utils/helper/detectFaces';
import { Toast } from '../../../../component';

const ClothColorCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  // Keep a ref to the live stream and force-stop it on unmount so the camera
  // turns off even when the user leaves via the browser Back button.
  useEffect(() => { streamRef.current = stream; }, [stream]);
  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false); // verifying single-person at capture
  const [facingMode, setFacingMode] = useState('user');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const captureAreaRef = useRef(null);

  const {
    detectionReady,
    objectDetected,
    startDetection,
    stopDetection
  } = useObjectDetection({ 
    videoRef, 
    canvasRef: detectionCanvasRef, 
    detectionType: 'cloth' 
  });

  useEffect(() => {
    startCamera();
    
    return () => {
      console.log('ClothColorCamera unmounting, stopping camera');
      stopDetection();
      stopCamera();
      
      // Stop video stream from video element
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      
      // Stop stream state
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      stopDetection();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
        setIsFrontCamera(trackFacing !== 'environment');

        const tryPlay = async () => {
          try {
            await videoRef.current?.play();
          } catch (e) {
            console.warn('Cloth camera play() failed:', e);
          }
          if (detectionReady) {
            startDetection();
          }
        };
        videoRef.current.onloadedmetadata = tryPlay;
        videoRef.current.oncanplay = () => { videoRef.current?.play?.().catch(() => {}); };
        tryPlay();
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

  // Draw the current video frame, cropped to the capture box, onto a canvas.
  const cropCurrentFrameToCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !captureAreaRef.current || !video.videoWidth) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const videoRect = video.getBoundingClientRect();
    const boxRect = captureAreaRef.current.getBoundingClientRect();
    const bounds = {
      left: (boxRect.left - videoRect.left) / videoRect.width,
      right: (boxRect.right - videoRect.left) / videoRect.width,
      top: (boxRect.top - videoRect.top) / videoRect.height,
      bottom: (boxRect.bottom - videoRect.top) / videoRect.height,
    };
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

  // Reject the capture at the moment it's taken if more than one person is in
  // frame — so the user gets immediate feedback instead of paying/waiting for
  // the analysis to fail. Detection failing (‑1) fails open (allowed).
  const finalizeCapture = async (dataUrl) => {
    if (!dataUrl) return;
    setChecking(true);
    let faces = -1;
    try {
      faces = await countFacesInImage(dataUrl);
    } catch {
      faces = -1;
    }
    setChecking(false);
    if (faces > 1) {
      Toast.error('Multiple people detected. Please capture only one person in the frame.');
      // Stay on the camera and resume detection so they can retry.
      startDetection();
      return;
    }
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      // Camera not ready yet — nothing to capture.
      return;
    }
    if (checking) return;
    stopDetection();
    const cropCanvas = cropCurrentFrameToCanvas();
    if (!cropCanvas) return;
    finalizeCapture(cropCanvas.toDataURL('image/jpeg', 0.95));
  };

  // Auto-capture the sharpest frame once the cloth is steady in the frame.
  const { autoCapturing } = useAutoCapture({
    ready: detectionReady && objectDetected && !checking,
    active: !capturedImage,
    getFrameCanvas: cropCurrentFrameToCanvas,
    onCapture: (dataUrl) => {
      finalizeCapture(dataUrl);
    },
    // Give the user time to frame the clothing before auto-capturing, and
    // require it to stay steady a bit longer, so capture doesn't fire too fast.
    options: { startDelayMs: 3000, minHoldMs: 1200, maxWaitMs: 6000 },
  });

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitImage = () => {
    dispatch(setClothColorImage(capturedImage));
    navigate('/ai-wow/clothes-colour-analysis/capture');
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
          navigate('/ai-wow/clothes-colour-analysis/instructions');
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
      </div>

      {!capturedImage && (
        <button className={styles.switchBtn} onClick={switchCamera}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 8L21 12M21 12L17 16M21 12H9M7 16L3 12M3 12L7 8M3 12H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

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
            <canvas ref={detectionCanvasRef} className={styles.detectionCanvas} style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }} />
            <div className={styles.overlay}>
              <div className={styles.blurTop}></div>
              <div className={styles.blurBottom}></div>
              <div className={styles.blurLeft}></div>
              <div className={styles.blurRight}></div>
              
              <div className={styles.captureArea} ref={captureAreaRef}>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: 0, right: 0 }}></div>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: 0, right: 0 }}></div>
              </div>
            </div>
            {!objectDetected && (
              <div className={styles.detectionMessage}>
                Position cloth in frame
              </div>
            )}
            {objectDetected && autoCapturing && (
              <div className={styles.detectionMessage}>
                Hold steady… capturing
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
            className={`${styles.captureButton} ${(!stream || checking) ? styles.disabled : ''}`} 
            onClick={captureImage}
            disabled={!stream || checking}
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3"/>
                <circle cx="20" cy="20" r="14" fill="white"/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!stream ? 'Loading...' : checking ? 'Checking…' : (objectDetected ? 'Capture' : 'Capture Cloth')}
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

export default ClothColorCamera;
