import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface FirebaseUploadResult {
  url: string;
}

/**
 * Upload a compressed favicon image to Firebase Storage
 * @param dataUrl - Data URL of the compressed image
 * @param fileName - Original filename (will be made unique with timestamp)
 * @returns Promise with the public download URL
 */
export async function uploadToFirebase(
  dataUrl: string,
  fileName: string
): Promise<FirebaseUploadResult> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${timestamp}-${sanitizedName}`;

  // Create storage reference
  const storageRef = ref(storage, `favicons/${uniqueName}`);

  // Upload the blob
  await uploadBytes(storageRef, blob, {
    contentType: blob.type,
    cacheControl: 'public, max-age=31536000', // Cache for 1 year
  });

  // Get the public download URL
  const url = await getDownloadURL(storageRef);

  return { url };
}

/**
 * Check if Firebase is properly configured
 * @returns true if Firebase config exists
 */
export function hasFirebaseConfig(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  );
}

/**
 * Upload multiple favicons concurrently with retry logic
 * @param favicons - Array of favicon objects with dataUrl, fileName, and id
 * @param maxConcurrent - Maximum number of concurrent uploads (default: 3)
 * @param maxRetries - Maximum retry attempts per upload (default: 3)
 * @returns Promise with array of results (successful uploads or errors)
 */
export async function uploadMultipleToFirebase(
  favicons: Array<{ id: string; compressedDataUrl: string; fileName: string }>,
  maxConcurrent = 3,
  maxRetries = 3
): Promise<Array<{ id: string; url: string; error: string | null }>> {
  const results: Array<{ id: string; url: string; error: string | null }> = [];

  // Upload with concurrency control
  for (let i = 0; i < favicons.length; i += maxConcurrent) {
    const batch = favicons.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (favicon) => {
      let lastError: Error | null = null;

      // Retry logic with exponential backoff
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await uploadToFirebase(
            favicon.compressedDataUrl,
            favicon.fileName
          );
          return { id: favicon.id, url: result.url, error: null };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Wait before retry (exponential backoff: 1s, 2s, 4s)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      // All retries failed
      return {
        id: favicon.id,
        url: '',
        error: `Failed to upload ${favicon.fileName}: ${lastError?.message || 'Unknown error'}`,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
