# Favicon Preview - Scope & Decisions

## Project Vision

A static web app that previews favicons in realistic browser tab contexts, allowing designers to see how their icons look "in the wild" alongside other tabs.

**Key Differentiator:** Unlike existing tools that show favicons in isolated boxes, this shows them in actual tab mockups with realistic spacing, backgrounds, and browser chrome.

## Core Features

### 1. Upload & Preview
- Upload one or multiple favicon files (drag-drop + file picker)
- Instant preview across multiple browser/theme contexts
- Support formats: ICO, PNG, SVG (potentially WEBP)

### 2. Contextual Display
- Show favicons in browser tab mockups (not isolated boxes)
- Display contexts organized in rows by type
- Each row shows: several dummy/placeholder favicons + uploaded favicon(s)
- Realistic tab appearance with proper spacing, shadows, borders

### 3. Comparison View
- Multiple uploaded favicons shown simultaneously
- Easy visual scanning to compare designs side-by-side
- See how your favicon stands out (or blends in) with others

## Future Features

### Shareable Links
- Generate shareable URLs that encode the uploaded favicons
- Allow users to share preview context with team/clients
- No backend storage needed (data in URL or localStorage)

## Display Contexts (Finalized - v1)

### Implemented Tab Types
1. **Chrome Dark** - Dark theme with subtle rounded corners
2. **Chrome Light** - Light theme with gray background
3. **Chrome Color** - Colored theme background (customizable)
4. **Safari Tahoe Dark** - Floating rounded tabs, dark theme
5. **Safari Tahoe Light** - Floating rounded tabs, light theme

### Tab States
- **Expanded**: Shows favicon + title text + close button
- **Collapsed**: Shows favicon only (activated via toggle)
- **Active/Inactive**: Visual distinction for focused tab

### Deferred for Later
- Firefox tabs (similar enough to Chrome for v1)
- Pinned tabs
- Edge (uses Chromium, visually similar to Chrome)

## Technical Stack

- **React** - Component framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible primitives
- **shadcn/ui** - Pre-built components

## Design Principles

1. **Simplicity First** - Don't overengineer with excessive options
2. **Useful, Not Perfect** - Tab mockups should capture the "feel" rather than pixel-perfect browser recreation
3. **Static & Fast** - No backend, all client-side processing
4. **Practical Utility** - Focus on contexts designers actually care about

## Implementation Decisions

### Design Decisions
- [x] **Browser variants**: Chrome (3 themes) + Safari Tahoe (2 themes) = 5 total
- [x] **Active/inactive states**: Yes, implemented with visual distinction
- [ ] **Pinned tabs**: Deferred to future version
- [x] **Dummy favicons**: Using popular sites (Google, GitHub, YouTube)

### Technical Decisions
- [x] **ICO handling**: Browser native support, no conversion needed
- [x] **State management**: React useState for collapse toggle
- [ ] **Shareable links**: Planned for future (URL encoding or localStorage)
- [ ] **File uploads**: Not yet implemented (currently uses static examples)
- [ ] **Favicon rounding**: Needs investigation - inconsistent across sites

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

## Out of Scope (For Now)

- Favicon generation/creation tools
- File format conversion
- Size optimization suggestions
- Bookmark bar previews
- Mobile browser tabs
- Browser extension integration

## Implementation Status

### Completed (v0.1)
- [x] Project setup (Vite + React + TypeScript + Tailwind)
- [x] Tab components for all 5 contexts
- [x] Collapse toggle functionality
- [x] Demo page with example favicons
- [x] Basic styling and layout

### Next Steps (v0.2)
1. Add file upload functionality (drag-drop + file picker)
2. Handle multiple uploaded favicons dynamically
3. Investigate favicon rounding behavior (why some are rounded, some aren't)
4. Improve visual fidelity based on user feedback
5. Add ability to remove uploaded favicons

### Future Features (v1.0)
- Shareable links with encoded favicon data
- Custom color picker for Chrome Color theme
- Export as image/screenshot
- More tab contexts if needed
