/**
 * Compresses an image file if it exceeds 1MB.
 * Resizes to ~1000px height and iteratively reduces quality if needed.
 * @param {File} file - The image file to compress
 * @returns {Promise<string>} - Base64 data URL
 */
export const compressImage = (file) => {
  return new Promise((resolve) => {
    const maxSize = 1 * 1024 * 1024; // 1MB

    // If already under 1MB, no processing needed
    if (file.size <= maxSize) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
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

      console.log(`[Image Compress] Original: ${(file.size / 1024 / 1024).toFixed(2)} MB → After: ${(result.length * 0.75 / 1024 / 1024).toFixed(2)} MB`);
      resolve(result);
    };
    img.src = url;
  });
};
