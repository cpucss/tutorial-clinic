---
name: "Tutorial Clinic"
description: "A warm, focused product UI for study sessions, RSVP, attendance, notes, and student progress."
colors:
  app-bg: "#FAF8F2"
  surface: "#FFFFFF"
  surface-soft: "#F8F8F8"
  selected-note: "#FFF3DF"
  accent: "#F5A623"
  accent-text: "#FFFFFF"
  text-primary: "#1C1C1C"
  text-secondary: "#A0A0A0"
  text-muted: "#CACACA"
  label-muted: "#BBBBBB"
  nav-icon: "#2D2D2D"
  divider: "#F0EFE9"
  illustration-bg: "#F4EFE3"
  success-soft: "#C7D9C0"
  warm-soft: "#E8D9B8"
  danger: "#D4183D"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  sidebar-width: "220px"
  panel-width: "310px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-neutral:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    typography: "{typography.label}"
  note-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.title}"
  note-row-selected:
    backgroundColor: "{colors.selected-note}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.title}"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "8px 16px"
---

# Design System: Tutorial Clinic

## 1. Overview

**Creative North Star: "The Warm Study Desk"**

Tutorial Clinic is a product UI, not a marketing surface. It should feel like a quiet workspace where CS students can quickly move between events, notes, points, and profile tasks without relearning the interface. The visual system is warm minimal: white working surfaces, a restrained amber accent, compact typography, and enough whitespace to keep dense study information scannable.

The attached Visual Overview reference is incorporated as the My Notes and editor direction: a three-column master-detail pattern, persistent left navigation, a notes list column, and a detail editor column. Its key contribution is the amber selection language. This project adapts that into a lighter orange selected-note state for My Notes so the screen remains close to the surrounding white surfaces while still making the selected note visible.

This system explicitly rejects the PRODUCT.md anti-references: it must not feel like a full learning management system, a marketing landing page, or a visually noisy gamified app.

**Key Characteristics:**
- Three-column master-detail surfaces for event, notes, and personal-note workflows.
- White panels and cards on a warm off-white app background.
- One amber accent used for primary actions, selected states, tags, icons, and approvals.
- Familiar product controls: pill buttons, simple lists, stacked avatars, and compact metadata.

## 2. Colors

The palette is warm-neutral with one amber accent. It is deliberately restrained: the orange carries action and selection, not decoration.

### Primary
- **Clinic Amber**: The single interactive accent. Use it for primary buttons, tags, active chips, RSVP actions, approval badges, checked states, and key note-selection emphasis.
- **Light Orange Selection**: The selected My Notes row background. Use this when a selected state must remain visually close to white and preserve dark text readability.

### Secondary
- **Sage Contributor**: Supporting avatar color only. It can appear in generated initials or small identity markers, never as a second action accent.
- **Warm Tan**: Supporting illustration and avatar color only. It should not compete with Clinic Amber.

### Neutral
- **Canvas Warm Off-White**: Global app background and soft panel fills.
- **Clean Surface White**: Primary working surface for sidebars, list columns, editor panels, cards, and popovers.
- **Soft Control Gray**: Neutral pill controls, inactive tabs, toolbar buttons, and subtle empty state panels.
- **Ink Black**: Headings, note titles, active nav labels, and primary body copy.
- **Metadata Gray**: Timestamps, preview text, breadcrumbs, helper text, and secondary labels.
- **Divider Warm Gray**: Thin borders and file preview boundaries.

### Named Rules

**The One Accent Rule.** Clinic Amber is the only interactive accent. Do not introduce blue, purple, red, or green as competing action colors.

**The White Workspace Rule.** Main working surfaces are white. Warm off-white is reserved for the app background, empty states, dropdown selection rows, and inset content bands.

**The Selected Note Rule.** My Notes uses Light Orange Selection for the chosen row, not a black side bar. Solid amber selection is reserved for stronger card-selection patterns such as events or future card-style note lists.

## 3. Typography

**Display Font:** system sans-serif stack  
**Body Font:** system sans-serif stack  
**Label/Mono Font:** system sans-serif stack

**Character:** Functional, compact, and familiar. Typography should look like a reliable student tool: bold headings for orientation, tight metadata for scanning, and comfortable editor body text for reading.

### Hierarchy
- **Display** (700, 34px, 1.25): Editor titles and large detail-view page titles.
- **Headline** (700, 30-32px, 1.2-1.25): Column headers such as My Notes, Events, Subjects, and Share notes.
- **Title** (700, 14-16px, 1.4): Note titles, event titles, cards, profile rows, and repository cards.
- **Body** (400, 14px, 1.65): Editor body text, detail descriptions, and longer explanatory copy. Keep prose readable and avoid stretching long paragraphs beyond roughly 65-75ch.
- **Preview** (400, 12-13px, 1.55): Card/list excerpts, timestamps, metadata, and helper text.
- **Label** (500, 11-13px, 1.4): Buttons, tags, chips, section counters, and form labels.
- **Section Label** (400, 11px, 0.08em letter-spacing): Uppercase list dividers such as WORKSPACE, PERSONAL, TODAY, and PREVIOUS 7 DAYS.

### Named Rules

**The Single Sans Rule.** Do not add serif, script, or display novelty fonts. Product trust comes from consistency, not typographic surprise.

**The Metadata Stays Quiet Rule.** Secondary text stays small and muted; never use amber for routine timestamps or descriptions unless it is a tag or semantic score.

## 4. Elevation

Tutorial Clinic is flat by default. Depth comes from white surfaces on warm off-white backgrounds, compact grouping, and small tonal shifts. Shadows exist only to separate floating controls, popovers, cards, and search inputs from nearby content.

### Shadow Vocabulary
- **Search Shadow** (`0 1px 4px rgba(0,0,0,0.06)`): Search inputs and compact floating controls.
- **Card Shadow** (`0 1px 4px rgba(0,0,0,0.05)`): Repository cards, profile stats, and small elevated cards.
- **Popover Shadow** (`0 4px 16px rgba(0,0,0,0.08)`): Menus and dropdowns.
- **App Frame Shadow** (`0 8px 40px rgba(0,0,0,0.08)`): Optional outer frame treatment from the Visual Overview reference; not currently required for full-screen app shell pages.

### Named Rules

**The Flat-By-Default Rule.** Do not add decorative shadows to normal panels. A list, side column, or editor pane should be separated by layout and color, not by heavy elevation.

## 5. Components

### Buttons
- **Shape:** Pills for most actions (`999px` radius); compact toolbar icon buttons are circular.
- **Primary:** Clinic Amber fill with white text. Use for New, Share notes, Download, RSVP, QR, and submit actions.
- **Neutral:** Soft gray or white fill with dark text. Use for filters, toolbar controls, cancel actions, and inactive segmented controls.
- **Hover / Focus:** Keep state changes subtle. Use light tonal shifts, visible focus outlines, and 150-250ms transitions when transitions are introduced.

### Chips
- **Style:** Rounded pills with compact label text.
- **Selected:** Either Clinic Amber with white text for strong filters, or Ink Black with white text where the existing screen uses black segmented state.
- **Unselected:** Soft Control Gray or white with Ink Black text.
- **Tags:** Hashtag labels use Clinic Amber text and no heavy container.

### Cards / Containers
- **Corner Style:** Gently rounded cards (`12px` radius).
- **Background:** White for normal cards, Canvas Warm Off-White for inset empty states or preview blocks.
- **Shadow Strategy:** Flat at rest; use Card Shadow only when a card floats against a white page.
- **Border:** Use Divider Warm Gray only for file previews and form inputs. Do not use thick side borders or vertical stripe indicators.
- **Internal Padding:** Standard cards use `16px`; larger detail blocks use `20-24px`.

### Inputs / Fields
- **Search:** Full pill, white surface, search icon at left, Search Shadow, 36px height.
- **Form Fields:** Rounded rectangle (`6-8px` radius), white background, Divider Warm Gray border, 40px height.
- **Focus:** Prefer visible outline or border shift; do not rely on placeholder color changes.
- **Error / Disabled:** Danger text for errors, Text Muted for disabled controls, never amber for disabled state.

### Navigation
- **Global Sidebar:** Fixed `220px` white surface, grouped by WORKSPACE and PERSONAL. Active items use bold text; the black or amber side-stripe indicator is prohibited in this project.
- **Top Bar:** 48px white bar with muted breadcrumb text, Share action, stacked avatars, and an overflow icon.
- **Master Lists:** Secondary columns are typically `310px` wide and scroll independently from detail panes.

### My Notes
- **Layout:** Three-column master-detail: global sidebar, notes list, editor/detail pane.
- **List Surface:** White, matching surrounding project whites.
- **Selected Row:** Light Orange Selection fill with dark title and muted preview text. No black selected bar, no left stripe, and no full amber fill in the current My Notes row treatment.
- **Editor Toolbar:** Compact pill/dropdown controls and circular icon buttons.
- **Editor Body:** Transparent white workspace, large title input, 14px body text at 1.65 line-height, amber links.

### Imported Visual Overview Pattern
- **Use:** Future personal-note card layouts, richer desktop editor explorations, or a framed desktop composition.
- **Pattern:** Three-column master-detail with persistent left navigation, `290-310px` note list, and flexible editor/detail pane.
- **Strong Selected Card Variant:** Solid Clinic Amber fill with white text is allowed for card-style selected states when the card has enough padding and contrast. Do not use it for the current compact My Notes row unless the row is redesigned as a full card.
- **Inherited Rules:** One amber accent, 4px spacing grid, pill search, 12px note-card radius, thin stroke icons, overlapping avatars with white rings.

## 6. Do's and Don'ts

### Do:
- **Do** use Clinic Amber for primary actions, tags, checked states, and high-confidence selected states.
- **Do** keep the My Notes selected row light orange with dark text when the rest of the surface is white.
- **Do** keep main app surfaces white and reserve warm off-white for the app background and inset content.
- **Do** use 30-34px bold headings for major page or detail titles and 14px body text for reading surfaces.
- **Do** use rounded pills for filters and actions, and 12px radius for cards.
- **Do** preserve the PRODUCT.md direction: focused, supportive, student-friendly, and direct.

### Don't:
- **Don't** make the product feel like a full learning management system.
- **Don't** make it a marketing landing page.
- **Don't** make it a visually noisy gamified app.
- **Don't** use a black side bar or colored side-stripe as the selected indicator in My Notes or the global sidebar.
- **Don't** introduce a second accent color for actions.
- **Don't** use dark text on solid amber surfaces; if a surface is full amber, text must be white.
- **Don't** add heavy borders, thick outlines, glass effects, decorative gradients, or large soft shadow stacks.
