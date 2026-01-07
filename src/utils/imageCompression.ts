/**
 * Image Compression Utility
 * Compresses images to reduce file size before uploading to Firebase Storage
 * Uses Canvas API to resize and compress while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses an image from a data URL
 * @param dataUrl - The image data URL to compress
 * @param maxWidth - Maximum width (default: 256 - sufficient for favicons)
 * @param maxHeight - Maximum height (default: 256 - sufficient for favicons)
 * @param quality - Compression quality 0-1 (default: 0.9)
 * @returns Promise<string> - Compressed image as data URL
 */
export async function compressImage(
  dataUrl: string,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format based on image type
        // Use PNG for images with transparency, JPEG for others
        let outputFormat = 'image/png';
        const outputQuality = quality;

        // Check if image has transparency
        const imageData = ctx.getImageData(0, 0, width, height);
        const hasTransparency = checkTransparency(imageData);

        if (!hasTransparency) {
          outputFormat = 'image/jpeg';
        }

        // Convert canvas to compressed data URL
        const compressedDataUrl = canvas.toDataURL(outputFormat, outputQuality);

        // If compressed version is larger than original, use original
        if (compressedDataUrl.length > dataUrl.length) {
          resolve(dataUrl);
        } else {
          resolve(compressedDataUrl);
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
}

/**
 * Checks if an image has transparency
 * @param imageData - ImageData from canvas
 * @returns boolean - true if image has any transparent pixels
 */
function checkTransparency(imageData: ImageData): boolean {
  const data = imageData.data;

  // Check alpha channel (every 4th byte starting from index 3)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }

  return false;
}

/**
 * Batch compress multiple images
 * @param dataUrls - Array of data URLs to compress
 * @param options - Compression options
 * @param onProgress - Optional progress callback
 * @returns Promise<string[]> - Array of compressed data URLs
 */
export async function compressMultipleImages(
  dataUrls: string[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const { maxWidth = 256, maxHeight = 256, quality = 0.9 } = options;
  const results: string[] = [];

  for (let i = 0; i < dataUrls.length; i++) {
    const compressed = await compressImage(dataUrls[i], maxWidth, maxHeight, quality);
    results.push(compressed);

    if (onProgress) {
      onProgress(i + 1, dataUrls.length);
    }
  }

  return results;
}

/**
 * Get estimated file size from data URL
 * @param dataUrl - Data URL
 * @returns number - Estimated size in bytes
 */
export function getDataUrlSize(dataUrl: string): number {
  // Remove data URL prefix to get base64 string
  const base64 = dataUrl.split(',')[1] || '';

  // Calculate size: base64 is ~4/3 of original size
  // Remove padding characters
  const padding = (base64.match(/=/g) || []).length;
  return (base64.length * 3) / 4 - padding;
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns string - Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
