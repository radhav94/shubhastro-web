import { useEffect, useRef, useState } from "react";

/**
 * Generic object detection hook using color and shape analysis
 * Can be configured for different object types (gemstone, signature, cloth)
 */
export const useObjectDetection = ({
  videoRef,
  canvasRef,
  detectionType = 'object',
  // Optional () => ({ left, right, top, bottom }) in 0..1 of the video box.
  // Signature detection uses it so it analyses exactly the region that will be
  // saved, instead of a hardcoded guess at where the capture box sits.
  getRegionBounds = null,
}) => {
  const [detectionReady, setDetectionReady] = useState(true); // No models to load
  const [objectDetected, setObjectDetected] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState(0);
  // Why detection is failing, so the camera screen can say something useful
  // instead of leaving the user staring at a red frame. One of:
  // 'dark' | 'no-ink' | 'too-much' | 'skin' | 'flat' | null
  const [detectionReason, setDetectionReason] = useState(null);

  const rafRef = useRef(null);
  const detectionStartedRef = useRef(false);
  const detectionHistoryRef = useRef([]); // Temporal smoothing
  const lastRunRef = useRef(0); // Throttle timestamp
  const regionBoundsRef = useRef(getRegionBounds);
  useEffect(() => { regionBoundsRef.current = getRegionBounds; }, [getRegionBounds]);

  // How often the (CPU-heavy) pixel analysis actually runs. Running it every
  // animation frame on a full-res frame freezes the camera on iOS Safari, so
  // we throttle to a few times per second — plenty for detection feedback.
  const DETECTION_INTERVAL_MS = 150;
  // Downscale the analysis canvas: pixel heuristics don't need full 720p, and
  // a smaller buffer keeps getImageData cheap on mobile. Signature strokes are
  // thin, though — at 320px a pen line is sub-pixel and gets smoothed away
  // into the paper, so that flow gets a bigger buffer.
  const MAX_ANALYSIS_DIM = detectionType === 'signature' ? 480 : 320;
  // Frames (out of the last 10) that must agree before we flip the flag.
  // Auto-capture fires off this, and a wrong signature photo means a wrong
  // reading, so signature demands a clearer majority than the other flows.
  const STABLE_FRAMES = detectionType === 'signature' ? 7 : 5;

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
      let reason = null;

      switch (detectionType) {
        case 'gemstone':
          ({ detected, quality } = detectGemstone(imageData, canvas.width, canvas.height));
          break;
        case 'signature':
          ({ detected, quality, reason } = detectSignature(
            imageData,
            canvas.width,
            canvas.height,
            resolveRegion(canvas.width, canvas.height)
          ));
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

      const stableDetected =
        detectionHistoryRef.current.filter(Boolean).length >= STABLE_FRAMES;

      setObjectDetected(stableDetected);
      setDetectionQuality(quality);
      setDetectionReason(stableDetected ? null : reason);
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

    const hasSparkle = specularRatio > 0.002 && specularRatio < 0.5;
    // Object should be noticeably brighter than the background (stands out).
    const standsOut = centerBrightness > bgBrightness * 1.05;

    // Relaxed: the earlier thresholds (colorRatio>0.25 && brightRatio>0.35 &&
    // sparkle && standsOut, all required) were so strict that a real gemstone
    // usually failed to register, so auto-capture never triggered. Require a
    // colourful+bright centre plus EITHER sparkle OR clear contrast from the
    // background.
    const detected =
      colorRatio > 0.15 &&
      brightRatio > 0.25 &&
      (hasSparkle || standsOut);

    const quality = detected
      ? Math.min(100, Math.round((colorRatio + brightRatio + specularRatio * 6) * 40))
      : 0;

    return { detected, quality };
  };

  /* ------------------ ANALYSIS REGION ------------------ */
  // Pixel rect inside the analysis canvas that we should look at. Prefers the
  // caller's live capture-box geometry; falls back to a centre crop.
  const resolveRegion = (width, height) => {
    const fallback = { left: 0.15, right: 0.85, top: 0.25, bottom: 0.75 };
    let bounds = fallback;
    try {
      const fromCaller = regionBoundsRef.current?.();
      if (fromCaller && fromCaller.right > fromCaller.left && fromCaller.bottom > fromCaller.top) {
        bounds = fromCaller;
      }
    } catch {
      bounds = fallback;
    }
    const clamp = (v) => Math.min(1, Math.max(0, v));
    return {
      x0: Math.floor(clamp(bounds.left) * width),
      x1: Math.ceil(clamp(bounds.right) * width),
      y0: Math.floor(clamp(bounds.top) * height),
      y1: Math.ceil(clamp(bounds.bottom) * height),
    };
  };

  /* ------------------ SIGNATURE DETECTION ------------------ */
  // A signature is a specific thing: sparse, thin, dark strokes on a light,
  // near-colourless page. The old heuristic only asked for >1% dark pixels and
  // >1% edges anywhere in the middle of the frame, which is true of almost any
  // indoor scene — a desk, a shadow, a patterned wall. Auto-capture keys off
  // this flag, so it fired within a second of the camera opening and saved
  // whatever happened to be in view.
  //
  // Ink is found by comparing each sample against its own neighbourhood, not
  // against one number for the whole frame. A global threshold (fixed, or
  // Otsu) fails on real desk conditions: a page held under a lamp is bright on
  // one side and shadowed on the other, so the single best global split lands
  // on the *lighting gradient* — half the page gets labelled "ink", and the
  // sparse/thin-stroke checks then correctly reject a page that really does
  // have a signature on it. Local thresholding is what document scanners use
  // for exactly this reason, and it ignores the gradient entirely.
  //
  // On top of the mask we check that what we found behaves like a signature:
  //   • the page is light                         → we're looking at paper
  //   • ink sits well below the local paper level  → real ink, not sensor noise
  //   • ink is sparse                              → strokes, not a dark object
  //   • no large solid dark mass anywhere          → not a phone/book in frame
  //   • nearly every ink sample touches paper      → thin strokes, not a blob
  //   • strokes run in more than one direction     → not just ruled lines
  //   • low saturation, little skin                → not a hand, face or fabric
  const detectSignature = (imageData, width, height, region) => {
    const data = imageData.data;
    const { x0, x1, y0, y1 } = region;
    const regionW = x1 - x0;
    const regionH = y1 - y0;
    if (regionW < 16 || regionH < 16) return { detected: false, quality: 0, reason: 'no-ink' };

    const step = 2; // sample every other pixel — keeps stroke detail, halves cost
    const cols = Math.floor(regionW / step);
    const rows = Math.floor(regionH / step);
    if (cols < 8 || rows < 8) return { detected: false, quality: 0, reason: 'no-ink' };

    const gray = new Uint8Array(cols * rows);
    let skinPixels = 0;
    let saturationSum = 0;
    let graySum = 0;
    const total = cols * rows;

    for (let ry = 0; ry < rows; ry++) {
      const y = y0 + ry * step;
      for (let rx = 0; rx < cols; rx++) {
        const x = x0 + rx * step;
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const v = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
        gray[ry * cols + rx] = v;
        graySum += v;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        saturationSum += max === 0 ? 0 : (max - min) / max;
        if (r > 95 && g > 40 && b > 20 && r > g && g > b && Math.abs(r - g) > 15 && r - b > 15) {
          skinPixels++;
        }
      }
    }

    const skinRatio = skinPixels / total;
    const avgSaturation = saturationSum / total;
    const pageMean = graySum / total;

    // ── Local threshold via a summed-area table ──────────────────────────
    // A sample is ink when it is clearly darker than the average of the patch
    // around it. The margin scales with local brightness so the same code works
    // on a page at 200 and the same page in dim light at 110.
    const stride = cols + 1;
    const integral = new Float64Array(stride * (rows + 1));
    for (let ry = 0; ry < rows; ry++) {
      let rowSum = 0;
      for (let rx = 0; rx < cols; rx++) {
        rowSum += gray[ry * cols + rx];
        integral[(ry + 1) * stride + rx + 1] = integral[ry * stride + rx + 1] + rowSum;
      }
    }
    const radius = Math.max(6, Math.round(cols / 16));
    const patchMean = (rx, ry) => {
      const ax = Math.max(0, rx - radius);
      const bx = Math.min(cols - 1, rx + radius);
      const ay = Math.max(0, ry - radius);
      const by = Math.min(rows - 1, ry + radius);
      const area = (bx - ax + 1) * (by - ay + 1);
      const sum =
        integral[(by + 1) * stride + (bx + 1)] -
        integral[ay * stride + (bx + 1)] -
        integral[(by + 1) * stride + ax] +
        integral[ay * stride + ax];
      return sum / area;
    };

    const isInk = new Uint8Array(total);
    let inkCount = 0;
    let inkSum = 0;
    let paperSum = 0;
    // Anything far below the page average is a solid dark object rather than a
    // pen stroke; local thresholding only marks such a mass at its outline, so
    // we count it globally too.
    const darkMassCutoff = pageMean * 0.55;
    let darkMass = 0;
    // Second, much more forgiving pass. Its only job is to tell "there is
    // nothing written here" apart from "there is something written here but the
    // lens can't resolve it" — an out-of-focus stroke is smeared into a wide
    // band only a few levels below the paper, so it misses the real margin
    // entirely. Without this the user gets told to position their signature
    // while it is already sitting in the middle of the frame.
    let faintCount = 0;
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const idx = ry * cols + rx;
        const v = gray[idx];
        if (v < darkMassCutoff) darkMass++;
        const local = patchMean(rx, ry);
        const margin = Math.max(9, local * 0.08);
        if (v < local - margin) {
          isInk[idx] = 1;
          inkCount++;
          inkSum += v;
        } else {
          paperSum += v;
          if (v < local - Math.max(4, local * 0.035)) faintCount++;
        }
      }
    }
    const faintRatio = faintCount / total;
    if (!inkCount || inkCount === total) {
      return { detected: false, quality: 0, reason: faintRatio > 0.004 ? 'blurry' : 'no-ink' };
    }

    const inkMean = inkSum / inkCount;
    const paperMean = paperSum / (total - inkCount);
    const contrast = paperMean - inkMean;
    const inkRatio = inkCount / total;
    const darkMassRatio = darkMass / total;

    // ── Stroke test ──────────────────────────────────────────────────────
    // Walk the ink mask and count how many ink samples sit next to paper.
    // A pen line is 1-3 samples wide, so nearly all of it is boundary. A
    // shadow, a dark table or a phone case is a solid mass — mostly interior.
    // Also track the spread of the ink so a single dark speck can't qualify.
    //
    // Direction matters too: ruled notebook lines are ink by every other
    // measure, but they only ever produce paper→ink transitions vertically. A
    // signature loops and climbs, so it produces plenty of horizontal ones.
    let boundary = 0;
    let horizontalEdges = 0;
    let verticalEdges = 0;
    let minX = cols;
    let maxX = -1;
    const columnHasInk = new Uint8Array(cols);
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const idx = ry * cols + rx;
        if (!isInk[idx]) continue;
        if (rx < minX) minX = rx;
        if (rx > maxX) maxX = rx;
        columnHasInk[rx] = 1;
        const leftPaper = rx === 0 || !isInk[idx - 1];
        const rightPaper = rx === cols - 1 || !isInk[idx + 1];
        const upPaper = ry === 0 || !isInk[idx - cols];
        const downPaper = ry === rows - 1 || !isInk[idx + cols];
        if (leftPaper || rightPaper) horizontalEdges++;
        if (upPaper || downPaper) verticalEdges++;
        if (leftPaper || rightPaper || upPaper || downPaper) boundary++;
      }
    }

    const strokeRatio = boundary / inkCount;
    const directionMix = horizontalEdges / Math.max(1, horizontalEdges + verticalEdges);
    const spanX = maxX < 0 ? 0 : (maxX - minX + 1) / cols;
    let occupiedColumns = 0;
    for (let rx = 0; rx < cols; rx++) occupiedColumns += columnHasInk[rx];
    const columnCoverage = occupiedColumns / cols;

    // ── Verdict ──────────────────────────────────────────────────────────
    if (pageMean < 90) return { detected: false, quality: 0, reason: 'dark' };
    if (skinRatio > 0.12 || avgSaturation > 0.4) {
      return { detected: false, quality: 0, reason: 'skin' };
    }
    if (darkMassRatio > 0.28 || inkRatio > 0.25) {
      return { detected: false, quality: 0, reason: 'too-much' };
    }
    // Deliberately low floor: a thin pen line across a 1000x500 box is only a
    // few tenths of a percent of it. Blank paper is held out here rather than by
    // contrast — against its own local average, clean paper has no ink at all.
    if (inkRatio < 0.002) {
      return { detected: false, quality: 0, reason: faintRatio > 0.004 ? 'blurry' : 'no-ink' };
    }
    if (strokeRatio < 0.5) return { detected: false, quality: 0, reason: 'too-much' };
    // Checked before contrast: ruled lines pass every intensity test, so
    // "nothing is written on this page" is the accurate thing to say about a
    // blank notebook, not "the camera is focusing".
    if (directionMix < 0.12) return { detected: false, quality: 0, reason: 'no-ink' };
    // Ink found, but washed out against the page: out of focus, glare, or a
    // pencil too faint to read.
    if (contrast < 25) return { detected: false, quality: 0, reason: 'blurry' };
    if (spanX < 0.12 || columnCoverage < 0.08) {
      return { detected: false, quality: 0, reason: 'no-ink' };
    }

    const quality = Math.min(
      100,
      Math.round(contrast * 0.5 + strokeRatio * 30 + Math.min(inkRatio, 0.12) * 200)
    );

    return { detected: true, quality, reason: null };
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
    setDetectionReason(null);
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
    detectionReason,
    startDetection,
    stopDetection
  };
};
