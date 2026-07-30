/**
 * Normalises an image file to a JPEG data URL, resizing/compressing if large.
 *
 * Why always re-encode: iOS gallery/device photos are frequently HEIC/HEIF (or
 * other formats). If we returned the raw file data URL as-is, that HEIC blob
 * was sent to the analysis APIs, which can't process it — so uploads "failed"
 * on iOS while camera captures (already JPEG) worked. Routing every upload
 * through a canvas re-encode guarantees a JPEG the backend can read.
 *
 * Robustness: this always resolves with a usable data URL. If the canvas path
 * can't run (e.g. the browser can't decode the source, or a canvas memory
 * limit), we fall back to reading the original file as a data URL instead of
 * hanging forever.
 *
 * @param {File} file - The image file to compress
 * @returns {Promise<string>} - Base64 data URL (JPEG when re-encoding succeeds)
 */
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const maxSize = 1 * 1024 * 1024; // 1MB

    // Read the original file as a data URL — used only as a fallback when the
    // canvas re-encode can't run.
    const readOriginal = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    };

    const img = new Image();
    const url = URL.createObjectURL(file);

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const failToOriginal = () => {
      if (settled) return;
      URL.revokeObjectURL(url);
      readOriginal();
    };

    // If the image never loads (decode failure / stuck), fall back.
    const loadTimeout = setTimeout(failToOriginal, 8000);

    img.onload = () => {
      clearTimeout(loadTimeout);
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize to ~1000px height for large images (keeps payload small).
        const targetHeight = 1000;
        if (height > targetHeight) {
          const ratio = targetHeight / height;
          width = Math.round(width * ratio);
          height = targetHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Always export as JPEG so the backend never receives HEIC/other.
        let result = canvas.toDataURL('image/jpeg', 0.92);

        // If still over 1MB, reduce quality iteratively.
        let quality = 0.85;
        while (result.length * 0.75 > maxSize && quality > 0.1) {
          result = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        }

        // Guard against a broken/empty canvas export (can happen on iOS Safari
        // when the source is too large for the canvas): fall back to original.
        if (!result || !result.startsWith('data:image/jpeg')) {
          failToOriginal();
          return;
        }

        finish(result);
      } catch (err) {
        console.warn('[Image Compress] Canvas re-encode failed, using original:', err);
        failToOriginal();
      }
    };

    img.onerror = () => {
      clearTimeout(loadTimeout);
      failToOriginal();
    };

    img.src = url;
  });
};
