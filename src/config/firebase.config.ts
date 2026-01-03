/**
 * Firebase Configuration
 *
 * Used for Firebase Storage (image hosting), Firestore Database (shortlinks),
 * and Firebase Hosting (deployment).
 *
 * SECURITY NOTE: These values are designed to be public and safe to expose in client code.
 * Firebase security is enforced via Storage and Firestore security rules, not by hiding config.
 * These values are embedded in the production JavaScript bundle and visible to anyone.
 *
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Storage: Go to Build → Storage → Get Started
 * 3. Enable Firestore: Go to Build → Firestore Database → Create Database (production mode)
 * 4. Add a web app: Project Settings → Your apps → Add app (Web)
 * 5. Copy the firebaseConfig values from the setup screen
 * 6. Replace the values below with your project's configuration
 * 7. Deploy security rules: `firebase deploy --only storage,firestore`
 * 8. Configure CORS: `gsutil cors set cors.json gs://your-bucket.firebasestorage.app`
 *
 * Free Tier Limits:
 * - Storage: 5GB
 * - Downloads: 1GB/day
 * - Firestore: 50K reads/day, 20K writes/day, 1GB storage
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyBqwHte9IchmPeJSia8eJnhbtm_zXYIdYk',
  authDomain: 'favicon-preview.firebaseapp.com',
  projectId: 'favicon-preview',
  storageBucket: 'favicon-preview.firebasestorage.app',
  messagingSenderId: '812537214274',
  appId: '1:812537214274:web:492d7454eb9b2660a244db',
  measurementId: 'G-0XE2PX3HBR',
};
