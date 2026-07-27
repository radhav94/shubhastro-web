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
export const countFacesInImage = async (imageSrc, timeoutMs = 4000) => {
  const run = (async () => {
    try {
      await ensureModelLoaded();
      const img = await loadImage(imageSrc);
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
      );
      return detections.length;
    } catch (err) {
      console.warn("Face count detection failed:", err);
      return -1;
    }
  })();

  // Never let face detection block the analysis flow.
  return withTimeout(run, timeoutMs, -1);
};

export default countFacesInImage;
