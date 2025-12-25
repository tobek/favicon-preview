# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static web app for previewing favicons in realistic browser tab contexts. Users can upload multiple favicons and see them displayed in mockups of browser tabs across different states (light/dark themes, expanded/compressed tabs) to compare how they look "in the wild."

**Key Differentiator:** Shows favicons in realistic tab mockups (not isolated boxes), allowing side-by-side comparison with dummy favicons for realistic context.

**See SCOPE.md for detailed requirements, decisions, and research findings.**

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
- `FaviconUploader` - Handles drag-drop and file picker for favicon uploads
- `TabMockup` - Generic component rendering a single browser tab mockup
  - Props: browser type, theme (light/dark), state (expanded/compressed), favicon
  - CSS-based (not images) to allow easy theming
- `PreviewRow` - Renders a horizontal row of tabs for one preview context
  - Shows dummy favicons + uploaded favicon(s) side-by-side
- `PreviewGrid` - Main orchestrator showing all preview row types

**Layout Pattern:**
Each row represents a preview context (e.g., "Chrome Dark - Expanded"). Within each row, display several dummy/placeholder favicons followed by the user's uploaded favicon(s) for realistic comparison.

### File Handling
- Support: .ico, .png, .svg (potentially .webp)
- Use FileReader API to convert to data URLs
- Handle multi-resolution .ico files appropriately
- State management: local React state

### Shareable Links (Future Feature)
- Generate URLs that encode uploaded favicon data
- Allow sharing preview context with team/clients
- No backend storage - data encoded in URL or localStorage

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

## Visual Testing

Use the `webapp-testing` skill to verify visual appearance after making UI changes:

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

## Design Decisions

**Browser Scope:** Start with "generic modern browser tab" aesthetic. Only add browser-specific variants (Chrome vs Safari vs Firefox) if research shows meaningful visual differences worth previewing.

**Preview Contexts (minimum viable):**
- Light theme, expanded tab (icon + title)
- Dark theme, expanded tab
- Light theme, compressed tab (icon only)
- Dark theme, compressed tab

**Simplicity First:** Avoid over-engineering. No server-side generation, no complex state management. The goal is a useful tool, not feature bloat.
