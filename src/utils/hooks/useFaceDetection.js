import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export const useFaceDetection = ({ videoRef, canvasRef, getCircleBounds }) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  /*
   * Set when the weights under /models cannot be fetched at all.
   *
   * This used to be a bare console.error, which left `modelsLoaded` false
   * forever with nothing on screen to say so. Face detection only gates the
   * shutter and drives auto-capture, so a failed load silently bricked the whole
   * camera screen: the shutter stayed labelled "Loading...", `canCapture` never
   * became true, the framing hint never rendered (it requires modelsLoaded), and
   * no error view appeared either — so the upload fallback was unreachable. The
   * visitor was left tapping a shutter that only ever answered "give it a
   * moment". Callers use this to fall back to a plain manual capture.
   */
  const [modelsFailed, setModelsFailed] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInCircle, setFaceInCircle] = useState(false);
  const [isTooFar, setIsTooFar] = useState(false);
  const [isPartialFace, setIsPartialFace] = useState(false);
  
  const detectionStartedRef = useRef(false);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false); // ⭐ NEW - Hard stop flag

  /* ------------------ LOAD MODELS ------------------ */
  useEffect(() => {
    let cancelled = false;

    const loadOnce = () => {
      const MODEL_URL = "/models";
      return Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);
    };

    const loadModels = async () => {
      try {
        await loadOnce();
        if (cancelled) return;
        setModelsLoaded(true);
      } catch (err) {
        // One retry: the usual cause is a dropped request on a mobile
        // connection rather than a missing file, and the weights are cached
        // after a successful fetch.
        console.warn('Face model load failed, retrying once:', err);
        try {
          await loadOnce();
          if (cancelled) return;
          setModelsLoaded(true);
        } catch (retryErr) {
          if (cancelled) return;
          console.error('Face model load failed after retry:', retryErr);
          setModelsFailed(true);
        }
      }
    };

    loadModels();
    return () => { cancelled = true; };
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
          inputSize: 160,
          scoreThreshold: 0.2
        })
      ).withFaceLandmarks();


      if (stoppedRef.current) return;

      if (detection) {
        setFaceDetected(true);
        
        const box = detection.detection.box;
        const landmarks = detection.landmarks;

        // Check if face is too far (box too small relative to video)
        const faceRatio = (box.width * box.height) / (video.videoWidth * video.videoHeight);
        setIsTooFar(faceRatio < 0.02);

        // A partial face is one that is clipped by the video frame edges — e.g.
        // only half the face is visible. Reject those so we never analyse a
        // cropped/incomplete face. We use both the detection box and the
        // outermost landmarks (jaw + eyebrows) to know the true face extent.
        const pts = landmarks?.positions || [];
        let minX = box.x, minY = box.y;
        let maxX = box.x + box.width, maxY = box.y + box.height;
        for (const p of pts) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        // Margin: if the face extent touches within ~1.5% of any frame edge,
        // treat it as clipped/partial.
        const marginX = video.videoWidth * 0.015;
        const marginY = video.videoHeight * 0.015;
        const clipped =
          minX <= marginX ||
          minY <= marginY ||
          maxX >= video.videoWidth - marginX ||
          maxY >= video.videoHeight - marginY;
        setIsPartialFace(clipped);

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

            // Use the detection box (not the landmark-extended extent) for the
            // circle checks — mirror X since the front camera video is
            // CSS-mirrored.
            const bLeft = video.videoWidth - (box.x + box.width);
            const bRight = video.videoWidth - box.x;
            const bTop = box.y;
            const bBottom = box.y + box.height;

            const faceCX = (bLeft + bRight) / 2;
            const faceCY = (bTop + bBottom) / 2;
            const centreDist = Math.sqrt((faceCX - scaledCX) ** 2 + (faceCY - scaledCY) ** 2);

            // Accept when the face is reasonably centred in the guide circle.
            // (A face that fills the circle has a detection box whose corners
            // fall just outside the circle radius, so we must NOT require the
            // box corners to be inside — that wrongly rejected well-placed
            // faces. Off-centre / half-in profile faces have a centre far from
            // the circle centre and are rejected here; cut-off faces are
            // rejected by the frame-edge `clipped` check.)
            const centreInside = centreDist <= scaledR * 0.6;
            const isInCircle = centreInside && !clipped;
            setFaceInCircle(isInCircle);

            if (isInCircle) {
              drawFaceMesh(canvas, video, landmarks);
            } else {
              clearCanvas(canvas);
            }
          } else {
            clearCanvas(canvas);
          }
        } else {
          drawFaceMesh(canvas, video, landmarks);
        }
      } else {
        setFaceDetected(false);
        setFaceInCircle(false);
        setIsTooFar(false);
        setIsPartialFace(false);
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

  const drawFaceMesh = (canvas, video, landmarks) => {
    if (!canvas || !landmarks) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pts = landmarks.positions;

    // Create virtual forehead points (not in 68-point model)
    // Estimate from eyebrow positions
    const foreheadCenter = { x: (pts[21].x + pts[22].x) / 2, y: pts[19].y - (pts[30].y - pts[19].y) * 0.55 };
    const foreheadLeft = { x: pts[17].x, y: pts[17].y - (pts[30].y - pts[17].y) * 0.4 };
    const foreheadRight = { x: pts[26].x, y: pts[26].y - (pts[30].y - pts[26].y) * 0.4 };
    const foreheadMidLeft = { x: (foreheadCenter.x + foreheadLeft.x) / 2, y: (foreheadCenter.y + foreheadLeft.y) / 2 - 5 };
    const foreheadMidRight = { x: (foreheadCenter.x + foreheadRight.x) / 2, y: (foreheadCenter.y + foreheadRight.y) / 2 - 5 };

    // Key points: index → coordinate
    // Using 68-point indices + virtual forehead points (F0-F4)
    const keyPts = {
      F0: foreheadCenter,
      F1: foreheadLeft,
      F2: foreheadRight,
      F3: foreheadMidLeft,
      F4: foreheadMidRight,
      0: pts[0],    // jaw left
      4: pts[4],    // jaw mid-left
      8: pts[8],    // chin
      12: pts[12],  // jaw mid-right
      16: pts[16],  // jaw right
      17: pts[17],  // left eyebrow outer
      19: pts[19],  // left eyebrow mid
      21: pts[21],  // left eyebrow inner
      22: pts[22],  // right eyebrow inner
      24: pts[24],  // right eyebrow mid
      26: pts[26],  // right eyebrow outer
      27: pts[27],  // nose bridge top
      30: pts[30],  // nose tip
      31: pts[31],  // nose left
      35: pts[35],  // nose right
      33: pts[33],  // nose bottom center
    };

    // Triangular connections — NO eyes, NO lips
    const connections = [
      // Forehead triangles
      ["F0", "F3", "F4"],
      ["F3", "F1", 17],
      ["F4", "F2", 26],
      ["F3", "F0", 19],
      ["F4", "F0", 24],
      ["F1", 17, 0],
      ["F2", 26, 16],
      // Forehead to eyebrows
      ["F3", 17, 19],
      ["F4", 26, 24],
      ["F0", 19, 21],
      ["F0", 24, 22],
      ["F0", 21, 22],
      // Eyebrows to nose
      [21, 27, 19],
      [22, 27, 24],
      // Nose bridge
      [27, 31, 21],
      [27, 35, 22],
      // Nose
      [31, 33, 30],
      [33, 35, 30],
      // Cheek triangles
      [0, 17, 4],
      [4, 17, 31],
      [4, 31, 8],
      [8, 33, 4],
      [8, 33, 12],
      [12, 35, 16],
      [16, 26, 12],
      [12, 26, 35],
    ];

    // Draw lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;

    connections.forEach(([a, b, c]) => {
      const pA = keyPts[a];
      const pB = keyPts[b];
      const pC = keyPts[c];
      if (pA && pB && pC) {
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.lineTo(pC.x, pC.y);
        ctx.closePath();
        ctx.stroke();
      }
    });

    // Draw dots only at key points
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    Object.values(keyPts).forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
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
    modelsFailed,
    faceDetected,
    faceInCircle,
    isTooFar,
    isPartialFace,
    startDetection,
    stopDetection
  };
};
