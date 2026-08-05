import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";

/**
 * Accepted hand-bounding-box area as a fraction of the whole video frame.
 * Below the minimum the hand is too far to read; above the maximum it overflows
 * the capture box. Both the validity check and the on-screen guidance derive
 * from these, so they can never disagree.
 */
const VALID_RATIO_MIN = 0.1;
const VALID_RATIO_MAX = 0.7;

/** Share of the 21 hand landmarks that must sit inside the capture box. */
const REQUIRED_LANDMARKS_INSIDE = 0.95;

/**
 * MediaPipe streams its WASM runtime and model from a CDN on the first send().
 * In embedded in-app browsers (Facebook / Instagram WebViews) that fetch can be
 * blocked outright, and the failure surfaces asynchronously from the Emscripten
 * glue rather than as a rejected promise. When that happens we must declare
 * detection unavailable instead of leaving the capture button permanently
 * blocked behind guidance the user can never satisfy.
 */
const MAX_SEND_FAILURES = 3;
const FIRST_RESULT_TIMEOUT_MS = 10000;

export const useHandDetection = ({ videoRef, canvasRef, getCaptureBoxBounds }) => {
  const [handsLoaded, setHandsLoaded] = useState(false);
  const [detectionUnavailable, setDetectionUnavailable] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [isPalmOpen, setIsPalmOpen] = useState(false);
  const [isInBounds, setIsInBounds] = useState(false);
  const [detectedHandSide, setDetectedHandSide] = useState(null);
  const [isTooFar, setIsTooFar] = useState(false);
  const [isTooClose, setIsTooClose] = useState(false);

  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const detectionStartedRef = useRef(false);
  const sendFailuresRef = useRef(0);
  const resultsSeenRef = useRef(false);
  const watchdogRef = useRef(null);

  /* ------------------ LOAD MEDIAPIPE HANDS ------------------ */
  useEffect(() => {
    let hands = null;

    const loadHands = async () => {
      try {
        hands = new Hands({
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

        setHandsLoaded(true);
      } catch (err) {
        console.error('Error loading hand detection:', err);
        // Construction failed, so detection can never run. Say so rather than
        // reporting "loaded" and blocking capture forever.
        setDetectionUnavailable(true);
      }
    };

    loadHands();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
      // Release the WASM instance and its worker. Without this, navigating in
      // and out of the camera screen leaks a full MediaPipe graph per visit,
      // which is enough to OOM low-end Android devices.
      detectionStartedRef.current = false;
      handsRef.current = null;
      try {
        hands?.close();
      } catch {
        /* already torn down */
      }
    };
  }, []);

  /* ------------------ DETECTION RESULTS ------------------ */
  const onResults = (results) => {
    // Inference is alive — clear the failure budget and the startup watchdog.
    resultsSeenRef.current = true;
    sendFailuresRef.current = 0;
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

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
    let handSide = null;
    let tooFar = false;
    let tooClose = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      if (results.multiHandedness && results.multiHandedness.length > 0) {
        const label = results.multiHandedness[0].label;
        const rawSide = label.toLowerCase();
        // MediaPipe reports handedness assuming a mirrored (selfie) input image.
        // getUserMedia delivers UN-mirrored pixels for BOTH front and rear
        // cameras (the front preview is only mirrored via CSS, not in the pixel
        // data). So the reported side must be swapped in both cases to get the
        // real anatomical hand. Previously the swap was applied for the front
        // camera only, which made the rear camera report e.g. a right hand as
        // "left" and blocked users from proceeding.
        handSide = rawSide === "right" ? "left" : "right";
      }

      // Hand size relative to the frame. validateHand accepts 0.1–0.7, so
      // anything below that band is too far and anything above it is too close.
      // These have to line up with VALID_RATIO_MIN/MAX or the UI ends up telling
      // the user to "move closer" when the hand is already filling the frame —
      // which is unfixable from the user's side and just produces dead taps on
      // the capture button.
      const { valid, ratio } = validateHand(landmarks, canvas.width, canvas.height);
      tooFar = ratio > 0 && ratio < VALID_RATIO_MIN;
      tooClose = ratio > VALID_RATIO_MAX;
      isValid = valid;

      palmOpen = isPalmOpenCheck(landmarks);
      inBounds = checkHandInBounds(landmarks, canvas.width, canvas.height);
      drawHand(ctx, landmarks, canvas.width, canvas.height, palmOpen && inBounds);
    }

    setHandDetected(isValid);
    setIsPalmOpen(palmOpen);
    setIsInBounds(inBounds);
    setDetectedHandSide(isValid ? handSide : null);
    setIsTooFar(tooFar);
    setIsTooClose(tooClose);
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
      return false;
    }
    
    // Get capture box bounds (as percentage of video dimensions)
    const boxLeft = captureBoxBounds.left * width;
    const boxRight = captureBoxBounds.right * width;
    const boxTop = captureBoxBounds.top * height;
    const boxBottom = captureBoxBounds.bottom * height;
    
    // NOTE: this runs once per animation frame. It used to console.log a freshly
    // built object on every call, which on mid-range mobile is enough to make the
    // camera preview stutter — keep this loop allocation-free and silent.
    let landmarksInside = 0;

    for (const landmark of landmarks) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      if (x >= boxLeft && x <= boxRight && y >= boxTop && y <= boxBottom) {
        landmarksInside++;
      }
    }

    return landmarksInside / landmarks.length >= REQUIRED_LANDMARKS_INSIDE;
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

  const validateHand = (landmarks, width, height) => {
    const xs = landmarks.map(l => l.x * width);
    const ys = landmarks.map(l => l.y * height);
    const handWidth = Math.max(...xs) - Math.min(...xs);
    const handHeight = Math.max(...ys) - Math.min(...ys);
    const ratio = (handWidth * handHeight) / (width * height);
    return { valid: ratio > VALID_RATIO_MIN && ratio < VALID_RATIO_MAX, ratio };
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
      sendFailuresRef.current += 1;
      if (sendFailuresRef.current >= MAX_SEND_FAILURES) {
        // The graph is not going to recover (typically a blocked CDN fetch for
        // the WASM runtime). Stop burning frames and hand control back to the UI.
        detectionStartedRef.current = false;
        setDetectionUnavailable(true);
        return;
      }
    }

    if (detectionStartedRef.current) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
  };

  /* ------------------ START/STOP DETECTION ------------------ */
  const startDetection = () => {
    // Gate on the ref, not the `handsLoaded` state: this is also called from
    // the video element's onplay handler, whose closure can predate the model
    // finishing load. Reading state there would bail out and detection would
    // never start.
    if (!handsRef.current || !videoRef.current || detectionStartedRef.current) return;

    detectionStartedRef.current = true;

    // If inference never produces a single result, treat detection as
    // unavailable so the capture button stops blocking.
    if (!resultsSeenRef.current && !watchdogRef.current) {
      watchdogRef.current = setTimeout(() => {
        watchdogRef.current = null;
        if (!resultsSeenRef.current) {
          detectionStartedRef.current = false;
          setDetectionUnavailable(true);
        }
      }, FIRST_RESULT_TIMEOUT_MS);
    }

    detectLoop();
  };

  const stopDetection = () => {
    detectionStartedRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    setHandDetected(false);
    setIsPalmOpen(false);
    setIsInBounds(false);
    setDetectedHandSide(null);
    setIsTooFar(false);
    setIsTooClose(false);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return {
    handsLoaded,
    detectionUnavailable,
    handDetected,
    isPalmOpen,
    isInBounds,
    detectedHandSide,
    isTooFar,
    isTooClose,
    startDetection,
    stopDetection
  };
};
