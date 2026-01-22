import { useEffect, useRef, useState } from "react";

/**
 * Generic object detection hook using color and shape analysis
 * Can be configured for different object types (gemstone, signature, cloth)
 */
export const useObjectDetection = ({ videoRef, canvasRef, detectionType = 'object' }) => {
  const [detectionReady, setDetectionReady] = useState(true); // No models to load
  const [objectDetected, setObjectDetected] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState(0);
  
  const rafRef = useRef(null);
  const detectionStartedRef = useRef(false);
  const detectionHistoryRef = useRef([]); // Temporal smoothing

  useEffect(() => {
    // No models to load for basic detection
    setDetectionReady(true);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  /* ------------------ DETECTION LOOP ------------------ */
  const detectLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4 || !detectionStartedRef.current) {
      if (detectionStartedRef.current) {
        rafRef.current = requestAnimationFrame(detectLoop);
      }
      return;
    }

    try {
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Analyze based on detection type
      let detected = false;
      let quality = 0;

      switch (detectionType) {
        case 'gemstone':
          ({ detected, quality } = detectGemstone(imageData, canvas.width, canvas.height));
          break;
        case 'signature':
          ({ detected, quality } = detectSignature(imageData, canvas.width, canvas.height));
          break;
        case 'cloth':
          ({ detected, quality } = detectCloth(imageData, canvas.width, canvas.height));
          break;
        default:
          ({ detected, quality } = detectGenericObject(imageData, canvas.width, canvas.height));
      }

      // Draw detection overlay
      drawDetectionOverlay(ctx, canvas.width, canvas.height, detected, quality);

      // Temporal smoothing for stable detection
      detectionHistoryRef.current.push(detected);
      if (detectionHistoryRef.current.length > 10) {
        detectionHistoryRef.current.shift();
      }

      const stableDetected = detectionHistoryRef.current.filter(Boolean).length >= 7;

      setObjectDetected(stableDetected);
      setDetectionQuality(quality);
    } catch (err) {
      console.error('Object detection error:', err);
    }

    if (detectionStartedRef.current) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
  };

  /* ------------------ GEMSTONE DETECTION ------------------ */
  const detectGemstone = (imageData, width, height) => {
    const data = imageData.data;
    let colorfulPixels = 0;
    let brightPixels = 0;
    let totalPixels = data.length / 4;

    // Sample center region (gemstone should be centered)
    const centerX = width / 2;
    const centerY = height / 2;
    const sampleRadius = Math.min(width, height) * 0.3;

    for (let y = centerY - sampleRadius; y < centerY + sampleRadius; y++) {
      for (let x = centerX - sampleRadius; x < centerX + sampleRadius; x++) {
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check for color saturation (gemstones are usually colorful)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        if (saturation > 0.2) colorfulPixels++;
        if (max > 100) brightPixels++;
      }
    }

    const sampleSize = Math.PI * sampleRadius * sampleRadius;
    const colorRatio = colorfulPixels / sampleSize;
    const brightRatio = brightPixels / sampleSize;

    // Gemstone detected if center has colorful and bright pixels
    const detected = colorRatio > 0.15 && brightRatio > 0.3;
    const quality = Math.min(100, Math.round((colorRatio + brightRatio) * 50));

    return { detected, quality };
  };

  /* ------------------ SIGNATURE DETECTION ------------------ */
  const detectSignature = (imageData, width, height) => {
    const data = imageData.data;
    let darkPixels = 0;
    let contrastPixels = 0;
    const totalPixels = data.length / 4;

    // Detect dark strokes (signature ink) - more lenient threshold
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      // More lenient - detect darker pixels
      if (brightness < 150) darkPixels++;
    }

    // Enhanced edge detection for signature strokes
    for (let y = 1; y < height - 1; y += 2) { // Sample every other row for performance
      for (let x = 1; x < width - 1; x += 2) { // Sample every other column
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Check horizontal neighbor
        const rightI = (y * width + (x + 1)) * 4;
        const rightBrightness = (data[rightI] + data[rightI + 1] + data[rightI + 2]) / 3;
        
        // Check vertical neighbor
        const downI = ((y + 1) * width + x) * 4;
        const downBrightness = (data[downI] + data[downI + 1] + data[downI + 2]) / 3;
        
        // More lenient edge detection
        if (Math.abs(brightness - rightBrightness) > 30 || Math.abs(brightness - downBrightness) > 30) {
          contrastPixels++;
        }
      }
    }

    const darkRatio = darkPixels / totalPixels;
    const contrastRatio = contrastPixels / (totalPixels / 4); // Adjusted for sampling

    console.log('Signature detection:', { darkRatio, contrastRatio, darkPixels, contrastPixels });

    // More lenient thresholds - signature detected if there are dark marks with some contrast
    const detected = darkRatio > 0.03 && darkRatio < 0.7 && contrastRatio > 0.01;
    const quality = Math.min(100, Math.round((darkRatio * 100 + contrastRatio * 200)));

    return { detected, quality };
  };

  /* ------------------ IMPROVED CLOTH DETECTION ------------------ */
  const detectCloth = (imageData, width, height) => {
    const data = imageData.data;

    let textureScore = 0;
    let colorfulPixels = 0;
    let sampledPixels = 0;

    // Sample center-heavy grid (cloth is usually centered)
    const startX = Math.floor(width * 0.15);
    const endX = Math.floor(width * 0.85);
    const startY = Math.floor(height * 0.2);
    const endY = Math.floor(height * 0.85);

    const step = 8; // lower = more accuracy, higher = faster

    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const variance = max - min;

        textureScore += variance;

        // Saturation check
        const saturation = max === 0 ? 0 : variance / max;
        if (saturation > 0.12) colorfulPixels++;

        sampledPixels++;
      }
    }

    const avgTexture = textureScore / sampledPixels;
    const colorRatio = colorfulPixels / sampledPixels;

    // Final decision
    const detected =
      avgTexture > 18 &&       // fabric texture
      colorRatio > 0.18 &&     // not plain background
      colorRatio < 0.9;        // avoid noise

    const quality = Math.min(
      100,
      Math.round((avgTexture * 2 + colorRatio * 100))
    );

    return { detected, quality };
  };

  /* ------------------ GENERIC OBJECT DETECTION ------------------ */
  const detectGenericObject = (imageData, width, height) => {
    const data = imageData.data;
    let nonWhitePixels = 0;
    const totalPixels = data.length / 4;

    // Detect any object (non-white background)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r < 240 || g < 240 || b < 240) nonWhitePixels++;
    }

    const objectRatio = nonWhitePixels / totalPixels;
    const detected = objectRatio > 0.2 && objectRatio < 0.9;
    const quality = Math.min(100, Math.round(objectRatio * 100));

    return { detected, quality };
  };

  /* ------------------ DRAW DETECTION OVERLAY ------------------ */
  const drawDetectionOverlay = (ctx, width, height, detected) => {
    if (!detected) return;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.strokeRect(
      width * 0.1,
      height * 0.15,
      width * 0.8,
      height * 0.7
    );

    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.fillRect(
      width * 0.1,
      height * 0.15,
      width * 0.8,
      height * 0.7
    );
  };

  /* ------------------ START/STOP DETECTION ------------------ */
  const startDetection = () => {
    if (!detectionReady || !videoRef.current || detectionStartedRef.current) {
      console.log('Cannot start detection - ready:', detectionReady);
      return;
    }

    console.log(`Starting ${detectionType} detection...`);
    detectionStartedRef.current = true;
    detectLoop();
  };

  const stopDetection = () => {
    detectionStartedRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setObjectDetected(false);
    setDetectionQuality(0);
    detectionHistoryRef.current = []; // Clear history
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return {
    detectionReady,
    objectDetected,
    detectionQuality,
    startDetection,
    stopDetection
  };
};
