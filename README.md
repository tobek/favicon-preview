# Favicon Preview

A static web app for previewing favicons in realistic browser tab contexts. Upload multiple favicons and see them displayed in mockups of browser tabs across different themes and states to compare how they look in the wild, and then share these previews.

## Features

**Core Functionality:**
- Drag-drop and file picker favicon upload (.ico, .png, .svg, .webp) or add image by clipboard paste
- Preview in 5 browser contexts: Chrome Dark/Light/Color, Safari Tahoe Dark/Light
- Share previews
- Expanded/collapsed tab states with active/inactive styling
- Browser tab favicon preview (eye icon + automatic on upload/preview)
- Editable favicon titles with truncation

**Customization/UX:**
- Dark/light page mode toggle (auto-detected from system preferences)
- Chrome color theme picker with auto-generated shades
- Dynamic tab count (starts with 5 example tabs, grows with uploads)
- Tab click activation
- Horizontal scroll for overflow tabs

**Sharing & Export:**
- Shareable shortlinks (e.g., `/?s=abc1234`) with uploaded favicons
- Client-side image compression (max 256×256—sufficient for favicons)
- Firebase Storage hosting for shared images
- Firestore Database for shortlink mappings
- Download button for each favicon (compressed PNG)
- Error handling for expired/missing images

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible primitives
- **shadcn/ui** - Pre-built components
- **Firebase Storage** - Image hosting for shareable links
- **Firestore Database** - Shortlink storage

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Configuration

### Firebase Setup (Required for Shareable Links)

Firebase configuration is stored in `src/config/firebase.config.ts` and committed to the repo. The config values are designed to be public (security is enforced via Firebase Security Rules).

**Setup steps:**
1. Create project at https://console.firebase.google.com/
2. Enable Storage: Build → Storage → Get Started
3. Enable Firestore: Build → Firestore Database → Create Database (production mode)
4. Add web app: Project Settings → Your apps → Add app (Web)
5. Copy firebaseConfig values to `src/config/firebase.config.ts`
6. Deploy security rules: `firebase deploy --only storage,firestore`

**CORS Configuration (Required):**
```bash
# Set CORS to allow localhost and production domains
gsutil cors set cors.json gs://favicon-preview.firebasestorage.app
```

The `cors.json` file is included in the repo and allows image fetching from localhost and Firebase hosting domains.

**Deployment:**
```bash
npm run build
firebase deploy
```

## Architecture

### Core Concept
Client-side only, no backend. File processing happens entirely in the browser using the FileReader API.

### Component Structure

**Main Components:**
- `App.tsx` - Main orchestrator with state management for uploads, themes, and sharing
- `ShareButton.tsx` - Handles share flow (compress → upload → generate URL)
- `Tooltip.tsx` - Custom CSS-based tooltip component with instant appearance
- Tab components (specialized per browser/theme):
  - `ChromeDarkTab.tsx` - Chrome dark theme tabs
  - `ChromeLightTab.tsx` - Chrome light theme tabs
  - `ChromeColorTab.tsx` - Chrome with customizable color theme
  - `SafariTahoeDarkTab.tsx` - Safari dark theme floating tabs
  - `SafariTahoeLightTab.tsx` - Safari light theme floating tabs

**Utility Modules:**
- `src/utils/imageCompression.ts` - Client-side image compression (Canvas API, max 256×256)
- `src/utils/firebaseUpload.ts` - Firebase Storage upload with retry logic
- `src/utils/shareUrl.ts` - URL encoding/decoding with minified JSON
- `src/firebase.ts` - Firebase app initialization
- `src/types.ts` - TypeScript interfaces

### Layout Pattern
Each row represents a browser context (e.g., "Chrome - Dark"). Within each row, tabs display a mix of example favicons (Google, GitHub, YouTube, etc.) and uploaded favicons. Uploaded favicons replace example ones from the middle outwards as users upload more.

### File Handling
- Supported formats: all images and .ico (multi-resolution .ico files handled by browser's native support)
- FileReader API converts files to data URLs
- Client-side compression resizes images to max 256×256 PNG (sufficient for favicons)

### Shareable Links

**How It Works:**
1. User clicks Share button
2. Favicons are compressed client-side (max 256×256)
3. Images uploaded to Firebase Storage with retry logic
4. Shortlink created in Firestore with favicon URLs and theme color
5. URL generated: `https://faviconpreview.fyi?s=abc1234`
6. Recipients load shared URL, app fetches shortlink data and restores state

**Security:**
- Firebase Storage with upload-only rules (clients cannot delete)
- 1MB max file size enforced server-side
- Images-only restriction in security rules
- Public Firebase config is safe to expose (by design)

**Storage:**
- Free tier: 5GB storage, 1GB/day downloads
- Typical favicon: <50KB compressed
- No automatic expiration (manual cleanup via cron script)

## Browser Support

Tab mockups represent:

- **Chrome**: 3 themes (Dark, Light, Color with customizable palette)
- **Safari Tahoe**: 2 themes (Dark, Light) with floating rounded tab design

Tab mockups capture browser feel but are not pixel-perfect recreations.
