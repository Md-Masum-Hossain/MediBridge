/**
 * Client-Side Image Compression using HTML Canvas
 * Resizes large camera photos to a max dimension of 1280px with 0.8 JPEG quality.
 * Reduces 5MB-10MB mobile photos to ~150KB-250KB for fast Gemini OCR analysis.
 */
export async function compressImage(fileOrBase64, maxDimension = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    // If running server-side
    if (typeof window === 'undefined') {
      return resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
    }

    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to create canvas 2D rendering context'));
      }

      // Fill white background (handles transparent PNGs when converting to JPEG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = (err) => reject(new Error('Failed to load image for compression: ' + err.message));

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    } else {
      reject(new Error('Invalid image input: expected File, Blob, or base64 string'));
    }
  });
}
