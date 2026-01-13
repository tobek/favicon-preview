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
- `src/components/DownloadAllButton.tsx` - Download all favicons as ZIP
- `src/components/Tooltip.tsx` - Custom CSS tooltip component

**Utilities:**
- `src/utils/imageCompression.ts` - Canvas-based image compression
- `src/utils/firebaseUpload.ts` - Firebase Storage uploads
- `src/utils/shareUrl.ts` - URL encoding/decoding (fallback for long URLs)
- `src/utils/shortlink.ts` - Firestore shortlink operations (generate, create, load)
- `src/utils/zipDownload.ts` - Zip creation and download logic
- `src/firebase.ts` - Firebase initialization (Storage + Firestore)
- `src/types.ts` - TypeScript interfaces

## Visual Testing

Use the `webapp-testing` skill to verify visual changes unless the change is trivial and you're certain no visual inspection is needed. In order to assess the usefulness of this, please alert the user if this check results in fixes.

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
   - If a refactor would be clearly advised for code quality etc., then please confirm with the user before refactoring
- Don't add error handling for scenarios that can't happen
- Don't add backwards compatibility where updating all call sites would suffice
- Don't create abstractions for one-time operations
- Three similar lines of code is better than a premature abstraction

**Code Style:**
- Tab mockups capture browser "feel" rather than pixel-perfect recreation
- Use Tailwind utilities for styling
- No emojis unless explicitly requested

**State Management:**
- Local React state only (no external state management)
- All file processing happens client-side (FileReader API)

**Git Commits:**
- Do NOT add "Generated with Claude Code" branding or "Co-Authored-By: Claude..." attribution to commits

## Documentation Updates

**After implementing features, ALWAYS update documentation:**

1. **SCOPE.md** - Version history and feature tracking
   - Mark completed features as ✓ in the appropriate version section
   - Move completed version from "Planned Features" to version history
   - Add detailed implementation notes for significant features

2. **README.md** - High-level project overview
   - Only update for major architectural changes or new core features
   - Keep the features list concise and high-level
   - Update if new dependencies or setup steps are added

3. **CLAUDE.md** - Agent instructions (this file)
   - Update if new development patterns or conventions are established
   - Add new utility modules or component organization changes
   - Document new testing or development workflows
