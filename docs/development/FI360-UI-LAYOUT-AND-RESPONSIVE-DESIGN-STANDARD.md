# FI360 — UI Layout & Responsive Design Architecture Standard

**Document ID**: `FI360-UI-LAYOUT-AND-RESPONSIVE-DESIGN-STANDARD-v1.0`  
**Date**: August 14, 2026  
**Status**: **AUTHORITATIVE PLATFORM UI ARCHITECTURE STANDARD — MANDATORY FOR ALL MODULES**  

---

## 1. Executive Summary & UI Core Principles

This document defines the authoritative, system-wide UI layout, viewport management, and responsive design architecture for the FI360 Enterprise Platform.

### Core UI Principles:
1. **Single Authoritative Shell**: All FI360 modules (Executive, Fleet & Asset, Workshop, Tyre, Inventory, Driver & Safety, Fuel, Finance, Compliance, Admin) MUST render inside the single global `.app-container` -> `<main class="main-content">` -> `<div class="content-area">` layout hierarchy.
2. **Immediate Content Placement**: Every view MUST begin directly below the global top header (`.header`). Unexplained vertical space, negative margins, and floating offset hacks are strictly prohibited.
3. **DOM Nesting Integrity**: Every module container (`.view`) MUST be cleanly nested inside `.content-area`. No view container may prematurely close `.content-area`, `<main>`, or `.app-container`.
4. **Viewport Resilience**: The UI MUST dynamically adapt across all target resolutions (1920x1080 to 375x812 mobile) without content clipping or horizontal page overflow.

---

## 2. Global Layout Hierarchy & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ .header (Height: 64px, Sticky top: 0, Z-index: 90)                         │
├─────────────────┬───────────────────────────────────────────────────────────┤
│                 │ .main-content (flex: 1, min-width: 0)                     │
│ .sidebar        ├───────────────────────────────────────────────────────────┤
│ (Width: 260px,  │ .content-area (padding: 1.5rem 1.75rem, relative)         │
│  Sticky top: 0, │ ┌───────────────────────────────────────────────────────┐ │
│  height: 100vh) │ │ .view.active (Page Title, KPI Grid, Charts, Tables)   │ │
│                 │ └───────────────────────────────────────────────────────┘ │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### CSS Class Hierarchy:
- **`body`**: `background-color: var(--bg-body)`, `min-height: 100vh`, `min-height: 100dvh`, `overflow-x: hidden`.
- **`.app-container`**: `display: flex`, `min-height: 100vh`, `min-height: 100dvh`, `width: 100%`.
- **`.sidebar`**: `width: 260px`, `flex-shrink: 0`, `position: sticky`, `top: 0`, `height: 100vh`.
- **`.main-content`**: `flex: 1`, `display: flex`, `flex-direction: column`, `min-width: 0`.
- **`.header`**: `height: 64px`, `position: sticky`, `top: 0`, `z-index: 90`.
- **`.content-area`**: `flex: 1`, `padding: 1.5rem 1.75rem`, `position: relative`.
- **`.view`**: `display: block`, `width: 100%`. `hidden` view MUST use `display: none !important`.

---

## 3. Viewport & Breakpoint Policy

| Device Class | Viewport Range | Sidebar Behavior | KPI Grid Layout | Charts / Tables |
| :--- | :--- | :--- | :--- | :--- |
| **Large Desktop** | 1920×1080 | Fixed 260px | `auto-fit, minmax(180px, 1fr)` | Multi-column grid |
| **Standard Desktop**| 1440×900 / 1600×900 | Fixed 260px | `auto-fit, minmax(170px, 1fr)` | 2-column & 3-column rows |
| **Laptop** | 1280×800 / 1280×720 | Fixed 260px | `auto-fit, minmax(160px, 1fr)` | Flex wrap cleanly |
| **Tablet** | 769px–1024px | Collapsible 220px/64px | `auto-fit, minmax(140px, 1fr)` | Responsive flex wrap |
| **Mobile** | < 768px (390×844) | Off-canvas Drawer (`left: -260px`) | 2-column or 1-column grid | Stacked vertical charts |

---

## 4. Mobile Navigation Dismissal & Overlay Architecture

For viewports under 768px, mobile navigation MUST adhere strictly to the **Three-Way Dismissal Standard**:

1. **Visible Close Button (`.mobile-nav-close`)**:
   - Placed at the top-right of `.sidebar-header` / `.logo-header`.
   - Minimum touch target: `44 × 44 px`.
   - Element: `<button id="mobile-nav-close" class="mobile-nav-close" aria-label="Close navigation" title="Close navigation">✕</button>`.
2. **Tap-Outside Backdrop Overlay (`#mobile-nav-overlay`)**:
   - Element: `<div id="mobile-nav-overlay" class="mobile-nav-overlay" aria-hidden="true"></div>`.
   - Styling: `position: fixed; inset: 0; z-index: 80; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(3px);`.
   - Clicking/tapping backdrop invokes `closeMobileSidebar()`.
3. **Keyboard `Escape` Key Listener**:
   - Pressing `Escape` when `sidebar.classList.contains('mobile-open')` closes the drawer and hides the backdrop.
4. **Auto-Dismiss on Navigation Selection**:
   - Selecting any item in `.nav-links` automatically invokes `closeMobileSidebar()`, dismisses the drawer, and removes the overlay before rendering the target view.

---

## 5. Mobile Responsive & Horizontal Overflow Standard

To prevent unintended side-to-side horizontal movement/scrolling on mobile viewports (320px–430px), all FI360 views MUST adhere to the following architectural constraints:

1. **Root Layout Contract**:
   ```css
   *, *::before, *::after { box-sizing: border-box; }
   html, body { width: 100%; max-width: 100%; margin: 0; padding: 0; overflow-wrap: anywhere; word-break: break-word; }
   .app-container { width: 100%; max-width: 100%; min-width: 0; }
   .main-content { width: 100%; max-width: 100%; min-width: 0; }
   .content-area { width: 100%; max-width: 100%; min-width: 0; }
   ```
2. **Elimination of Fixed Widths**: Hardcoded fixed inline pixel widths (e.g. `style="width: 600px;"` or `minmax(320px, 1fr)`) are strictly forbidden. Use fluid percentages (`width: 100%`) or bounded CSS rules (`minmax(min(280px, 100%), 1fr)`).
3. **Flex & Grid Children Sizing**: All flex/grid children MUST define `min-width: 0;` to prevent child contents from forcing parent containers wider than the viewport width.
4. **Form Input Sizing**: All `input, select, textarea` elements MUST define `max-width: 100%; box-sizing: border-box;`.
5. **Controlled Table Overflow Policy**: Wide data tables MUST be wrapped in `.table-container` with `overflow-x: auto; max-width: 100%;`. Horizontal scrolling is isolated exclusively to `.table-container`; page-level document scrolling is prohibited.
6. **Modal Mobile Sizing**: Modals MUST define `max-width: calc(100vw - 1.5rem); width: calc(100vw - 1.5rem);` under 768px viewports.

---

## 6. Reusable Component Specifications

### 4.1 Page Header Standard
Every view MUST define a standard header section:
```html
<div>
  <h1 id="page-title">Module Title</h1>
  <p class="page-subtitle" id="page-subtitle">Subtext or Scope Description</p>
</div>
```

### 4.2 KPI Card Grid Standard
```html
<div class="kpi-grid">
  <div class="kpi-card kpi-primary clickable"> ... </div>
  <div class="kpi-card kpi-success clickable"> ... </div>
  <div class="kpi-card kpi-warning clickable"> ... </div>
</div>
```

### 4.3 Table Container & Universal Scrollbar
```css
.table-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 440px;
  border-radius: 6px;
  border: 1px solid var(--panel-border);
}
.table-container th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #1e293b;
}
```

### 4.4 Modal Dialog Policy
- `.modal` MUST use `position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.6);`.
- `.modal-content` MUST set `max-height: 90vh; max-width: 90vw; overflow-y: auto;`.

---

## 5. Compliance & Enforcement

1. **Zero Positional Hacks**: `margin-top: -500px`, `top: -300px`, or inline vertical offset hacks are strictly forbidden.
2. **Automated Release Gate Check**: HTML tag balance MUST be validated prior to every release:
   ```bash
   node scratch/validate-html-tree.js
   ```
3. **Build & Regression Verification**: Frontend Vite build and all backend regression gates must remain 100% green.
