import JSZip from 'jszip';
import type { CompressedFavicon } from '../types';

export interface ZipDownloadOptions {
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Downloads all favicons as a zip file
 * Fetches favicons from Firebase Storage URLs, creates zip, triggers download
 */
export async function downloadAllFavicons(
  favicons: CompressedFavicon[],
  options: ZipDownloadOptions = {}
): Promise<void> {
  const { filename = 'favicons.zip', onProgress } = options;

  // Create JSZip instance
  const zip = new JSZip();

  // Track used filenames to prevent collisions
  const usedFilenames = new Set<string>();

  // Fetch and add each favicon to zip
  for (let i = 0; i < favicons.length; i++) {
    const favicon = favicons[i];
    const imageUrl = favicon.compressedDataUrl || favicon.dataUrl;

    // Report progress
    if (onProgress) {
      onProgress(i, favicons.length);
    }

    try {
      // Fetch image as blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${favicon.title}`);
      const blob = await response.blob();

      // Sanitize filename and ensure uniqueness
      const sanitizedTitle = sanitizeFilename(favicon.title);
      const ext = getExtensionFromBlob(blob);
      const uniqueFilename = getUniqueFilename(sanitizedTitle, ext, usedFilenames);

      zip.file(uniqueFilename, blob);
      usedFilenames.add(uniqueFilename);
    } catch (error) {
      console.error(`Failed to add ${favicon.title} to zip:`, error);
      // Continue with other files - don't fail entire download
    }
  }

  // Report completion progress
  if (onProgress) {
    onProgress(favicons.length, favicons.length);
  }

  // Check if any files were successfully added
  if (usedFilenames.size === 0) {
    throw new Error('Failed to download any favicons. All image fetches failed.');
  }

  // Generate zip blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }, // Balance between speed and size
  });

  // Trigger download
  const blobUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}

/**
 * Sanitizes filename for safe file system use
 */
function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9_.-]/gi, '_');
}

/**
 * Generates a unique filename by appending a counter if needed
 */
function getUniqueFilename(
  baseName: string,
  extension: string,
  usedFilenames: Set<string>
): string {
  let filename = `${baseName}.${extension}`;
  let counter = 2;

  while (usedFilenames.has(filename)) {
    filename = `${baseName}_${counter}.${extension}`;
    counter++;
  }

  return filename;
}

/**
 * Determines file extension from blob MIME type
 */
function getExtensionFromBlob(blob: Blob): string {
  const mimeType = blob.type;
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('svg')) return 'svg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('x-icon')) return 'ico';
  return 'png'; // Default fallback
}
