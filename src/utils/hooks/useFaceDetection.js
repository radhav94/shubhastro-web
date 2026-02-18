import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export const useFaceDetection = ({ videoRef, canvasRef, getCircleBounds }) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInCircle, setFaceInCircle] = useState(false);
  
  const detectionStartedRef = useRef(false);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false); // ⭐ NEW - Hard stop flag

  /* ------------------ LOAD MODELS ------------------ */
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        console.log('Face detection models loaded successfully');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face detection models:', err);
      }
    };

    loadModels();
  }, []);

  /* ------------------ DETECTION LOOP ------------------ */
  const startDetection = () => {
    if (!modelsLoaded || detectionStartedRef.current) return;
    
    stoppedRef.current = false; // ⭐ Reset stop flag
    detectionStartedRef.current = true;
    console.log('Starting face detection with RAF');
    detectLoop();
  };

  const stopDetection = () => {
    console.log('Stopping face detection, cancelling RAF');
    stoppedRef.current = true; // ⭐ HARD STOP - prevents late async results
    detectionStartedRef.current = false;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      console.log('RAF cancelled');
    }
    
    setFaceDetected(false);
    clearCanvas(canvasRef.current);
  };

  const detectLoop = async () => {
    if (stoppedRef.current) return; // ⭐ EARLY EXIT if stopped
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.4
          })
        )
        .withFaceLandmarks();

      if (stoppedRef.current) return; // ⭐ IGNORE LATE RESULT after async operation

      let isValid = false;
      let isInCircle = false;

      if (detection) {
        const { box, score } = detection.detection;
        const landmarks = detection.landmarks;
        
        // Get key facial landmarks
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const mouth = landmarks.getMouth();
        
        // Check if all key landmarks are detected
        const hasAllFeatures = nose?.length > 0 && 
                               leftEye?.length > 0 && 
                               rightEye?.length > 0 && 
                               mouth?.length > 0;
        
        const faceArea = box.width * box.height;
        const videoArea = video.videoWidth * video.videoHeight;
        const ratio = faceArea / videoArea;

        isValid = score > 0.5 && ratio > 0.04 && ratio < 0.7 && hasAllFeatures;
        
        // Check if face is within circular boundary
        if (isValid && getCircleBounds) {
          isInCircle = checkFaceInCircle(box, landmarks, video, getCircleBounds);
        }
        
        drawBox(canvas, video, box, isValid);
      } else {
        clearCanvas(canvas);
      }

      setFaceDetected(prev => (prev !== isValid ? isValid : prev));
      setFaceInCircle(prev => (prev !== isInCircle ? isInCircle : prev));
    } catch (err) {
      if (!stoppedRef.current) {
        console.error("Face detection error:", err);
      }
    }

    if (detectionStartedRef.current && !stoppedRef.current) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
  };

  /* ------------------ CANVAS HELPERS ------------------ */
  const checkFaceInCircle = (box, landmarks, video, getCircleBounds) => {
    const circleBounds = getCircleBounds();
    if (!circleBounds) return false;

    const { centerX, centerY, radius } = circleBounds;
    
    // Scale circle bounds to video dimensions
    const scaleX = video.videoWidth / video.offsetWidth;
    const scaleY = video.videoHeight / video.offsetHeight;
    
    const scaledCenterX = centerX * scaleX;
    const scaledCenterY = centerY * scaleY;
    const scaledRadius = radius * Math.min(scaleX, scaleY);

    // Get all landmark points
    const allPoints = landmarks.positions;
    
    // Check if at least 90% of landmarks are inside the circle
    let pointsInside = 0;
    allPoints.forEach(point => {
      const dx = point.x - scaledCenterX;
      const dy = point.y - scaledCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= scaledRadius) {
        pointsInside++;
      }
    });

    const percentageInside = pointsInside / allPoints.length;
    return percentageInside >= 0.9; // 90% of face landmarks must be inside circle
  };

  const drawBox = (canvas, video, box, valid) => {
    if (!canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = valid ? "#10b981" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  };

  const clearCanvas = canvas => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return {
    modelsLoaded,
    faceDetected,
    faceInCircle,
    startDetection,
    stopDetection
  };
};
