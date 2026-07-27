import * as faceapi from "face-api.js";

let modelLoadPromise = null;

// Load the lightweight tiny face detector once (model files live in /models).
const ensureModelLoaded = () => {
  if (!modelLoadPromise) {
    modelLoadPromise = faceapi.nets.tinyFaceDetector
      .loadFromUri("/models")
      .catch((err) => {
        // Reset so a later call can retry.
        modelLoadPromise = null;
        throw err;
      });
  }
  return modelLoadPromise;
};

// Decode an image source (data URL / URL) into an HTMLImageElement.
// No crossOrigin — these are same-origin data URLs, and setting it can cause
// silent load failures on some Safari versions.
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Resolve to `fallback` if the promise doesn't settle within `ms`.
const withTimeout = (promise, ms, fallback) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

/**
 * Count the number of human faces detected in an image.
 * Returns -1 if detection could not run (models failed / decode error / timed
 * out), so callers can fail open (allow) rather than block the user.
 *
 * @param {string} imageSrc - data URL or image URL
 * @param {number} [timeoutMs=4000] - max time before giving up (fail open)
 * @returns {Promise<number>}
 */
// Intersection-over-union of two face boxes (for de-duplicating overlaps).
const iou = (a, b) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  const inter = w * h;
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
};

export const countFacesInImage = async (imageSrc, timeoutMs = 4000) => {
  const run = (async () => {
    try {
      await ensureModelLoaded();
      const img = await loadImage(imageSrc);
      const detections = await faceapi.detectAllFaces(
        img,
        // Higher score threshold to cut down false positives that made one
        // person read as several.
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.6 })
      );

      const imgArea = (img.naturalWidth || img.width) * (img.naturalHeight || img.height);
      if (!imgArea) return detections.length;

      // Keep only confident, reasonably-sized detections. Tiny specks are
      // almost always noise (patterns, logos, shadows on clothing), not people.
      const MIN_FACE_AREA_RATIO = 0.01; // face box must be >=1% of the image
      let faces = detections
        .filter((d) => d.score >= 0.6)
        .map((d) => d.box)
        .filter((box) => (box.width * box.height) / imgArea >= MIN_FACE_AREA_RATIO);

      // De-duplicate overlapping boxes (the detector can emit two boxes for the
      // same face), so one person is never counted twice.
      const unique = [];
      for (const box of faces) {
        if (!unique.some((u) => iou(u, box) > 0.3)) unique.push(box);
      }

      return unique.length;
    } catch (err) {
      console.warn("Face count detection failed:", err);
      return -1;
    }
  })();

  // Never let face detection block the analysis flow.
  return withTimeout(run, timeoutMs, -1);
};

export default countFacesInImage;
