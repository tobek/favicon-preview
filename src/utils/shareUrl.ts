/**
 * Share URL Utility
 * Handles generation and parsing of shareable URLs with minified JSON encoding
 * Uses base64-encoded JSON with short keys to minimize URL length
 */

import type { SharedState, MinifiedSharedState } from '../types';

const CURRENT_VERSION = 1;
const URL_LENGTH_WARNING_THRESHOLD = 1800; // Browser limit is ~2000

/**
 * Transform full SharedState to minified format (shorter keys)
 */
function minifySharedState(state: SharedState): MinifiedSharedState {
  return {
    f: state.favicons.map((fav) => ({
      u: fav.url,
      t: fav.title,
    })),
    c: state.color,
    v: state.version,
  };
}

/**
 * Transform minified format back to full SharedState
 */
function expandSharedState(minified: MinifiedSharedState): SharedState {
  return {
    favicons: minified.f.map((fav) => ({
      url: fav.u,
      title: fav.t,
    })),
    color: minified.c,
    version: minified.v,
  };
}

/**
 * Generate shareable URL with minified base64-encoded JSON
 * @param favicons - Array of uploaded favicon URLs and titles
 * @param chromeColor - Chrome color theme (hex with #)
 * @param baseUrl - Base URL (defaults to current origin + pathname)
 * @returns Shareable URL with ?share= parameter
 */
export function generateShareUrl(
  favicons: Array<{ url: string; title: string }>,
  chromeColor: string,
  baseUrl = window.location.origin + window.location.pathname
): string {
  // Create shared state object
  const sharedState: SharedState = {
    favicons,
    color: chromeColor.replace('#', ''), // Remove # prefix
    version: CURRENT_VERSION,
  };

  // Minify keys
  const minified = minifySharedState(sharedState);

  // Convert to JSON string (no whitespace)
  const jsonString = JSON.stringify(minified);

  // Base64 encode
  const base64 = btoa(jsonString);

  // URL encode
  const encoded = encodeURIComponent(base64);

  // Generate URL
  const shareUrl = `${baseUrl}?share=${encoded}`;

  // Warn if URL is too long
  if (shareUrl.length > URL_LENGTH_WARNING_THRESHOLD) {
    console.warn(
      `Share URL is ${shareUrl.length} characters, which may exceed browser limits (typically ~2000 characters)`
    );
  }

  return shareUrl;
}

/**
 * Parse shared state from URL
 * @param url - URL to parse (defaults to current location)
 * @returns SharedState or null if no share parameter or invalid
 */
export function parseShareUrl(url = window.location.href): SharedState | null {
  try {
    // Extract share parameter
    const urlObj = new URL(url);
    const shareParam = urlObj.searchParams.get('share');

    if (!shareParam) {
      return null;
    }

    // Decode URL encoding
    const base64 = decodeURIComponent(shareParam);

    // Decode base64
    const jsonString = atob(base64);

    // Parse JSON
    const minified = JSON.parse(jsonString) as MinifiedSharedState;

    // Validate structure
    if (!minified.f || !Array.isArray(minified.f) || typeof minified.c !== 'string') {
      console.error('Invalid share URL structure');
      return null;
    }

    // Check version compatibility
    if (minified.v > CURRENT_VERSION) {
      console.warn(`Share URL version ${minified.v} is newer than current version ${CURRENT_VERSION}`);
    }

    // Expand minified state to full format
    const sharedState = expandSharedState(minified);

    return sharedState;
  } catch (error) {
    console.error('Failed to parse share URL:', error);
    return null;
  }
}

/**
 * Validate that an image URL is still accessible
 * @param url - Image URL to validate
 * @returns Promise<boolean> - true if accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Failed to validate image URL:', url, error);
    return false;
  }
}

/**
 * Validate all image URLs in a shared state
 * @param sharedState - SharedState to validate
 * @returns Promise with validation results for each favicon
 */
export async function validateSharedState(
  sharedState: SharedState
): Promise<Array<{ url: string; title: string; isValid: boolean }>> {
  const validationPromises = sharedState.favicons.map(async (favicon) => {
    const isValid = await validateImageUrl(favicon.url);
    return {
      url: favicon.url,
      title: favicon.title,
      isValid,
    };
  });

  return Promise.all(validationPromises);
}

/**
 * Get warning message if URL would be too long
 * @param favicons - Array of favicons
 * @param chromeColor - Chrome color theme
 * @returns Warning message or null
 */
export function getUrlLengthWarning(
  favicons: Array<{ url: string; title: string }>,
  chromeColor: string
): string | null {
  const testUrl = generateShareUrl(favicons, chromeColor);

  if (testUrl.length > URL_LENGTH_WARNING_THRESHOLD) {
    return `Share URL will be ${testUrl.length} characters, which may exceed browser limits. Consider sharing fewer favicons.`;
  }

  return null;
}

/**
 * Check if current URL has a share parameter
 * @returns boolean
 */
export function hasShareParameter(): boolean {
  return new URLSearchParams(window.location.search).has('share');
}

/**
 * Remove share parameter from URL without page reload
 */
export function clearShareParameter(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}
