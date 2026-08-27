import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './GemstoneCamera.module.scss';
import { useObjectDetection } from '../../../../utils/hooks/useObjectDetection';
import { useAutoCapture } from '../../../../utils/hooks/useAutoCapture';
import { setGemstoneImage } from '../../../../redux/aiwow/aiwowSlice';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';
import usePreventPinchZoom from '../../../../utils/hooks/usePreventPinchZoom';
import toast from '../../../../component/toast';
import { compressImage } from '../../../../utils/helper/compressImage';
import { isInAppBrowser } from '../../../../utils/deviceInfo';
import { trackEvent } from '../../../../utils/analytics';

const GemstoneCamera = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  usePreventPinchZoom(); // block pinch/gesture zoom while the camera is open
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
  const [facingMode, setFacingMode] = useState('environment');
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  // Upload fallback on the camera-error screen. See the error branch below for
  // why that screen needs one.
  const uploadInputRef = useRef(null);
  const [isPreparingUpload, setIsPreparingUpload] = useState(false);

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

  // Every tap on the shutter gets a response: either a photo, or an explanation.
  // `stream` is set as soon as getUserMedia resolves but `video.videoWidth`
  // stays 0 until the first frame lands, so there is a window where the button
  // looks live and used to swallow the tap in silence.
  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error('Camera is still starting up. One moment.');
      return;
    }
    stopDetection();
    const canvas = cropCurrentFrameToCanvas();
    if (!canvas) {
      toast.error('Could not read the camera frame. Please try again.');
      return;
    }
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
    stopCamera();
  };

  // The shutter is never `disabled` — a natively disabled button fires no event
  // at all, so while the camera was being acquired every tap vanished with the
  // label stuck on "Loading...". It stays dimmed, but now it answers.
  const handleCaptureTap = () => {
    if (!stream) {
      toast.error('Waiting for the camera. Allow camera access if prompted.');
      return;
    }
    captureImage();
  };

  // Auto-capture the sharpest frame once the gemstone is steady in the frame.
  // Gemstone detection is heuristic, so require a strong-quality, longer-held
  // detection before auto-capturing to avoid firing on false positives.
  const { autoCapturing } = useAutoCapture({
    // `detectionQuality` for a gemstone rarely exceeds ~40 even on a valid
    // detection, so gating on >=55 meant auto-capture never fired. `objectDetected`
    // is already temporally smoothed (stable over multiple frames), and the hold
    // time below guards against false positives — that's sufficient.
    ready: detectionReady && objectDetected,
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
    navigate('/ai-wow/gemstone-authenticity/capture', { replace: true });
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

  /*
    Upload fallback for the camera-error screen.

    Mirrors GemstoneLanding's handleFileChange, including the `event.target.value`
    reset (without it, re-picking the identical photo fires no change event at all)
    and the `preparing` state (compressImage re-encodes through a canvas and waits
    up to 8s before falling back, which is a long unlit pause on a webview).
  */
  const handleUploadClick = () => {
    if (isPreparingUpload) {
      toast.info('Preparing your photo — one moment.');
      return;
    }
    uploadInputRef.current?.click();
  };

  const handleUploadedFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      trackEvent('shubh_ai_input_provided', { feature_name: 'gemstone-authenticity', input_type: 'image' });
      setIsPreparingUpload(true);
      compressImage(file)
        .then((dataUrl) => {
          if (!localStorage.getItem('shubhtalk_customer_token')) {
            // Hold the photo so the guest flow can submit it once they verify.
            setCapturedImage(dataUrl);
            setShowGuestAuthModal(true);
            return;
          }
          dispatch(setGemstoneImage(dataUrl));
          navigate('/ai-wow/gemstone-authenticity/capture', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to process selected image:', err);
          toast.error('Could not read that image. Please try a different photo.');
        })
        .finally(() => setIsPreparingUpload(false));
    }
    event.target.value = '';
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
    navigate('/ai-wow/gemstone-authenticity', { replace: true });
  };

  /*
    Checked before the error branch, not after.

    The camera-error screen can now start the guest flow (a guest who uploads a
    photo from it has to verify before the analysis runs). `error` stays set while
    that happens, so with the old ordering the error branch would win and the
    modal would never render — the visitor would pick a photo and watch the same
    error screen sit there. Hoisting this also keeps its original intent: while
    the guest flow is open, nothing else on this route should be on screen.
  */
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
          {/*
            In an in-app webview the advice in `error` above is unactionable: the
            Google app, Instagram and Facebook expose no per-site camera
            permission, so "allow camera access in your browser settings" points
            at a screen that does not exist. FaceReadingCamera already says this;
            this screen did not.
          */}
          {isInAppBrowser() && (
            <p className={styles.errorText}>
              You&apos;re in an app&apos;s built-in browser, which blocks the camera.
              Upload a photo instead, or open shubhastro.ai in Chrome or Safari.
            </p>
          )}
          {/*
            "Try Again" reloads and "Go Back" returns to the intro page — so where
            the camera is blocked rather than merely un-permitted, this screen was
            a closed loop: every route off it led straight back to the same
            failure, even though uploading a photo works perfectly well and
            produces the identical analysis. Offer that here.
          */}
          <div className={styles.errorButtons}>
            <button
              className={styles.retryButton}
              onClick={handleUploadClick}
              aria-busy={isPreparingUpload}
            >
              {isPreparingUpload ? 'Preparing photo…' : 'Upload a photo instead'}
            </button>
            <button className={styles.backButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
            <button className={styles.backButton} onClick={handleBack}>
              Go Back
            </button>
          </div>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUploadedFile}
          />
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
            type="button"
            className={`${styles.captureButton} ${!stream ? styles.disabled : ''}`}
            onClick={handleCaptureTap}
            aria-disabled={!stream}
            aria-label="Capture gemstone photo"
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
