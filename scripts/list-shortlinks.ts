#!/usr/bin/env tsx

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase.config';
import type { ShortlinkDocument } from '../src/types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listShortlinks() {
  try {
    const shortlinksRef = collection(db, 'shortlinks');
    const q = query(shortlinksRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No shortlinks found.');
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data() as ShortlinkDocument;
      const date = new Date(data.createdAt);
      const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '/');
      const count = data.favicons.length;
      const publicFlag = data.public ? ' [public]' : '';
      console.log(`${formattedDate}: https://faviconpreview.fyi/?s=${data.id} (${count} favicon${count === 1 ? '' : 's'})${publicFlag}`);
    });

    console.log(`\nTotal: ${snapshot.size} shortlinks`);
  } catch (error) {
    console.error('Error fetching shortlinks:', error);
    process.exit(1);
  }

  process.exit(0);
}

listShortlinks();
