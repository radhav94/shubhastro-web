import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './SignatureCamera.module.scss';
import { useObjectDetection } from '../../../../utils/hooks/useObjectDetection';
import { setSignatureImage } from '../../../../redux/aiwow/aiwowSlice';

const SignatureCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // Back camera for signature

  const {
    detectionReady,
    objectDetected,
    startDetection,
    stopDetection
  } = useObjectDetection({ videoRef, canvasRef: detectionCanvasRef, detectionType: 'signature' });

  useEffect(() => {
    console.log('SignatureCamera mounted, starting camera');
    startCamera();
    
    return () => {
      console.log('SignatureCamera unmounting, stopping camera');
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

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };

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

  const captureImage = async () => {
    stopDetection();
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the full image data
      const fullImageData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Try to crop to signature region
      let croppedImage = fullImageData;
      
      try {
        // Get image data for processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Find signature bounds using edge detection
        const bounds = findSignatureBounds(imageData);
        
        if (bounds && bounds.width > 50 && bounds.height > 20) {
          // Add padding around the signature (15% on each side)
          const padding = 0.15;
          const paddedWidth = bounds.width * (1 + padding * 2);
          const paddedHeight = bounds.height * (1 + padding * 2);
          const paddedX = Math.max(0, bounds.x - bounds.width * padding);
          const paddedY = Math.max(0, bounds.y - bounds.height * padding);
          
          // Ensure we don't exceed canvas bounds
          const cropX = Math.max(0, paddedX);
          const cropY = Math.max(0, paddedY);
          const cropWidth = Math.min(paddedWidth, canvas.width - cropX);
          const cropHeight = Math.min(paddedHeight, canvas.height - cropY);
          
          // Create a new canvas for the cropped image
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropWidth;
          cropCanvas.height = cropHeight;
          const cropContext = cropCanvas.getContext('2d');
          
          // Draw the cropped region
          cropContext.drawImage(
            canvas,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );
          
          croppedImage = cropCanvas.toDataURL('image/jpeg', 0.95);
          console.log('Signature cropped successfully');
        }
      } catch (error) {
        console.error('Error cropping signature:', error);
        // Fall back to full image if cropping fails
      }
      
      setCapturedImage(croppedImage);
      stopCamera();
    }
  };

  // Helper function to find signature bounding box using edge detection
  const findSignatureBounds = (imageData) => {
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let foundPixels = false;
    
    // Convert to grayscale and find dark pixels (signature ink)
    const threshold = 180; // Pixels darker than this are considered part of signature
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Calculate grayscale value
        const gray = (r + g + b) / 3;
        
        // If pixel is dark enough, it's likely part of the signature
        if (gray < threshold) {
          foundPixels = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (!foundPixels) return null;
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const proceedWithImage = () => {
    if (capturedImage) {
      dispatch(setSignatureImage(capturedImage));
      navigate('/aiwow/signature/capture');
    }
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
              className={styles.video}
            />
            <canvas
              ref={detectionCanvasRef}
              className={styles.detectionCanvas}
            />
            <div className={styles.overlay}>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: '10%', left: '5%' }}></div>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: '10%', right: '5%' }}></div>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: '20%', left: '5%' }}></div>
              <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: '20%', right: '5%' }}></div>
            </div>
            {!objectDetected && detectionReady && (
              <div className={styles.detectionMessage}>
                <p>Position your signature within the frame</p>
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
            className={`${styles.captureButton} ${(!detectionReady || !objectDetected) ? styles.disabled : ''}`} 
            onClick={captureImage}
            disabled={!detectionReady || !objectDetected}
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3" opacity={(!detectionReady || !objectDetected) ? "0.5" : "1"}/>
                <circle cx="20" cy="20" r="14" fill="white" opacity={(!detectionReady || !objectDetected) ? "0.5" : "1"}/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!detectionReady ? 'Loading...' : (objectDetected ? 'Capture' : 'No Signature Detected')}
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

export default SignatureCamera;
