# Agent Instructions for Claude Code

**For project overview, architecture, and technical details, see [README.md](./README.md).**

**For feature roadmap, version history, research, and design decisions, see [SCOPE.md](./SCOPE.md).**

## Component Organization

**Tab Components:**
- `src/components/tabs/ChromeDarkTab.tsx`
- `src/components/tabs/ChromeLightTab.tsx`
- `src/components/tabs/ChromeColorTab.tsx`
- `src/components/tabs/SafariTahoeDarkTab.tsx`
- `src/components/tabs/SafariTahoeLightTab.tsx`

**Main Components:**
- `src/App.tsx` - State management for uploads, themes, sharing
- `src/components/ShareButton.tsx` - Share flow orchestration
- `src/components/Tooltip.tsx` - Custom CSS tooltip component

**Utilities:**
- `src/utils/imageCompression.ts` - Canvas-based image compression
- `src/utils/firebaseUpload.ts` - Firebase Storage uploads
- `src/utils/shareUrl.ts` - URL encoding/decoding
- `src/firebase.ts` - Firebase initialization
- `src/types.ts` - TypeScript interfaces

## Visual Testing

Use the `webapp-testing` skill to verify visual changes unless the change is trivial and you're certain no visual inspection is needed.

**When to use:**
- After implementing visual/UI changes to verify appearance
- Before committing significant UI updates
- Use full-page screenshots to capture all preview contexts at once

**When NOT to use:**
- Trivial changes where visual outcome is certain
- Manual interaction testing is more efficient for UX flows

## Development Guidelines

**Avoid Over-Engineering:**
- Only make changes that are directly requested or clearly necessary
- Don't add features, refactor code, or make "improvements" beyond what was asked
- Don't add error handling for scenarios that can't happen
- Don't create abstractions for one-time operations
- Three similar lines of code is better than a premature abstraction

**Code Style:**
- Tab mockups capture browser "feel" rather than pixel-perfect recreation
- Use Tailwind utilities for styling
- Avoid creating new files unless absolutely necessary—prefer editing existing ones
- No emojis unless explicitly requested

**State Management:**
- Local React state only (no external state management)
- All file processing happens client-side (FileReader API)
