/**
 * Compresses an image file if it exceeds 1MB.
 * Resizes to ~1000px height and iteratively reduces quality if needed.
 *
 * Robustness: this always resolves with a usable data URL. If anything in the
 * canvas/compression path fails (e.g. iPad Safari failing to decode a large or
 * HEIC-derived photo, or a canvas memory limit), we fall back to reading the
 * original file as a data URL instead of leaving the promise hanging forever
 * (which made Cloth Colour Analysis silently "fail after upload" on iOS/iPad).
 *
 * @param {File} file - The image file to compress
 * @returns {Promise<string>} - Base64 data URL
 */
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const maxSize = 1 * 1024 * 1024; // 1MB

    // Read the original file as a data URL (used directly for small files and
    // as a fallback when compression can't run).
    const readOriginal = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    };

    // If already under 1MB, no processing needed.
    if (file.size <= maxSize) {
      readOriginal();
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    // Safety net: if the image never loads (decode failure / stuck), fall back
    // to the original file so the flow is never blocked.
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

    const loadTimeout = setTimeout(failToOriginal, 8000);

    img.onload = () => {
      clearTimeout(loadTimeout);
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize to ~1000px height
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

        // First try at 100% quality after resize
        let result = canvas.toDataURL('image/jpeg', 1.0);

        // If still over 1MB, reduce quality iteratively
        let quality = 0.9;
        while (result.length * 0.75 > maxSize && quality > 0.1) {
          result = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        }

        // Guard against a broken/empty canvas export (can happen on iOS Safari
        // when the source is too large for the canvas): fall back to original.
        if (!result || !result.startsWith('data:image')) {
          failToOriginal();
          return;
        }

        console.log(`[Image Compress] Original: ${(file.size / 1024 / 1024).toFixed(2)} MB → After: ${(result.length * 0.75 / 1024 / 1024).toFixed(2)} MB`);
        finish(result);
      } catch (err) {
        console.warn('[Image Compress] Canvas compression failed, using original:', err);
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
