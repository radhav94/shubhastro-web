import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export const useFaceDetection = ({ videoRef, canvasRef, getCircleBounds }) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInCircle, setFaceInCircle] = useState(false);
  const [isTooFar, setIsTooFar] = useState(false);
  
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
        console.log('✅ Face detection models loaded successfully');
        setModelsLoaded(true);
      } catch (err) {
        console.error('❌ Error loading face detection models:', err);
      }
    };

    loadModels();
  }, []);

  /* ------------------ DETECTION LOOP ------------------ */
  const startDetection = () => {
    console.log("startDetection called");
    
    if (!modelsLoaded || detectionStartedRef.current) return;
    
    console.log("🚀 Starting face detection");
    
    stoppedRef.current = false;
    detectionStartedRef.current = true;
    
    detectLoop();
  };

  const stopDetection = () => {
    console.log("🛑 Stopping face detection");
    
    stoppedRef.current = true;
    detectionStartedRef.current = false;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const detectLoop = async () => {

    if (stoppedRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,  // Faster and better for webcam
          scoreThreshold: 0.2
        })
      );


      if (stoppedRef.current) return;

      if (detection) {
        setFaceDetected(true);
        
        const { box } = detection;

        // Check if face is too far (box too small relative to video)
        const faceRatio = (box.width * box.height) / (video.videoWidth * video.videoHeight);
        setIsTooFar(faceRatio < 0.02); // less than 2% of frame = too far

        // Check if face is within the circle guide
        if (getCircleBounds) {
          const circleBounds = getCircleBounds();
          if (circleBounds) {
            const { centerX, centerY, radius } = circleBounds;
            const scaleX = video.videoWidth / video.offsetWidth;
            const scaleY = video.videoHeight / video.offsetHeight;
            const scaledCX = centerX * scaleX;
            const scaledCY = centerY * scaleY;
            const scaledR = radius * Math.min(scaleX, scaleY);

            // Check if face box center is within circle
            const faceCX = box.x + box.width / 2;
            const faceCY = box.y + box.height / 2;
            const dist = Math.sqrt((faceCX - scaledCX) ** 2 + (faceCY - scaledCY) ** 2);
            setFaceInCircle(dist + Math.max(box.width, box.height) / 2 <= scaledR * 1.2);
          }
        }

        drawBox(canvas, video, box, true);
      } else {
        setFaceDetected(false);
        setFaceInCircle(false);
        setIsTooFar(false);
        clearCanvas(canvas);
      }
    } catch (err) {
      console.error("Face detection error:", err);
    }

    if (!stoppedRef.current) {
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
    
    // ✅ FIX 5: Relaxed circle detection threshold (60% instead of 90%)
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
    return percentageInside >= 0.6; // ✅ 60% is more realistic for webcam detection
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
    isTooFar,
    startDetection,
    stopDetection
  };
};
