import { customAlphabet } from 'nanoid';
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { firebaseConfig } from '../config/firebase.config';
import type { ArchiveTile, CompressedFavicon, SharedState, ShortlinkDocument } from '../types';

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
  chromeColorTheme: string,
  closedDummyTabs: number[] = [],
  isPublic: boolean = false
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
        createdAt: Date.now(),
        ...(closedDummyTabs.length > 0 && { closedDummyTabs }),
        ...(isPublic && { public: true })
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
      version: data.version,
      closedDummyTabs: data.closedDummyTabs || []
    };
  } catch (error) {
    console.error('Failed to load shortlink:', error);
    return null;
  }
}

// Only favicon images hosted in our own Storage bucket are rendered in the
// public archive. This drops any doc with an externally-hosted URL (which a
// client could write directly to Firestore) so we never load attacker-supplied
// images — protecting visitors from tracking pixels and off-site content.
const STORAGE_URL_PREFIX = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/`;

/**
 * Fetch all public archive tiles, newest first.
 * Flattens favicons across all public shortlinks into individual tiles.
 */
export async function fetchPublicArchive(): Promise<ArchiveTile[]> {
  const q = query(
    collection(db, 'shortlinks'),
    where('public', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const tiles: ArchiveTile[] = [];
  snap.forEach(docSnap => {
    // Anyone can write a public doc directly to Firestore, so treat the
    // contents as untrusted: skip any malformed doc rather than letting it
    // throw and break the whole archive for every visitor.
    try {
      const data = docSnap.data() as ShortlinkDocument;
      for (const fav of data.favicons) {
        if (typeof fav.url !== 'string' || !fav.url.startsWith(STORAGE_URL_PREFIX)) continue;
        tiles.push({
          shortId: docSnap.id,
          url: fav.url,
          title: stripControlChars(typeof fav.title === 'string' ? fav.title : ''),
          createdAt: data.createdAt,
        });
      }
    } catch {
      // Ignore malformed docs.
    }
  });
  return tiles;
}

function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1F\x7F]/g, '');
}
