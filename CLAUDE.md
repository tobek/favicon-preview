# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static web app for previewing favicons in realistic browser tab contexts. Users can upload multiple favicons and see them displayed in mockups of browser tabs across different states (light/dark themes, expanded/compressed tabs) to compare how they look "in the wild."

**Key Differentiator:** Shows favicons in realistic tab mockups (not isolated boxes), allowing side-by-side comparison with dummy favicons for realistic context.

**See SCOPE.md for detailed requirements, decisions, and research findings.**

### Current Features (v0.5.0)

**Core Functionality:**
- Drag-drop and file picker favicon upload (.ico, .png, .svg, .webp)
- 5 browser contexts: Chrome Dark/Light/Color, Safari Tahoe Dark/Light
- Expanded/collapsed tab states with active/inactive styling
- Editable favicon titles with fade-out truncation
- Tab click activation (synchronized across all rows)
- Horizontal scroll for overflow tabs

**Customization:**
- Dark/light page mode toggle (auto-detected from system preferences)
- Chrome color theme picker with auto-generated shades
- Dynamic tab count (starts with 5 example tabs, grows with uploads)

**Sharing & Export:**
- Share button generates URL with uploaded favicons
- Client-side image compression (max 1024x1024)
- ImageKit CDN hosting for shared images
- Download button for each favicon (compressed PNG)
- Load shared previews from URL
- Error handling for expired/missing images

**UI Polish:**
- Instant tooltips (150ms fade-in) for all action icons
- Full-page drag overlay with visual feedback
- Browser tab favicon preview (eye icon + automatic on upload)
- Mobile-responsive (hides mode toggle on small screens)

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible primitives
- **shadcn/ui** - Pre-built components on top of Radix

## Architecture

### Core Concept
Client-side only, no backend. File processing happens entirely in the browser using FileReader API.

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
- `src/utils/imageCompression.ts` - Client-side image compression (Canvas API)
- `src/utils/imagekitUpload.ts` - ImageKit CDN upload with retry logic
- `src/utils/shareUrl.ts` - URL encoding/decoding with minified JSON
- `src/types.ts` - TypeScript interfaces for state and API responses

**Layout Pattern:**
Each row represents a browser context (e.g., "Chrome - Dark"). Within each row, tabs display a mix of example favicons (Google, GitHub, YouTube, etc.) and uploaded favicons, replacing from the middle outwards as users upload more.

### File Handling
- Support: .ico, .png, .svg, .webp
- Use FileReader API to convert to data URLs
- Client-side compression: images resized to max 1024x1024 (maintains aspect ratio)
- Compressed images stored alongside originals (~80-90% size reduction)
- Handle multi-resolution .ico files appropriately
- State management: local React state

### Shareable Links (v0.5.0)
- **Implemented**: Generate shareable URLs that encode favicon previews
- **Image Hosting**: ImageKit CDN (20GB free storage, 20GB bandwidth/month)
- **URL Format**: Minified base64-encoded JSON (reduces URL length by ~40%)
- **Data Shared**: Favicon URLs + titles + Chrome color theme (NOT UI state)
- **Error Handling**: Validates image URLs, shows error banner for expired/missing images
- **Download**: Each uploaded favicon can be downloaded as compressed PNG
- **Configuration**: Requires ImageKit API keys in `.env.local` (see Configuration section)

### Styling Approach
- Tab mockups built with Tailwind utilities
- CSS custom properties for theming (light/dark)
- Maintain visual consistency while capturing browser "feel" (not pixel-perfect replicas)

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Configuration

### ImageKit Setup (for Shareable Links)

Create a `.env.local` file in the project root with your ImageKit credentials:

```bash
VITE_IMAGEKIT_PUBLIC_KEY=your_public_key_here
VITE_IMAGEKIT_PRIVATE_KEY=your_private_key_here
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

**Getting API keys:**
1. Sign up at https://imagekit.io/ (free tier: 20GB storage + 20GB bandwidth)
2. Go to Developer Options in dashboard
3. Copy Public Key, Private Key, and URL Endpoint
4. Add to `.env.local`
5. Restart dev server

**Note:** Share functionality gracefully degrades if credentials are not configured.

## Visual Testing

Use the `webapp-testing` skill to verify visual appearance after making UI changes unless it is so simply that you're certain no visual inspection is needed:

```bash
# Example: Take a screenshot to verify changes
claude skill webapp-testing
# Then write a Playwright script to capture screenshots
```

**When to use webapp-testing:**
- After implementing visual/UI changes to verify appearance
- Before committing significant UI updates
- Focus on visual verification; manual interaction testing is more efficient for UX
- Use full-page screenshots to capture all preview contexts at once

## Design Decisions For Mock Tabs

**Browser Variants (Finalized):**
- Chrome: 3 themes (Dark, Light, Color with customizable palette)
- Safari Tahoe: 2 themes (Dark, Light) with floating rounded tab design
- Firefox: Deferred (similar enough to Chrome for v1)
- Edge: Deferred (uses Chromium, visually similar to Chrome)

**Tab States Implemented:**
- Expanded: Shows favicon + title + close button
- Collapsed: Shows favicon only (toggle available)
- Active/Inactive: Visual distinction for focused tab
- Pinned tabs: Deferred to future version

**Example Favicons:**
Default tabs show popular sites (Google, GitHub, YouTube, Reddit, Stack Overflow) to provide realistic context. Uploaded favicons replace these from middle outwards.

**Simplicity First:** Avoid over-engineering. Tab mockups capture the "feel" of each browser rather than pixel-perfect recreation. All processing is client-side with no complex backend infrastructure.
