import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './SignatureCamera.module.scss';
import { useObjectDetection } from '../../../../utils/hooks/useObjectDetection';
import { useAutoCapture } from '../../../../utils/hooks/useAutoCapture';
import { setSignatureImage } from '../../../../redux/aiwow/aiwowSlice';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';
import usePreventPinchZoom from '../../../../utils/hooks/usePreventPinchZoom';
import toast from '../../../../component/toast';

const SignatureCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  usePreventPinchZoom(); // block pinch/gesture zoom while the camera is open
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const captureAreaRef = useRef(null); // Reference to capture area
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
  const [facingMode, setFacingMode] = useState('environment'); // Back camera for signature
  const [isFrontCamera, setIsFrontCamera] = useState(false);

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

        // Detect actual camera facing mode from track
        const videoTrack = mediaStream.getVideoTracks()[0];
        const trackFacing = videoTrack?.getSettings?.()?.facingMode;
        setIsFrontCamera(trackFacing !== 'environment');

        // iOS Safari: a freshly-assigned MediaStream can fire its metadata
        // events before we attach handlers, and it often needs an explicit
        // play() call (autoplay alone is unreliable). So we attach the
        // handlers first, then set the source, and also try to play() from
        // several triggers with the promise caught.
        const tryPlay = () => {
          const v = videoRef.current;
          if (!v) return;
          const p = v.play();
          if (p && typeof p.catch === 'function') {
            p.catch((err) => console.warn('Signature camera play() failed:', err));
          }
        };

        videoRef.current.onloadedmetadata = tryPlay;
        videoRef.current.oncanplay = tryPlay;
        videoRef.current.onplay = () => {
          startDetection();
        };

        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);

        // Kick off playback immediately too, in case the events already fired.
        tryPlay();
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

  // Every tap on the shutter gets a response: either a photo, or an explanation.
  //
  // Both of these used to be bare `return`s. `stream` is set the moment
  // getUserMedia resolves, but `video.videoWidth` stays 0 until the first frame
  // arrives — so there is a real window where the button reads "Capture
  // Signature", looks live, and swallows the tap in silence. Tapping a shutter
  // and getting nothing is indistinguishable from a broken page, which is why
  // people tap it again.
  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error('Camera is still starting up. One moment.');
      return;
    }
    stopDetection();
    const cropCanvas = cropCurrentFrameToCanvas();
    if (!cropCanvas) {
      toast.error('Could not read the camera frame. Please try again.');
      return;
    }
    setCapturedImage(cropCanvas.toDataURL('image/jpeg', 0.95));
    stopCamera();
  };

  // Auto-capture the sharpest frame once the signature is steady in the frame.
  const { autoCapturing } = useAutoCapture({
    ready: detectionReady && objectDetected,
    active: !capturedImage,
    getFrameCanvas: cropCurrentFrameToCanvas,
    onCapture: (dataUrl) => {
      stopDetection();
      setCapturedImage(dataUrl);
      stopCamera();
    },
  });

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

  // The shutter is never `disabled` — a natively disabled button fires no event
  // at all, so while the camera is being acquired every tap vanished with the
  // label stuck on "Loading...". It stays dimmed, but now it answers.
  const handleCaptureTap = () => {
    if (!stream) {
      toast.error('Waiting for the camera. Allow camera access if prompted.');
      return;
    }
    captureImage();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitImage = () => {
    dispatch(setSignatureImage(capturedImage));
    navigate('/ai-wow/signature-analysis/capture', { replace: true });
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
    navigate('/ai-wow/signature-analysis', { replace: true });
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
          navigate('/ai-wow/signature-analysis', { replace: true });
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
              {/* Capture area frame with 500px width */}
              <div className={styles.captureArea} ref={captureAreaRef}>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ top: 0, right: 0 }}></div>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: 0, left: 0 }}></div>
                <div className={`${styles.frameCorner} ${objectDetected ? styles.detected : styles.notDetected}`} style={{ bottom: 0, right: 0 }}></div>
              </div>
            </div>
            {!objectDetected && detectionReady && (
              <div className={styles.detectionMessage}>
                <p>Position your signature within the frame</p>
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
            type="button"
            className={`${styles.captureButton} ${!stream ? styles.disabled : ''}`}
            onClick={handleCaptureTap}
            aria-disabled={!stream}
            aria-label="Capture signature photo"
          >
            <div className={styles.captureIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="3" opacity={!stream ? "0.5" : "1"}/>
                <circle cx="20" cy="20" r="14" fill="white" opacity={!stream ? "0.5" : "1"}/>
              </svg>
            </div>
            <span className={styles.captureText}>
              {!stream ? 'Loading...' : (objectDetected ? 'Capture' : 'Capture Signature')}
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
