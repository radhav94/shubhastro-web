import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";

export const useHandDetection = ({ videoRef, canvasRef, getCaptureBoxBounds }) => {
  const [handsLoaded, setHandsLoaded] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [isPalmOpen, setIsPalmOpen] = useState(false);
  const [isInBounds, setIsInBounds] = useState(false);
  
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const detectionStartedRef = useRef(false);

  /* ------------------ LOAD MEDIAPIPE HANDS ------------------ */
  useEffect(() => {
    const loadHands = async () => {
      try {
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);
        handsRef.current = hands;
        
        console.log('Hand detection loaded successfully');
        setHandsLoaded(true);
      } catch (err) {
        console.error('Error loading hand detection:', err);
      }
    };

    loadHands();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  /* ------------------ DETECTION RESULTS ------------------ */
  const onResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const video = videoRef.current;
    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let isValid = false;
    let palmOpen = false;
    let inBounds = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Check if palm is open by analyzing finger positions
      palmOpen = isPalmOpenCheck(landmarks);
      
      // Check if hand is within capture box bounds
      inBounds = checkHandInBounds(landmarks, canvas.width, canvas.height);
      
      // Draw hand landmarks
      drawHand(ctx, landmarks, canvas.width, canvas.height, palmOpen && inBounds);
      
      // Validate hand detection
      isValid = validateHand(landmarks, canvas.width, canvas.height);
    }

    setHandDetected(isValid);
    setIsPalmOpen(palmOpen);
    setIsInBounds(inBounds);
    
    console.log('📊 Detection States:', { 
      handDetected: isValid, 
      isPalmOpen: palmOpen, 
      isInBounds: inBounds 
    });
  };

  /* ------------------ CHECK HAND IN BOUNDS ------------------ */
  const checkHandInBounds = (landmarks, width, height) => {
    if (!getCaptureBoxBounds) {
      console.log('⚠️ No capture box bounds function provided');
      return false;
    }
    
    // Get capture box bounds dynamically by calling the function
    const captureBoxBounds = getCaptureBoxBounds();
    
    if (!captureBoxBounds) {
      console.log('⚠️ No capture box bounds returned');
      return false;
    }
    
    // Get capture box bounds (as percentage of video dimensions)
    const boxLeft = captureBoxBounds.left * width;
    const boxRight = captureBoxBounds.right * width;
    const boxTop = captureBoxBounds.top * height;
    const boxBottom = captureBoxBounds.bottom * height;
    
    // Check if ALL hand landmarks are within bounds (very strict checking)
    let landmarksInside = 0;
    let landmarksOutside = 0;
    
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      const isInside = x >= boxLeft && x <= boxRight && y >= boxTop && y <= boxBottom;
      
      if (isInside) {
        landmarksInside++;
      } else {
        landmarksOutside++;
      }
    });
    
    // Calculate percentage
    const percentageInside = landmarksInside / landmarks.length;
    const isInBounds = percentageInside >= 0.95; // 95% must be inside (very strict)
    
    console.log('🖐️ Hand Detection:', {
      total: landmarks.length,
      inside: landmarksInside,
      outside: landmarksOutside,
      percentage: (percentageInside * 100).toFixed(1) + '%',
      isInBounds: isInBounds,
      boxBounds: { 
        left: boxLeft.toFixed(0), 
        right: boxRight.toFixed(0), 
        top: boxTop.toFixed(0), 
        bottom: boxBottom.toFixed(0) 
      }
    });
    
    return isInBounds;
  };

  /* ------------------ PALM OPEN CHECK ------------------ */
  const isPalmOpenCheck = (landmarks) => {
    // Check if fingers are extended
    // Index finger tip (8) vs index finger base (6)
    const indexExtended = landmarks[8].y < landmarks[6].y;
    
    // Middle finger tip (12) vs middle finger base (10)
    const middleExtended = landmarks[12].y < landmarks[10].y;
    
    // Ring finger tip (16) vs ring finger base (14)
    const ringExtended = landmarks[16].y < landmarks[14].y;
    
    // Pinky finger tip (20) vs pinky finger base (18)
    const pinkyExtended = landmarks[20].y < landmarks[18].y;
    
    // Palm is open if at least 3 fingers are extended
    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;
    return extendedCount >= 3;
  };

  /* ------------------ VALIDATE HAND ------------------ */
  const validateHand = (landmarks, width, height) => {
    // Calculate hand bounding box
    const xs = landmarks.map(l => l.x * width);
    const ys = landmarks.map(l => l.y * height);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const handWidth = maxX - minX;
    const handHeight = maxY - minY;
    const handArea = handWidth * handHeight;
    const videoArea = width * height;
    const ratio = handArea / videoArea;
    
    // Hand should be between 10% and 70% of frame
    return ratio > 0.1 && ratio < 0.7;
  };

  /* ------------------ DRAW HAND ------------------ */
  const drawHand = (ctx, landmarks, width, height, palmOpen) => {
    // Don't draw debug box - we'll use the orange CSS box
    
    // Draw connections between landmarks
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    const color = palmOpen ? '#10b981' : '#ef4444';

    // Draw connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = color;
    landmarks.forEach(landmark => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  /* ------------------ DETECTION LOOP ------------------ */
  const detectLoop = async () => {
    const video = videoRef.current;
    
    if (!video || video.readyState !== 4 || !detectionStartedRef.current) {
      if (detectionStartedRef.current) {
        rafRef.current = requestAnimationFrame(detectLoop);
      }
      return;
    }

    try {
      if (handsRef.current) {
        await handsRef.current.send({ image: video });
      }
    } catch (err) {
      console.error('Hand detection error:', err);
    }

    if (detectionStartedRef.current) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
  };

  /* ------------------ START/STOP DETECTION ------------------ */
  const startDetection = () => {
    if (!handsLoaded || !videoRef.current || detectionStartedRef.current) {
      console.log('Cannot start detection - hands loaded:', handsLoaded);
      return;
    }

    console.log('Starting hand detection...');
    detectionStartedRef.current = true;
    detectLoop();
  };

  const stopDetection = () => {
    detectionStartedRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setHandDetected(false);
    setIsPalmOpen(false);
    setIsInBounds(false);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return {
    handsLoaded,
    handDetected,
    isPalmOpen,
    isInBounds,
    startDetection,
    stopDetection
  };
};
