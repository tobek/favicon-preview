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

## Planned Features

### v0.6.0
- Update icon rounding behavior: no rounding on Chrome tabs, 2px border radius on Safari tabs
- Active state for "preview in browser tab" button (eye icon shows which favicon is currently in browser tab)
- When loading a shared link, set first shared favicon in browser tab with active state
- Show loading symbol in favicon box while image compression happens

### v1.0+ (Future)
- Deploy to Firebase Hosting
- Create shortlinks for shared previews using Firebase Storage
- Support dragging in .ico files (currently nothing happens)
- Improve visual fidelity based on user feedback
  - Safari tabs fill available space?
  - Check Safari too-long title truncation style
- More tab contexts if needed
- Cleanup script for 6-month expiration (manual cron job)

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
