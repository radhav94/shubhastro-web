import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './AuraCamera.module.scss';
import { useFaceDetection } from '../../../../utils/hooks/useFaceDetection';
import { setAuraImage } from '../../../../redux/aiwow/aiwowSlice';

const AuraCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [videoReady, setVideoReady] = useState(false); // ⭐ Track video ready state
  const captureAreaRef = useRef(null);

  const {
    modelsLoaded,
    faceDetected,
    startDetection,
    stopDetection
  } = useFaceDetection({ videoRef, canvasRef: detectionCanvasRef });

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
    const timer = setTimeout(() => {
      startCamera();
    }, 200);
    
    return () => {
      clearTimeout(timer);
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Only stop camera if stream exists
      if (stream) {
        stopCamera();
      }

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
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);

        // Detect actual camera facing mode from track
        const videoTrack = mediaStream.getVideoTracks()[0];
        const trackFacing = videoTrack?.getSettings?.()?.facingMode;
        setIsFrontCamera(trackFacing !== 'environment');
        
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
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    // Stop current camera completely before switching
    stopCamera();
    
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && captureAreaRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Draw full frame first
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Calculate crop bounds from the capture area box
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

      // Create cropped canvas
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = boxWidth;
      cropCanvas.height = boxHeight;
      const cropContext = cropCanvas.getContext('2d');
      cropContext.drawImage(
        canvas,
        boxX, boxY, boxWidth, boxHeight,
        0, 0, boxWidth, boxHeight
      );

      const croppedImage = cropCanvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(croppedImage);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const proceedWithImage = () => {
    if (capturedImage) {
      dispatch(setAuraImage(capturedImage));
      navigate('/aura-photography/capture');
    }
  };

  const handleBack = () => {
    stopCamera();
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
            <button className={styles.retryButton} onClick={startCamera}>
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
              <div className={styles.blurTop}></div>
              <div className={styles.blurBottom}></div>
              <div className={styles.blurLeft}></div>
              <div className={styles.blurRight}></div>
              
              <div className={styles.captureArea} ref={captureAreaRef}>
                <div className={`${styles.frameCorner} ${faceDetected ? styles.detected : styles.notDetected}`} style={{ top: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${faceDetected ? styles.detected : styles.notDetected}`} style={{ top: 0, right: 0 }}></div>
                <div className={`${styles.frameCorner} ${faceDetected ? styles.detected : styles.notDetected}`} style={{ bottom: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${faceDetected ? styles.detected : styles.notDetected}`} style={{ bottom: 0, right: 0 }}></div>
              </div>
            </div>
            {!faceDetected && modelsLoaded && (
              <div className={styles.faceDetectionMessage}>
                <p>Position your face within the frame</p>
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
            className={`${styles.captureButton} ${(!faceDetected && modelsLoaded) ? styles.disabled : ''}`} 
            onClick={captureImage}
            disabled={!faceDetected && modelsLoaded}
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3" opacity={(!faceDetected && modelsLoaded) ? "0.5" : "1"}/>
                <circle cx="20" cy="20" r="14" fill="white" opacity={(!faceDetected && modelsLoaded) ? "0.5" : "1"}/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!modelsLoaded ? 'Loading...' : (faceDetected ? 'Capture' : 'No Face Detected')}
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

export default AuraCamera;
