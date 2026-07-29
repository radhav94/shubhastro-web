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
  const lastRunRef = useRef(0); // Throttle timestamp

  // How often the (CPU-heavy) pixel analysis actually runs. Running it every
  // animation frame on a full-res frame freezes the camera on iOS Safari, so
  // we throttle to a few times per second — plenty for detection feedback.
  const DETECTION_INTERVAL_MS = 150;
  // Downscale the analysis canvas: pixel heuristics don't need full 720p, and
  // a smaller buffer keeps getImageData cheap on mobile.
  const MAX_ANALYSIS_DIM = 320;

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

    // Throttle the heavy work to DETECTION_INTERVAL_MS.
    const now = performance.now();
    if (now - lastRunRef.current < DETECTION_INTERVAL_MS) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    lastRunRef.current = now;

    try {
      // Set canvas dimensions (downscaled for cheaper pixel analysis).
      const scale = Math.min(1, MAX_ANALYSIS_DIM / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

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

      const stableDetected = detectionHistoryRef.current.filter(Boolean).length >= 5;

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
  // Stricter heuristic to avoid false positives (skin, background, clothes).
  // A real gemstone in frame: a colourful + bright object in the centre that
  // (a) has bright specular highlights (sparkle) and (b) clearly stands out
  // from the surrounding background.
  const detectGemstone = (imageData, width, height) => {
    const data = imageData.data;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerRadius = Math.min(width, height) * 0.22; // tight centre
    const bgRadius = Math.min(width, height) * 0.45;      // surrounding ring
    const centerR2 = centerRadius * centerRadius;
    const bgR2 = bgRadius * bgRadius;

    let colorfulPixels = 0;
    let brightPixels = 0;
    let specularPixels = 0; // sparkle: very bright highlights
    let centerCount = 0;
    let centerBrightnessSum = 0;

    for (let y = Math.floor(centerY - centerRadius); y < centerY + centerRadius; y++) {
      for (let x = Math.floor(centerX - centerRadius); x < centerX + centerRadius; x++) {
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy > centerR2) continue; // circular sample

        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = (r + g + b) / 3;

        centerCount++;
        centerBrightnessSum += brightness;
        if (saturation > 0.35) colorfulPixels++;   // stricter than before
        if (max > 120) brightPixels++;
        if (max > 230 && brightness > 200) specularPixels++; // sparkle
      }
    }

    if (centerCount === 0) return { detected: false, quality: 0 };

    // Sample the surrounding background ring for contrast comparison.
    let bgCount = 0;
    let bgBrightnessSum = 0;
    for (let y = Math.floor(centerY - bgRadius); y < centerY + bgRadius; y += 3) {
      for (let x = Math.floor(centerX - bgRadius); x < centerX + bgRadius; x += 3) {
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= centerR2 || dist2 > bgR2) continue; // ring only

        const i = (y * width + x) * 4;
        bgBrightnessSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        bgCount++;
      }
    }

    const colorRatio = colorfulPixels / centerCount;
    const brightRatio = brightPixels / centerCount;
    const specularRatio = specularPixels / centerCount;
    const centerBrightness = centerBrightnessSum / centerCount;
    const bgBrightness = bgCount ? bgBrightnessSum / bgCount : centerBrightness;

    const hasSparkle = specularRatio > 0.004 && specularRatio < 0.45;
    // Object should be noticeably brighter than the background (stands out).
    const standsOut = centerBrightness > bgBrightness * 1.12;

    const detected =
      colorRatio > 0.25 &&
      brightRatio > 0.35 &&
      hasSparkle &&
      standsOut;

    const quality = detected
      ? Math.min(100, Math.round((colorRatio + brightRatio + specularRatio * 6) * 40))
      : 0;

    return { detected, quality };
  };

  /* ------------------ SIGNATURE DETECTION ------------------ */
  const detectSignature = (imageData, width, height) => {
    const data = imageData.data;
    let darkPixels = 0;
    let edgePixels = 0;
    let skinTonePixels = 0;

    // Only analyze center region (where capture box is)
    const startX = Math.floor(width * 0.15);
    const endX = Math.floor(width * 0.85);
    const startY = Math.floor(height * 0.25);
    const endY = Math.floor(height * 0.75);
    let sampledPixels = 0;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        sampledPixels++;

        if (brightness < 120) darkPixels++;

        if (r > 95 && g > 40 && b > 20 && r > g && g > b && Math.abs(r - g) > 15 && r - b > 15) {
          skinTonePixels++;
        }
      }
    }

    // Edge detection in center region
    for (let y = startY + 1; y < endY - 1; y += 2) {
      for (let x = startX + 1; x < endX - 1; x += 2) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        const rightI = (y * width + (x + 1)) * 4;
        const rightBrightness = (data[rightI] + data[rightI + 1] + data[rightI + 2]) / 3;
        
        const downI = ((y + 1) * width + x) * 4;
        const downBrightness = (data[downI] + data[downI + 1] + data[downI + 2]) / 3;
        
        if (Math.abs(brightness - rightBrightness) > 40 || Math.abs(brightness - downBrightness) > 40) {
          edgePixels++;
        }
      }
    }

    const darkRatio = darkPixels / sampledPixels;
    const edgeRatio = edgePixels / (sampledPixels / 4);
    const skinRatio = skinTonePixels / sampledPixels;

    // Relaxed detection for signature on white/light paper:
    // - Even small amount of dark ink counts (lowered from 0.05 to 0.01)
    // - Edge ratio lowered (signature strokes are thin)
    // - Still reject faces (skin tone check)
    const detected = 
      darkRatio > 0.01 &&      // Has some dark ink (even small signature)
      darkRatio < 0.6 &&       // Not a completely dark background
      edgeRatio > 0.01 &&      // Has some edges (ink strokes)
      skinRatio < 0.2;         // No significant skin tones

    const quality = detected ? Math.min(100, Math.round((darkRatio * 150 + edgeRatio * 250))) : 0;

    return { detected, quality };
  };

  /* ------------------ IMPROVED CLOTH DETECTION ------------------ */
  const detectCloth = (imageData, width, height) => {
    const data = imageData.data;

    let textureScore = 0;
    let colorfulPixels = 0;
    let nonUniformPixels = 0;
    let sampledPixels = 0;
    let hardEdgePixels = 0;   // very sharp neighbour transitions (screen/text)
    let edgeSamples = 0;
    let brightPixels = 0;     // very bright pixels (glowing screen / white UI)

    // Sample center-heavy grid (cloth is usually centered)
    const startX = Math.floor(width * 0.15);
    const endX = Math.floor(width * 0.85);
    const startY = Math.floor(height * 0.2);
    const endY = Math.floor(height * 0.85);

    const step = 8; // lower = more accuracy, higher = faster

    // Collect brightness values for uniformity check
    const brightnessValues = [];

    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const variance = max - min;
        const brightness = (r + g + b) / 3;

        textureScore += variance;
        brightnessValues.push(brightness);
        if (brightness > 210) brightPixels++;

        // Saturation check (lowered for dark/plain fabrics)
        const saturation = max === 0 ? 0 : variance / max;
        if (saturation > 0.08) colorfulPixels++;

        // Check for non-uniform pixels (any object vs blank wall)
        // Compare with neighbor pixel if available
        if (x + step < endX) {
          const ni = (y * width + (x + step)) * 4;
          const nr = data[ni];
          const ng = data[ni + 1];
          const nb = data[ni + 2];
          const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
          if (diff > 15) nonUniformPixels++;
        }

        // Hard-edge check using immediate adjacent pixels (not the grid step),
        // to catch the crisp, high-frequency edges of on-screen text/UI. Cloth
        // has soft, gradual edges and produces very few of these.
        const rightI = (y * width + (x + 1)) * 4;
        const rb = (data[rightI] + data[rightI + 1] + data[rightI + 2]) / 3;
        const downI = ((y + 1) * width + x) * 4;
        const db = (data[downI] + data[downI + 1] + data[downI + 2]) / 3;
        if (Math.abs(brightness - rb) > 70 || Math.abs(brightness - db) > 70) {
          hardEdgePixels++;
        }
        edgeSamples++;

        sampledPixels++;
      }
    }

    const avgTexture = textureScore / sampledPixels;
    const colorRatio = colorfulPixels / sampledPixels;
    const nonUniformRatio = nonUniformPixels / sampledPixels;
    const hardEdgeRatio = edgeSamples ? hardEdgePixels / edgeSamples : 0;
    const brightRatio = brightPixels / sampledPixels;

    // Calculate brightness variance (cloth has some variation vs blank wall)
    const avgBrightness = brightnessValues.reduce((a, b) => a + b, 0) / brightnessValues.length;
    const brightnessVariance = brightnessValues.reduce((sum, b) => sum + Math.pow(b - avgBrightness, 2), 0) / brightnessValues.length;
    const brightnessStdDev = Math.sqrt(brightnessVariance);

    // ── Laptop/monitor bezel check ──────────────────────────────────────
    // A screen (even one just showing a reflection/preview of a person) sits
    // inside a dark rectangular bezel/frame: the outer border of the view is
    // noticeably darker than the brighter interior panel. Fabric filling the
    // frame doesn't show this dark-border / bright-center split. This catches
    // screens whose content is smooth (few hard edges), e.g. a person's
    // reflection, which the edge check alone would miss.
    let borderSum = 0, borderCount = 0;
    let innerSum = 0, innerCount = 0;
    const bStep = 6;
    for (let y = 0; y < height; y += bStep) {
      for (let x = 0; x < width; x += bStep) {
        const i = (y * width + x) * 4;
        const br = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const inBorder =
          x < width * 0.12 || x > width * 0.88 ||
          y < height * 0.12 || y > height * 0.88;
        const inInner =
          x > width * 0.3 && x < width * 0.7 &&
          y > height * 0.3 && y < height * 0.7;
        if (inBorder) { borderSum += br; borderCount++; }
        else if (inInner) { innerSum += br; innerCount++; }
      }
    }
    const borderBrightness = borderCount ? borderSum / borderCount : 0;
    const innerBrightness = innerCount ? innerSum / innerCount : 0;
    // Dark bezel around a clearly brighter interior → a framed screen/monitor.
    const looksLikeFramedScreen =
      borderBrightness < 70 && innerBrightness > borderBrightness * 1.6;

    // Screen rejection: a laptop/monitor shown to the camera displays UI/text
    // with lots of crisp, high-contrast edges and/or large glowing bright
    // areas, and/or sits inside a dark bezel. Fabric doesn't. Reject those so
    // auto-capture ignores the screen (and any person reflected in it).
    const looksLikeScreen =
      hardEdgeRatio > 0.12 ||                        // dense sharp edges (text/UI)
      (brightRatio > 0.35 && hardEdgeRatio > 0.06) || // bright glow + sharp edges
      looksLikeFramedScreen;                          // dark bezel + bright panel
    if (looksLikeScreen) {
      return { detected: false, quality: 0 };
    }

    // Final decision — more lenient for dark/plain fabrics
    // Path 1: Colorful cloth (original logic, slightly relaxed)
    const colorfulCloth = avgTexture > 12 && colorRatio > 0.12 && colorRatio < 0.95;
    // Path 2: Dark/plain cloth — low saturation but has texture variation
    const plainCloth = nonUniformRatio > 0.08 && brightnessStdDev > 8 && avgTexture > 5;

    const detected = colorfulCloth || plainCloth;

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
  const drawDetectionOverlay = () => {
    // No overlay drawn — keep camera view clean
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
