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

### Completed (v0.2)

#### 1. Dark/Light Mode Toggle ✓
- [x] Toggle icon in top right corner
- [x] Changes page background and body text color (not tab mockup themes, for now)
- [x] Default: detect from browser prefers-color-scheme, fallback to time of day

#### 2. Chrome Color Theme Picker ✓
- [x] Color picker positioned right after "Chrome - Color Theme" heading
- [x] User picks main color, app auto-generates 2 additional shades
- [x] Text color (black/white) chosen based on contrast with picked color

#### 3. Tab Click Activation ✓
- [x] Clicking any tab activates it and deactivates others
- [x] Active state synchronized across all preview rows
- [x] Initial state: 2nd tab active by default

#### 4. Favicon Upload System ✓
- [x] Upload management UI at top of page
- [x] Drag-drop and file picker support
- [x] Upload management shows all uploaded favicons compactly
- [x] Remove button for each uploaded favicon
- [x] **Replacement Strategy**: Uploaded favicons replace example favicons from middle outwards
  - Example: 2 uploads replace positions 3 & 4 (of 6 tabs)
  - Example: 4 uploads replace positions 2, 3, 4, 5 (of 6 tabs)
- [x] **Dynamic Tab Count**: If more than 6 favicons uploaded, add additional tabs
- [x] **Horizontal Scroll**: Preview rows scroll horizontally if overflow, page title stays centered
- [x] Each favicon has editable title field (editable at all times)
- [x] Long titles truncate with fade-out effect (Chrome style)
- [x] No maximum number of favicon uploads

### v0.2 Implementation Decisions
- **Dark/light mode scope**: Page background/text only (may expand to tab themes later)
- **Color picker**: Main color + 2 auto-generated shades for Chrome Color Theme tabs
- **Initial active tab**: Position 2 (second tab)
- **Upload UI location**: Top of page (design refinement later)
- **Favicon positioning**: Middle-outward replacement pattern
- **Tab overflow**: Horizontal scroll only, centered page layout preserved

**All v0.2 features completed and tested successfully!**

### Completed (v0.3)

#### UI/UX Polish Features ✓
1. **Color Picker Enhancement** ✓
   - [x] Remove white outline around color picker
   - [x] Add pencil icon next to color picker (always visible, part of click target)
   - [x] Indicates editability more clearly

2. **Favicon Title Editing** ✓
   - [x] Add pencil icon next to favicon titles (always visible)
   - [x] Makes editable nature of titles more discoverable

3. **Default Tab Count** ✓
   - [x] Start with 8 example tabs by default (Google, GitHub, YouTube, Reddit, Stack Overflow, Wikipedia, Twitter, LinkedIn)
   - [x] Provides more realistic preview context

4. **Remove Button Icon** ✓
   - [x] Replace X icon with trash icon for remove favicon button
   - [x] More intuitive icon for destructive action

5. **Title Truncation Style** ✓
   - [x] Change from ellipsis (...) truncation to fade-out effect
   - [x] Matches Chrome's actual tab title behavior with gradient overlay

**All v0.3 features completed and tested successfully!**

### Completed (v0.3.1)

#### Bug Fixes & Refinements ✓
1. **Horizontal Scroll Behavior** ✓
   - [x] Move horizontal scroll from per-row to whole section containing all rows
   - [x] Single scrollbar should control all tab preview rows together

2. **Chrome Tab Close Button** ✓
   - [x] Make X close button always visible on Chrome tabs (not just on hover)
   - [x] Reference: `chrome-color-bg.png` shows expected behavior

3. **Favicon Title Pencil Icon Interaction** ✓
   - [x] Add hover state to pencil icon (cursor pointer)
   - [x] Make pencil icon clickable to focus/start editing the title input
   - [x] Match interaction pattern of trash icon

4. **Tab Title Fadeout on Hover** ✓
   - [x] Fix gradient becoming visible on tab hover
   - [x] Need different fade gradient for hover state to match hover background color

**All v0.3.1 features completed and tested successfully!**

### Completed (v0.3.2)

#### Drag-and-Drop Improvements ✓
1. **Full-Page Drop Target** ✓
   - [x] Accept dropped files anywhere on the page (not just upload section)
   - [x] Entire window becomes drop zone when dragging files

2. **Drag Overlay Effect** ✓
   - [x] Show full-page visual overlay when dragging files over the window
   - [x] Semi-transparent backdrop with blur effect
   - [x] Dashed blue border around edges
   - [x] Large upload icon and "Drop favicon files here" message in center
   - [x] Overlay adapts to dark/light mode
   - [x] Proper drag state management to prevent flickering

**All v0.3.2 features completed and tested successfully!**

### Completed (v0.3.3)

#### Favicon Preview in Browser Tab ✓
1. **Eye Icon for Manual Preview** ✓
   - [x] Add eye icon button next to pencil and trash icons for each uploaded favicon
   - [x] Clicking eye icon previews that favicon in the actual browser tab
   - [x] Uses inline SVG in Feather/Lucide Icons style
   - [x] Includes hover states and tooltip

2. **Automatic Preview on Upload** ✓
   - [x] Automatically set uploaded favicon as browser tab icon
   - [x] When uploading multiple favicons, use the last one
   - [x] Works for both drag-drop and file picker uploads
   - [x] Provides immediate visual feedback in real browser context

**All v0.3.3 features completed and tested successfully!**

### Completed (v0.4.0)

#### UI/UX Improvements ✓
1. **Instant Tooltips** ✓
   - [x] Create custom CSS-based Tooltip component
   - [x] Add instant-appearing tooltips to edit, preview, and remove icons
   - [x] Replace slow browser title tooltips with smooth 150ms fade-in
   - [x] Tooltips appear above icons with dark background and arrow pointer

2. **Mobile Responsiveness** ✓
   - [x] Hide dark/light mode toggle on mobile devices
   - [x] Toggle only visible on medium screens and larger (768px+)

3. **Default Tab Count Adjustment** ✓
   - [x] Reduce default starting tabs from 8 to 5
   - [x] More focused initial view: Google, GitHub, YouTube, Reddit, Stack Overflow

**All v0.4.0 features completed and tested successfully!**

### Future Features (v1.0)
- Shareable links with encoded favicon data or upload to some service - discuss
- Improve visual fidelity based on user feedback
    - Safari tabs fill available space I think?
    - Check Safari too-long title truncation style
- Export as image/screenshot
- More tab contexts if needed
- There is still a tiny bit of jank with the tab title overflow fade out gradient on hover/activate of tab, the gradient is briefly slightly visible - is there another way to implement this where the title actually fades out instead of using a gradient mask of the same color as what's behind it?
