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
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/**
 * Count the number of human faces detected in an image.
 * Returns -1 if detection could not run (models failed / decode error), so
 * callers can decide to fail open (allow) rather than block the user.
 *
 * @param {string} imageSrc - data URL or image URL
 * @returns {Promise<number>}
 */
export const countFacesInImage = async (imageSrc) => {
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
};

export default countFacesInImage;
