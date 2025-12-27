/**
 * ImageKit Upload Utility
 * Handles uploading images to ImageKit CDN for shareable links
 * Uses ImageKit's Upload API with client-side authentication
 */

import type { ImageKitResponse } from '../types';

export interface UploadResult {
  id: string;
  url: string | null;
  fileId: string | null;
  error: string | null;
}

/**
 * Generate a UUID v4 token
 */
function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * Generate HMAC-SHA1 signature for ImageKit authentication
 * @param token - Unique token string
 * @param expire - Unix timestamp (seconds)
 * @param privateKey - ImageKit private key
 * @returns Hex-encoded signature
 */
async function generateSignature(
  token: string,
  expire: number,
  privateKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token + expire);
  const keyData = encoder.encode(privateKey);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert data URL to Blob for upload
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Sanitize filename for upload
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_.-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Upload a single image to ImageKit
 * @param dataUrl - The image data URL
 * @param fileName - Original filename (will be sanitized)
 * @param publicKey - ImageKit public key
 * @param privateKey - ImageKit private key (for client-side auth)
 * @returns Upload result with URL and fileId
 */
export async function uploadToImageKit(
  dataUrl: string,
  fileName: string,
  publicKey: string,
  privateKey: string
): Promise<{ url: string; fileId: string }> {
  // Convert data URL to blob
  const blob = dataUrlToBlob(dataUrl);

  // Sanitize filename
  const sanitizedName = sanitizeFilename(fileName);
  const timestamp = Date.now();
  const uniqueFileName = `favicon-${timestamp}-${sanitizedName}`;

  // Generate authentication parameters
  const token = generateToken();
  const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
  const signature = await generateSignature(token, expire, privateKey);

  // Create form data
  const formData = new FormData();
  formData.append('file', blob, uniqueFileName);
  formData.append('fileName', uniqueFileName);
  formData.append('publicKey', publicKey);
  formData.append('signature', signature);
  formData.append('expire', expire.toString());
  formData.append('token', token);

  // Upload to ImageKit
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit upload failed: ${response.status} ${errorText}`);
  }

  const data: ImageKitResponse = await response.json();

  return {
    url: data.url,
    fileId: data.fileId,
  };
}

/**
 * Upload multiple images to ImageKit with retry logic
 * @param images - Array of images with id, dataUrl, and title
 * @param publicKey - ImageKit public key
 * @param privateKey - ImageKit private key
 * @param onProgress - Progress callback (completed, total)
 * @param maxRetries - Maximum retry attempts per image (default: 2)
 * @returns Array of upload results
 */
export async function uploadMultipleToImageKit(
  images: Array<{ id: string; dataUrl: string; title: string }>,
  publicKey: string,
  privateKey: string,
  onProgress?: (completed: number, total: number) => void,
  maxRetries = 2
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  // Upload images with concurrency limit of 3
  const concurrencyLimit = 3;
  let completed = 0;

  for (let i = 0; i < images.length; i += concurrencyLimit) {
    const batch = images.slice(i, i + concurrencyLimit);

    const batchPromises = batch.map(async (image) => {
      let lastError: Error | null = null;

      // Retry logic
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const { url, fileId } = await uploadToImageKit(
            image.dataUrl,
            image.title,
            publicKey,
            privateKey
          );

          completed++;
          if (onProgress) {
            onProgress(completed, images.length);
          }

          return {
            id: image.id,
            url,
            fileId,
            error: null,
          };
        } catch (error) {
          lastError = error as Error;

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      // All retries failed
      completed++;
      if (onProgress) {
        onProgress(completed, images.length);
      }

      return {
        id: image.id,
        url: null,
        fileId: null,
        error: lastError?.message || 'Upload failed',
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Check if ImageKit credentials are configured
 */
export function hasImageKitCredentials(): boolean {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const privateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

  return !!(publicKey && privateKey);
}

/**
 * Get ImageKit credentials from environment
 */
export function getImageKitCredentials(): {
  publicKey: string;
  privateKey: string;
} | null {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const privateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey };
}
