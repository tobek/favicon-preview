# Admin Scripts

Collection of administrative scripts for managing the Favicon Preview application.

## list-shortlinks.ts

Lists all saved shortlinks from Firestore, sorted chronologically (oldest first).

**Usage:**
```bash
npm run list-shortlinks
```

**Output format:**
```
2026/01/01: https://faviconpreview.fyi/?s=NqoJoMQ
2026/03/25: https://faviconpreview.fyi/?s=qBorGei
...

Total: 23 shortlinks
```

**Requirements:**
- Firebase credentials configured in `src/config/firebase.config.ts`
- `tsx` package installed (dev dependency)
