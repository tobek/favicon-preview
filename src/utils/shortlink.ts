import { customAlphabet } from 'nanoid';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { CompressedFavicon, SharedState, ShortlinkDocument } from '../types';

// Generate 7-char URL-safe ID with alphabet: 0-9A-Za-z
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

/**
 * Generate a unique 7-character shortlink ID
 */
export function generateShortId(): string {
  return nanoid();
}

/**
 * Create a shortlink in Firestore
 * Retries up to 3 times if there's an ID collision
 * Returns the shortId on success, null on failure
 */
export async function createShortlink(
  favicons: CompressedFavicon[],
  chromeColorTheme: string
): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const shortId = generateShortId();

    try {
      const data: ShortlinkDocument = {
        id: shortId,
        favicons: favicons.map(f => ({
          url: f.uploadedImageUrl!,
          title: f.title
        })),
        color: chromeColorTheme.replace('#', ''),
        version: 1,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'shortlinks', shortId), data);
      return shortId; // Success
    } catch (error) {
      console.error(`Failed to create shortlink (attempt ${attempt + 1}):`, error);
      if (attempt === 2) {
        return null; // Failed after 3 attempts
      }
    }
  }
  return null;
}

/**
 * Load a shortlink from Firestore
 * Returns SharedState on success, null if not found or on error
 */
export async function loadShortlink(shortId: string): Promise<SharedState | null> {
  try {
    const docSnap = await getDoc(doc(db, 'shortlinks', shortId));

    if (!docSnap.exists()) {
      console.error('Shortlink not found:', shortId);
      return null;
    }

    const data = docSnap.data() as ShortlinkDocument;
    return {
      favicons: data.favicons,
      color: data.color,
      version: data.version
    };
  } catch (error) {
    console.error('Failed to load shortlink:', error);
    return null;
  }
}
