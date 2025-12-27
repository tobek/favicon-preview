# Shareable Links Implementation Plan

## Overview

Implement shareable links feature that encodes favicon previews into URLs. Users can share their favicon comparisons with others. The feature includes:
- Client-side image compression (max 1024x1024)
- Upload to Firebase Storage (secure, no credentials exposed)
- URL generation with minified base64-encoded JSON
- Download button for each favicon (compressed version)
- Error handling for expired/missing images

## Current State

### ✅ Implemented (ImageKit - needs replacement)
- Client-side image compression (`src/utils/imageCompression.ts`)
- Share URL generation/parsing (`src/utils/shareUrl.ts`)
- ShareButton component (`src/components/ShareButton.tsx`)
- Download button for favicons
- Load from shared URL on page mount
- Error handling UI

### ❌ Security Issue with ImageKit
The current ImageKit implementation requires exposing the **private key** in client-side code. This is a security risk:
- Private key grants **delete access** (not just upload)
- Anyone can extract the key and delete all uploaded images
- ImageKit's restricted keys don't have "upload-only" permission
- ImageKit requires a backend auth endpoint for secure client-side uploads

### 🔄 Migration: ImageKit → Firebase Storage
Firebase Storage is the better choice because:
- **No credentials exposed** - uses public Firebase config (designed to be public)
- **Security rules enforce upload-only** - clients cannot delete files
- **File size limits in security rules** - prevent abuse
- **File type restrictions** - can limit to images only
- **No backend required** - security enforced server-side by Firebase

## User Requirements (from Q&A)

✅ Share core data only: favicons, titles, Chrome color (NOT UI state)
✅ Download compressed images (not originals)
✅ Show error message when images expire
✅ Client-side compression required (no server)
✅ Long URLs acceptable (if short links add complexity)
✅ Manual cleanup acceptable (monthly cron job)

## Technical Approach

### Image Hosting: Firebase Storage

**Why Firebase over alternatives:**

| Feature | Firebase | ImageKit | AWS S3 |
|---------|----------|----------|--------|
| Credentials in client | No (public config) | Yes (private key) | Yes (access keys) |
| Upload-only security | Yes (security rules) | No | Yes (IAM policy) |
| File size limits | Yes (security rules) | No | No (need Lambda) |
| Delete protection | Yes (rules) | No | Yes (IAM) |
| Auto expiration | No (need cron) | No (need cron) | Yes (Lifecycle) |
| Pricing (100 MAU) | ~$0/mo (free tier) | ~$0/mo | ~$0/mo |
| Pricing (1000 MAU) | <$1/mo | <$1/mo | <$1/mo |

**Firebase Free Tier:**
- 5GB storage
- 1GB/day downloads
- 50K downloads/day

**Security Rules** (upload-only, size/type restricted):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /favicons/{fileName} {
      // Anyone can read (for shared links)
      allow read: if true;

      // Anyone can upload, but with restrictions
      allow create: if request.resource.size < 500 * 1024  // 500KB max
                    && request.resource.contentType.matches('image/.*');

      // No updates or deletes from clients
      allow update, delete: if false;
    }
  }
}
```

**Bonus Use Case:** Can also serve as a "bootleg short-link generator":
- Upload `.txt` files with short ID as filename
- File content = JSON state payload
- Read file by ID to restore state
- Same security rules pattern (upload-only)

### URL Format: Minified Base64-encoded JSON

```
https://example.com?share=eyJmIjpbeyJ1IjoiaHR0cHM6Ly...
```

**Minified data structure** (shorter keys to reduce URL length):
```typescript
{
  f: [{ u: string, t: string }, ...],  // f=favicons, u=url, t=title
  c: string,  // c=color (without # prefix)
  v: number   // v=version (for future compatibility)
}
```

**Full structure** (internal TypeScript interface):
```typescript
{
  favicons: [{ url: string, title: string }, ...],
  color: string,
  version: number
}
```

### Client-Side Compression

- Use Canvas API to resize to max 1024x1024
- Convert to PNG (preserves transparency) or JPEG (for photos)
- Compress on upload, store compressed version
- ~80-90% reduction in file size expected

## Migration Plan

### Files to Delete
- `src/utils/imagekitUpload.ts` - Replace with Firebase

### Files to Create
- `src/utils/firebaseUpload.ts` - Firebase Storage upload logic
- `src/firebase.ts` - Firebase app initialization

### Files to Modify
- `src/components/ShareButton.tsx` - Use Firebase instead of ImageKit
- `.env.local.example` - Update with Firebase config

### Keep As-Is
- `src/utils/imageCompression.ts` - Still needed
- `src/utils/shareUrl.ts` - Still needed (URL format unchanged)
- `src/types.ts` - Types still apply (just rename ImageKit → Firebase references)

## Firebase Implementation

### 1. Firebase Setup

**Create Firebase project:**
1. Go to https://console.firebase.google.com/
2. Create new project (free tier)
3. Enable Storage in Firebase Console
4. Copy web app config

**`.env.local`** (not committed):
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Initialization

**New file**: `src/firebase.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

### 3. Upload Function

**New file**: `src/utils/firebaseUpload.ts`
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadToFirebase(
  dataUrl: string,
  fileName: string
): Promise<{ url: string }> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Generate unique filename
  const uniqueName = `${Date.now()}-${fileName}`;
  const storageRef = ref(storage, `favicons/${uniqueName}`);

  // Upload
  await uploadBytes(storageRef, blob);

  // Get public URL
  const url = await getDownloadURL(storageRef);
  return { url };
}

export function hasFirebaseConfig(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  );
}
```

### 4. Security Rules

Deploy these rules in Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /favicons/{fileName} {
      // Anyone can read
      allow read: if true;

      // Upload restrictions: images only, max 500KB
      allow create: if request.resource.size < 500 * 1024
                    && request.resource.contentType.matches('image/.*');

      // No client-side updates or deletes
      allow update, delete: if false;
    }
  }
}
```

## 6-Month Expiration Strategy

Firebase doesn't have built-in expiration like S3 Lifecycle Rules. Options:

### Option A: Local Cron Script (Recommended)
Run monthly on your PC:
```javascript
// cleanup-old-favicons.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const app = initializeApp({
  credential: cert('./service-account.json'),
  storageBucket: 'your-bucket.appspot.com'
});

const bucket = getStorage().bucket();
const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);

const [files] = await bucket.getFiles({ prefix: 'favicons/' });
for (const file of files) {
  const [metadata] = await file.getMetadata();
  if (new Date(metadata.timeCreated).getTime() < sixMonthsAgo) {
    await file.delete();
    console.log(`Deleted: ${file.name}`);
  }
}
```

### Option B: GitHub Action
Schedule monthly cleanup via GitHub Actions with Firebase Admin SDK.

### Option C: Cloud Function
Deploy a scheduled Cloud Function (adds complexity, overkill for this).

## Pricing Estimates

**Assumptions:**
- 5 favicons/share avg, 30KB each compressed
- 5 views per shared link
- 6-month retention

| Scale | Storage (6mo) | Downloads/mo | Monthly Cost |
|-------|---------------|--------------|--------------|
| 100 MAU | ~0.5GB | ~0.5GB | $0 (free tier) |
| 1000 MAU | ~5GB | ~5GB | <$1 |

## Type Changes

**Update `src/types.ts`** - rename ImageKit references:

```typescript
// Firebase response (simpler than ImageKit)
export interface FirebaseUploadResult {
  url: string;
}
```

## Testing Checklist

- [ ] Firebase project created and configured
- [ ] Security rules deployed
- [ ] Compress various formats (PNG, SVG, ICO, WEBP)
- [ ] Upload single and multiple favicons
- [ ] Verify upload-only (cannot delete via client)
- [ ] Generate and copy share URL
- [ ] Load shared URL in new session
- [ ] Handle expired images gracefully
- [ ] Download compressed favicons
- [ ] Test cleanup script
- [ ] Test on Chrome, Firefox, Safari

## Implementation Order

1. ✅ Image compression (already done)
2. ✅ URL generation/parsing (already done)
3. ✅ ShareButton UI (already done, needs Firebase integration)
4. ⏸️ **Create Firebase project and configure**
5. ⏸️ **Create `src/firebase.ts` initialization**
6. ⏸️ **Create `src/utils/firebaseUpload.ts`**
7. ⏸️ **Update ShareButton to use Firebase**
8. ⏸️ **Delete `src/utils/imagekitUpload.ts`**
9. ⏸️ **Deploy security rules**
10. ⏸️ **Test end-to-end**
11. ⏸️ **Create cleanup script**

---

**Estimated complexity**: Medium (simpler than ImageKit - no auth complexity)
**Risk areas**: Firebase config exposure (by design, not a risk), cleanup script maintenance
**Mitigation**: Security rules enforce upload-only, file size/type limits prevent abuse
