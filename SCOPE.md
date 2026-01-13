# Project Scope & Development History

**For project overview and architecture, see [README.md](./README.md).**

This document tracks detailed version history, planned features, research findings, and design decisions.

## Version History

### v0.1 - Initial Setup
- [x] Project setup (Vite + React + TypeScript + Tailwind)
- [x] Tab components for all 5 contexts
- [x] Collapse toggle functionality
- [x] Demo page with example favicons
- [x] Basic styling and layout

### v0.2 - Core Interactivity

#### Dark/Light Mode Toggle ✓
- [x] Toggle icon in top right corner
- [x] Changes page background and body text color
- [x] Default: detect from browser prefers-color-scheme

#### Chrome Color Theme Picker ✓
- [x] Color picker positioned after "Chrome - Color Theme" heading
- [x] User picks main color, app auto-generates 2 additional shades
- [x] Text color (black/white) chosen based on contrast

#### Tab Click Activation ✓
- [x] Clicking any tab activates it and deactivates others
- [x] Active state synchronized across all preview rows
- [x] Initial state: 2nd tab active by default

#### Favicon Upload System ✓
- [x] Upload management UI at top of page
- [x] Drag-drop and file picker support
- [x] Upload management shows all uploaded favicons compactly
- [x] Remove button for each uploaded favicon
- [x] **Replacement Strategy**: Uploaded favicons replace example favicons from middle outwards
  - Example: 2 uploads replace positions 3 & 4 (of 6 tabs)
  - Example: 4 uploads replace positions 2, 3, 4, 5 (of 6 tabs)
- [x] **Dynamic Tab Count**: If more than 6 favicons uploaded, add additional tabs
- [x] **Horizontal Scroll**: Preview rows scroll horizontally if overflow
- [x] Each favicon has editable title field
- [x] Long titles truncate with fade-out effect (Chrome style)
- [x] No maximum number of favicon uploads

**Implementation Decisions:**
- Dark/light mode scope: Page background/text only
- Color picker: Main color + 2 auto-generated shades
- Initial active tab: Position 2 (second tab)
- Upload UI location: Top of page
- Favicon positioning: Middle-outward replacement pattern
- Tab overflow: Horizontal scroll only

### v0.3 - UI/UX Polish

#### Enhancements ✓
1. **Color Picker Enhancement** ✓
   - [x] Remove white outline around color picker
   - [x] Add pencil icon next to color picker (always visible)

2. **Favicon Title Editing** ✓
   - [x] Add pencil icon next to favicon titles (always visible)
   - [x] Makes editable nature of titles more discoverable

3. **Default Tab Count** ✓
   - [x] Start with 8 example tabs by default
   - [x] Sites: Google, GitHub, YouTube, Reddit, Stack Overflow, Wikipedia, Twitter, LinkedIn

4. **Remove Button Icon** ✓
   - [x] Replace X icon with trash icon for remove favicon button

5. **Title Truncation Style** ✓
   - [x] Change from ellipsis (...) to fade-out effect
   - [x] Matches Chrome's actual tab title behavior

### v0.3.1 - Bug Fixes & Refinements

1. **Horizontal Scroll Behavior** ✓
   - [x] Move horizontal scroll from per-row to whole section
   - [x] Single scrollbar controls all tab preview rows together

2. **Chrome Tab Close Button** ✓
   - [x] Make X close button always visible on Chrome tabs

3. **Favicon Title Pencil Icon Interaction** ✓
   - [x] Add hover state to pencil icon
   - [x] Make pencil icon clickable to focus/start editing

4. **Tab Title Fadeout on Hover** ✓
   - [x] Fix gradient becoming visible on tab hover
   - [x] Different fade gradient for hover state

### v0.3.2 - Drag-and-Drop Improvements

1. **Full-Page Drop Target** ✓
   - [x] Accept dropped files anywhere on the page
   - [x] Entire window becomes drop zone

2. **Drag Overlay Effect** ✓
   - [x] Full-page visual overlay when dragging files
   - [x] Semi-transparent backdrop with blur effect
   - [x] Dashed blue border around edges
   - [x] Large upload icon and message in center
   - [x] Overlay adapts to dark/light mode
   - [x] Proper drag state management

### v0.3.3 - Browser Tab Preview

1. **Eye Icon for Manual Preview** ✓
   - [x] Add eye icon button for each uploaded favicon
   - [x] Clicking eye icon previews favicon in actual browser tab
   - [x] Includes hover states and tooltip

2. **Automatic Preview on Upload** ✓
   - [x] Automatically set uploaded favicon as browser tab icon
   - [x] When uploading multiple favicons, use the last one
   - [x] Works for both drag-drop and file picker uploads

### v0.4.0 - UI Improvements

1. **Instant Tooltips** ✓
   - [x] Create custom CSS-based Tooltip component
   - [x] Add tooltips to edit, preview, and remove icons
   - [x] Smooth 150ms fade-in (replacing slow browser tooltips)
   - [x] Dark background with arrow pointer

2. **Mobile Responsiveness** ✓
   - [x] Hide dark/light mode toggle on mobile devices
   - [x] Toggle only visible on medium screens and larger (768px+)

3. **Default Tab Count Adjustment** ✓
   - [x] Reduce default starting tabs from 8 to 5
   - [x] Sites: Google, GitHub, YouTube, Reddit, Stack Overflow

### v0.5.0 - Shareable Links (ImageKit)

**Note: ImageKit implementation replaced by Firebase in v0.5.1 due to security concerns (private key exposure)**

1. **Image Compression** ✓
   - [x] Client-side compression (max 1024×1024, maintains aspect ratio)
   - [x] Automatic retry logic with exponential backoff
   - [x] Concurrent upload support (max 3 parallel)
   - [x] Partial failure handling

2. **Share Button & URL Generation** ✓
   - [x] Share button appears when favicons uploaded
   - [x] Upload progress indicator
   - [x] Minified base64-encoded JSON URLs
   - [x] Share URL encodes: favicons + Chrome color theme
   - [x] Copy-to-clipboard functionality
   - [x] URL length warning for browser limits

3. **Load from Shared URL** ✓
   - [x] Automatic detection of share parameter
   - [x] Image URL validation
   - [x] Error banner for unavailable favicons
   - [x] Loading indicator
   - [x] Restores Chrome color theme

4. **Download Favicons** ✓
   - [x] Download button for each uploaded favicon
   - [x] Downloads compressed version
   - [x] Sanitized filename based on title

### v0.5.1 - Firebase Storage Migration

**Replaced ImageKit with Firebase Storage for security**

1. **Firebase Storage Integration** ✓
   - [x] Create Firebase project and configure
   - [x] Firebase initialization (`src/firebase.ts`)
   - [x] Upload utility (`src/utils/firebaseUpload.ts`)
   - [x] Update ShareButton to use Firebase
   - [x] Delete ImageKit utility

2. **Security Rules** ✓
   - [x] Deploy upload-only security rules
   - [x] File size limit (1MB max)
   - [x] File type restriction (images only)
   - [x] No client delete access

3. **Compression Optimization** ✓
   - [x] Reduced max dimensions from 1024×1024 to 256×256
   - [x] Significantly smaller file sizes

4. **Firebase Hosting** ✓
   - [x] Configured `firebase.json` for hosting
   - [x] Deploy with `npm run build && firebase deploy`

**Why Firebase over ImageKit:**
- No credentials exposed (public Firebase config is safe by design)
- Security rules enforce upload-only (clients cannot delete)
- File size/type limits in security rules
- Free tier: 5GB storage, 1GB/day downloads
- Pricing: ~$0/mo for 100-1000 MAU

### v0.6.0 - UI/UX Enhancements

1. **Icon Rounding Updates** ✓
   - [x] Chrome tabs: no border radius on favicons (unchanged)
   - [x] Safari tabs: 2px border radius on favicons

2. **Active Preview State** ✓
   - [x] Eye icon shows active state (blue color) when favicon is in browser tab
   - [x] Visual indicator for which favicon is currently previewed
   - [x] State tracked across uploads and interactions

3. **Shared Link Improvements** ✓
   - [x] First shared favicon automatically set in browser tab on load
   - [x] Preview button shows active state for loaded favicon

4. **Loading Indicators** ✓
   - [x] Loading spinner displayed during image compression
   - [x] Shows filename while processing
   - [x] Smooth transition from loading to loaded state

### v1.0 - CI/CD Pipeline

1. **GitHub Actions Workflows** ✓
   - [x] PR checks workflow (lint + build + Firebase preview deploy)
   - [x] Production deploy workflow (auto-deploy on merge to main)
   - [x] Firebase preview channels for PR testing
   - [x] Automated quality checks before deployment

**Setup Required:**
- GitHub repository secret:
  - `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
  - (Project ID automatically read from `.firebaserc`)

**Workflow Triggers:**
- PRs to main: Lint, build, and deploy to preview channel
- Push to main: Lint, build, and deploy to production

### v1.1 - Shortlinks

1. **Firestore Database Integration** ✓
   - [x] Firestore database setup with security rules
   - [x] Document structure: shortlinks collection with favicons, color, version, createdAt
   - [x] Upload-only security rules (max 50 favicons, validation)

2. **Short ID Generation** ✓
   - [x] 7-character IDs using nanoid
   - [x] Alphabet: 0-9A-Za-z (62 characters, URL-safe)
   - [x] Collision detection with retry logic (max 3 attempts)

3. **Share Flow Updates** ✓
   - [x] Create shortlink after successful image uploads
   - [x] URL format: `/?s=<shortId>` (query parameter)
   - [x] Error handling if shortlink creation fails

4. **Load Flow Updates** ✓
   - [x] Check `?s=` parameter for shortlinks
   - [x] Load from Firestore by shortId
   - [x] Error handling for missing/invalid shortlinks

**Implementation Details:**
- Storage: Firestore Database (not Firebase Storage)
- ID length: 7 characters (collision-resistant for millions of links)
- URL format: Query parameter `?s=abc1234` for simplicity
- Security: Public read, validated write, no client deletes
- Free tier: 50k reads/day, 20k writes/day (sufficient for most usage)

**Files Created:**
- `firestore.rules` - Security rules for shortlinks collection
- `src/utils/shortlink.ts` - Core shortlink logic (generate, create, load)

**Files Modified:**
- `firebase.json` - Added Firestore rules configuration
- `src/firebase.ts` - Initialize Firestore database
- `src/types.ts` - Added ShortlinkDocument interface
- `src/components/ShareButton.tsx` - Integrated shortlink creation
- `src/App.tsx` - Load from `?s=` parameter with fallback

### v1.2 - Download All Feature

1. **Zip Download for Shared Previews** ✓
   - [x] "Download All as ZIP" button in shared preview mode
   - [x] Client-side zip generation using jszip library
   - [x] Button visible only on desktop (hidden on mobile)
   - [x] Progress indicator during zip creation
   - [x] Automatic file extension detection from MIME type
   - [x] Filename sanitization for safe downloads

**Implementation Details:**
- Client-side only: No server-side processing required
- Compression: DEFLATE level 6 (balance between speed and size)
- Default filename: `favicons.zip`
- File naming: `{sanitizedTitle}.{extension}` with auto-detected extensions
- Error handling: Individual file failures don't stop entire download
- Visibility: Desktop only (`hidden md:block`), shared preview mode only

**Files Created:**
- `src/utils/zipDownload.ts` - Zip creation and download logic
- `src/components/DownloadAllButton.tsx` - Download all button component

**Files Modified:**
- `package.json` - Added jszip and @types/jszip dependencies
- `src/App.tsx` - UI integration for download all button
- `src/components/ShareButton.tsx` - Fixed TypeScript setTimeout type issue

## Planned Features

- Cleanup script to remove all uploaded favicons and shortlinks in Firebase that are older than 6 months (ensure that loading previews with missing favicons/shortlinks fails gracefully)
- Improve visual fidelity based on research/screenshots

## Research Findings

### Browser Tab Behavior
- **Chrome**: Progressive shrinking (title+icon → icon only → no icon)
- **Safari 2025**: Floating rounded tabs with "Liquid Glass" design
- **Firefox**: Rounded tabs with elevation/shadow effect

### Favicon Rendering Quirks
- Different browsers prefer different formats/sizes
- Multi-layer ICO files render differently per browser
- Chrome/Safari use first layer, Firefox uses last layer
- Format selection order varies (Firefox/Safari use last in HTML, Chrome has complex logic)

## Design Decisions

### Browser Variants (Finalized)
- **Chrome**: 3 themes (Dark, Light, Color with customizable palette)
- **Safari Tahoe**: 2 themes (Dark, Light) with floating rounded tab design
- **Firefox**: Deferred (similar enough to Chrome for v1)
- **Edge**: Deferred (uses Chromium, visually similar to Chrome)

### Tab States Implemented
- **Expanded**: Shows favicon + title + close button
- **Collapsed**: Shows favicon only (toggle available)
- **Active/Inactive**: Visual distinction for focused tab
- **Pinned tabs**: Deferred to future version

### Example Favicons
Default tabs show popular sites (Google, GitHub, YouTube, Reddit, Stack Overflow) to provide realistic context. Uploaded favicons replace these from middle outwards.

### Technical Decisions
- [x] **ICO handling**: Browser native support, no conversion needed
- [x] **State management**: React useState for all state
- [x] **Shareable links**: Implemented with Firebase Storage
- [x] **File uploads**: Implemented with drag-drop and file picker
- [ ] **Favicon rounding**: Needs investigation - inconsistent across sites
- [x] **Image hosting**: Firebase Storage (upload-only security rules)

## Out of Scope

- Favicon generation/creation tools
- File format conversion
- Size optimization suggestions
- Bookmark bar previews
- Mobile browser tabs
- Browser extension integration
