import { useEffect, useRef, useState } from "react";

/**
 * useAutoCapture — blur-safe automatic capture for the AI-Wow camera flows.
 *
 * When the subject is valid and steady in frame (`ready` === true) and the
 * camera is `active`, it samples frames, measures sharpness (Laplacian
 * variance) and captures the sharpest frame — so the saved image is never
 * blurry, while still guaranteeing a capture (falls back to the sharpest
 * frame seen after a max wait). If the subject leaves the frame mid-way, the
 * run is aborted and restarts when it becomes valid again.
 *
 * @param {Object}   params
 * @param {boolean}  params.ready     - A valid subject is steady in frame.
 * @param {boolean}  params.active    - Camera is live and nothing captured yet.
 * @param {Function} params.getFrameCanvas - () => HTMLCanvasElement | null (the cropped frame to save).
 * @param {Function} params.onCapture - (dataUrl: string) => void, called with the chosen frame.
 * @param {Object}   [params.options]
 * @param {number}   [params.options.minHoldMs=500]     - Steady time before capturing.
 * @param {number}   [params.options.maxWaitMs=2500]    - Never wait longer than this.
 * @param {number}   [params.options.goodSharpness=100] - Capture instantly once this sharp.
 * @param {number}   [params.options.quality=0.95]      - JPEG quality.
 * @returns {{ autoCapturing: boolean }}
 */
export const useAutoCapture = ({ ready, active, getFrameCanvas, onCapture, options = {} }) => {
  const {
    minHoldMs = 500,
    maxWaitMs = 2500,
    goodSharpness = 100,
    quality = 0.95,
  } = options;

  const [autoCapturing, setAutoCapturing] = useState(false);
  const readyRef = useRef(false);
  const activeRef = useRef(false);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => { readyRef.current = ready; }, [ready]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Reset the run guard whenever the camera goes inactive (e.g. after retake),
  // so a fresh capture cycle can start next time it's active + ready.
  useEffect(() => {
    if (!active) runningRef.current = false;
  }, [active]);

  useEffect(() => {
    if (!ready || !active || runningRef.current) return;
    runningRef.current = true;
    setAutoCapturing(true);
    runAutoCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, active]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const measureSharpness = (sourceCanvas) => {
    try {
      const maxW = 320; // downscale for speed
      const scale = Math.min(1, maxW / sourceCanvas.width);
      const w = Math.max(1, Math.round(sourceCanvas.width * scale));
      const h = Math.max(1, Math.round(sourceCanvas.height * scale));
      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      tctx.drawImage(sourceCanvas, 0, 0, w, h);
      const { data } = tctx.getImageData(0, 0, w, h);
      const gray = new Float32Array(w * h);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const lap =
            4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - w] - gray[idx + w];
          sum += lap;
          sumSq += lap * lap;
          count++;
        }
      }
      if (count === 0) return 0;
      const mean = sum / count;
      return sumSq / count - mean * mean; // variance
    } catch {
      return Infinity; // if we can't measure, don't block capture
    }
  };

  const runAutoCapture = async () => {
    const start = Date.now();
    let best = null; // { sharp, dataUrl }

    while (mountedRef.current) {
      if (!readyRef.current || !activeRef.current) {
        runningRef.current = false;
        if (mountedRef.current) setAutoCapturing(false);
        return;
      }

      let cropCanvas = null;
      try {
        cropCanvas = getFrameCanvas();
      } catch {
        cropCanvas = null;
      }

      if (cropCanvas) {
        const sharp = measureSharpness(cropCanvas);
        if (!best || sharp > best.sharp) {
          best = { sharp, dataUrl: cropCanvas.toDataURL("image/jpeg", quality) };
        }
        const elapsed = Date.now() - start;
        if ((elapsed >= minHoldMs && sharp >= goodSharpness) || elapsed >= maxWaitMs) {
          if (mountedRef.current) {
            setAutoCapturing(false);
            onCapture(best.dataUrl);
          }
          return;
        }
      }
      await sleep(120);
    }
  };

  return { autoCapturing };
};

export default useAutoCapture;
