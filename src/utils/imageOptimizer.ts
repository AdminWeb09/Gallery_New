/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Optimizes an image by loading it onto a canvas and resizing it to standard
 * web display parameters before generating a highly compressed Base64 stream.
 */
export function optimizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Calculate recommended bounds
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Render on canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to resolve 2D Canvas context'));
          return;
        }

        // Draw image clean
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export data url
        const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Derives appropriate Aspect Ratio type from an image element.
 */
export function detectAspectRatio(file: File): Promise<'square' | 'portrait' | 'wide' | 'standard'> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 1) < 0.1) {
          resolve('square');
        } else if (ratio < 0.8) {
          resolve('portrait');
        } else if (ratio > 1.5) {
          resolve('wide');
        } else {
          resolve('standard');
        }
      };
      img.onerror = () => resolve('standard');
    };
    reader.onerror = () => resolve('standard');
  });
}
