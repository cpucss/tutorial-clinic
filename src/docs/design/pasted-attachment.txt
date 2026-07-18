

1. Visual Overview Layout Paradigm: Three-column master-detail with persistent left navigation Design Language: Warm minimal; off-white surfaces, amber accent, generous whitespace Signature Element: The selected note card flips to a solid amber fill that perfectly mirrors the accent color used for tags, icons, and checkboxes across the entire UI — creating a cohesive, unmistakable visual identity with a single hue.

2. Color Tokens
Token Name	Hex	Usage
--color-bg	#FAF8F2	Global page / app background (warm off-white)
--color-surface	#FFFFFF	Card surfaces, panel backgrounds
--color-accent	#F5A623	Primary accent: selected states, tags, icons, checkboxes, CTA
--color-accent-text	#FFFFFF	Text on amber/accent-filled backgrounds
--color-text-primary	#1C1C1C	Headings, note titles, active nav items
--color-text-secondary	#A0A0A0	Preview body text, timestamps, metadata
--color-text-muted	#CACACA	Disabled states, unchecked checkboxes, placeholder text
--color-text-tag	#F5A623	Hashtag labels (#ideas, #to-do's, #morning)
--color-label-workspace	#BBBBBB	"WORKSPACE" section label in sidebar
--color-nav-icon	#2D2D2D	Sidebar navigation icons (default/idle)
--color-nav-active	#1C1C1C	Active nav item text
--color-divider	#F0EFE9	Subtle horizontal rules between cards
--color-location	#F5A623	Location metadata text ("San Francisco, CA")
--color-shadow	rgba(0,0,0,0.06)	Card and container drop shadows
Rules
* One accent color only. #F5A623 is the single interactive color. It must never be mixed with a secondary accent.
* The background is never pure white. Always #FAF8F2 to maintain the warm, cream quality.
* Text on accent (orange) surfaces is always pure white — never dark text on amber.
* Tags, location metadata, and active accent icons all share the exact same amber hex — no tinting or shading variants.

3. Typography
Typeface Roles
Role	Family	Weight	Size	Line Height	Notes
App Name	System sans / "Inter" equivalent	500 Medium	14px	1.4	"Awsmd" in top nav
Section Title	Bold sans	700 Bold	28–32px	1.2	"Notes" in list header
Note Title (default)	Bold sans	700 Bold	15–16px	1.4	Card list item titles
Note Title (selected)	Bold sans	700 Bold	15–16px	1.4	White on amber
Body / Preview	Regular sans	400 Regular	13px	1.55	Card preview text, truncated
Metadata (time/location)	Regular sans	400 Regular	12px	1.4	"1 min", "San francisco, CA"
Tags	Medium sans	500 Medium	12–13px	1.4	#ideas #to-do's — amber color
H1 (Editor)	Bold sans	700 Bold	32–36px	1.25	"Write down your ideas 💡"
H3 (Editor)	Bold sans	700 Bold	18–20px	1.35	"Morning"
Editor Body	Regular sans	400 Regular	14px	1.65	Quote paragraph in editor
Nav Labels	Regular sans	400 Regular	14px	1.5	Sidebar items
Workspace Label	Uppercase tracked sans	400 Regular	10–11px	1.4	"WORKSPACE" — all caps, letter-spacing: 0.08em
Heading Markers	Regular sans	400 Regular	11px	—	"H1" / "H3" labels in left margin of editor
Button Text	Medium sans	500 Medium	13–14px	—	"Updates", "Share", "+ New Page"
Typography Rules
* No serif typefaces anywhere in the UI.
* Section heading "Notes" uses the largest weight (700) and largest size (28–32px) in the list column.
* Heading level markers (H1, H3) appear as small gray labels in the left gutter of the editor panel — they are informational, not stylistic.
* Tags in the editor and cards are always lowercase with a # prefix and --color-accent fill.
* Preview text in cards is capped at 2 lines with overflow: hidden; text-overflow: ellipsis.

4. Spacing & Grid
Base Unit
4px grid. All spacing values are multiples of 4.
Layout Columns
Column	Width (approx)	Notes
Left Sidebar	200–220px	Fixed, non-scrollable
Notes List	290–310px	Scrollable list of cards
Editor/Detail	Remaining (flex-grow: 1)	Right panel, scrollable
Internal Padding
Component	Padding
Sidebar item (nav row)	8px 12px
Card (note list item)	16px
Editor panel	32–40px horizontal, 24px top
Top navigation bar	12px 24px
Search bar	8px 16px
"+ New Page" button	8px 12px
Vertical Rhythm
* Gap between sidebar nav items: 4–6px
* Gap between note list cards: 8–10px
* Spacing between H1 and tags in editor: 12px
* Spacing between tags and body text: 16px
* Spacing between body and H3: 28–32px
* Spacing between checklist items: 8px

5. Shapes & Borders
Element	Border Radius
Outer app container	20–24px
Note list cards	12px
Search bar	999px (full pill)
User avatar circles	50% (fully circular)
Checkboxes	50% (circular, radio-style)
"+ New Page" icon circle	50%
Sidebar nav active state	No visible border/bg
Editor image block	12px
Rules
* No hard square corners anywhere in the UI.
* The outer chrome of the entire application has the largest border-radius (~20px), framing everything inside as a single card.
* Cards in the list use a consistent 12px radius.
* The search input is a fully rounded pill — it never looks like a standard rectangular input.

6. Shadows & Elevation
Level	Value	Applied To
App frame	0 8px 40px rgba(0,0,0,0.08)	Outer container shadow (on cream bg)
Card	0 1px 4px rgba(0,0,0,0.05) or none	Note list cards (very subtle or flat)
Search	0 1px 4px rgba(0,0,0,0.06)	Search bar slight depth
Rules
* Elevation is nearly absent. The design uses surface color differences (white card on off-white bg) rather than drop shadows to create hierarchy.
* No hard outlines on cards — only the white-on-cream contrast defines the card boundary.

7. Component Specifications
7.1 Left Sidebar
* Width: ~200–220px, fixed height 100%
* Background: Transparent, inherits --color-bg
* Top area: Logo mark (orange/yellow leaf shape) + "Awsmd" wordmark + small dropdown chevron
* Search bar: Full-width pill input (height: 36px, border-radius: 999px, background: #FFFFFF, magnifying glass icon left-aligned at 16px from edge)
* Utility items: Templates, Import, Trash — each with a corresponding stroke icon (16–18px), left-aligned with 12px icon-to-label gap
* Workspace label: "WORKSPACE" in all-caps muted gray (~11px, letter-spacing: 0.08em), placed as a section divider above workspace nav items
* Nav items: Full row clickable, 14px label, icon left, no background on inactive items
* Active nav item: Bold label (font-weight: 700), "•••" overflow icon appears to the right on hover/active
* Active indicator: A small vertical bar on the far left edge of the sidebar (2–3px wide, amber #F5A623, full item height)
* Bottom: "+ New Page" with a filled circle + icon (amber fill) + label text, pinned to bottom of sidebar
7.2 Note List Cards
* Background: #FFFFFF
* Border-radius: 12px
* Padding: 16px
* Content layout (top to bottom):
    1. Title row: Bold title text LEFT + orange circle bookmark icon RIGHT (aligned top)
    2. Preview text: 2-line truncated body excerpt
    3. Metadata row: Timestamp LEFT + location string or tag string RIGHT (amber color)
    4. Optional: User avatars (overlapping circles, 24px diameter, 3 shown max)
* Selected card variant:
    * Background: #F5A623 (solid amber)
    * All text: #FFFFFF
    * Tags and metadata also white
    * Bookmark icon: White
    * User avatars remain visible (circular images with white ring border)
* Emoji in titles: Displayed inline, treated as inline content, no special styling
7.3 Top Navigation Bar (right panel)
* Height: ~48px
* Background: White / panel surface
* Left: Nothing (editor gutter begins)
* Center-right aligned items (left to right): Pin icon → Download/export icon → "Updates" text → "Share" text → 3 user avatar stack → "•••" kebab menu
* Icons: Stroke-style, ~18px, --color-nav-icon
* Buttons ("Updates", "Share"): Text-only, no background, font-weight: 500, font-size: 14px
* Avatar stack: 3 overlapping circular user photos, each 28px diameter, offset by -8px, with a 2px white border ring
7.4 Editor / Detail Panel
* Header illustration: A flat-style illustrated image block (~260×200px), displayed in the upper-right area of the editor, rounded corners (12px), light background within illustration
* Heading level markers: Small gray text labels ("H1", "H3") pinned to the left gutter (~left: -32px relative to content), acting as in-margin structural annotations
* H1 Heading: 32–36px bold, inline emoji at end
* Tags row: A row of #hashtag labels in amber, separated by spaces, sitting directly below the H1
* Body paragraph: Regular weight, 14px, muted gray, styled as a blockquote (no visual border — purely typographic)
* H3 Heading: 18–20px bold, acts as a section divider within the note
* Checklist items: Two columns of items; each item has a circular radio-style checkbox (20px diameter, stroke only when unchecked; amber fill + white dot when checked); label text at 14px
* Bottom toolbar: Two icon buttons pinned to bottom-right — + (add block) and Aa (text formatting); both are subtle, ~32px hit area
7.5 Checkboxes
State	Appearance
Unchecked	Circle outline, stroke: #CACACA, transparent fill
Checked	Solid circle, fill: #F5A623, white center dot
8. Iconography
* Style: Thin stroke / outline icons (1.5–2px stroke weight)
* Size: 16–20px for nav and utility icons
* Color: #2D2D2D default, #F5A623 for accent icons (bookmark, checked state)
* No filled icons in navigation — all are outline/stroke only except the bookmark circle and checked state
* Logo: An abstract two-tone leaf/wing shape in amber + dark amber, approximately 28×28px

9. Illustrations
* Style: Flat 2D vector, minimal detail, warm palette (greens, ambers, whites, grays)
* Subject: A person seated at a standing desk, working on a laptop — seen from behind, casual posture
* Background: Light warm gray/beige within a rounded container
* Decorative elements: Abstract geometric shapes suggesting trees, buildings, or clouds in the background
* Placement: Top-right of the editor panel, not full-bleed — framed in its own container
* Rule: Illustrations are used once, as ambient decoration, not repeated throughout the UI

10. States & Interactions
Note Card States
State	Visual
Default	White bg, dark text, amber bookmark icon
Hover	Slight bg tint (e.g., #FAFAFA), cursor pointer
Selected	Solid amber bg, all text white
New/unread	Orange circle icon on top-right (bookmark dot)
Checkbox States
State	Visual
Unchecked	Stroke circle, gray
Checked	Filled amber circle, white dot center
Navigation States
State	Visual
Default	Regular weight, gray icon
Active	Bold weight, dark text, left amber bar indicator, ••• shown
Hover	Slight text darkening
11. Layout Constraints & Rules
1. Three-column layout is fixed and non-collapsible at desktop viewport. No responsive breakpoints defined in this view.
2. Sidebar is not scrollable — all nav items must fit within the fixed height; overflow is handled by grouping.
3. Note list column is scrollable (vertical overflow) — cards stack vertically with 8–10px gap.
4. Editor panel is scrollable (vertical overflow) — content within the note can grow freely downward.
5. The outer container has a max-width and is centered on a warm cream full-page background — it does not span the full viewport.
6. The top bar of the editor (pin, download, updates, share, avatars, •••) is sticky/fixed within the right panel — it does not scroll with content.
7. Heading markers (H1, H3) live outside the main content flow in a left gutter — content text must have left margin large enough to accommodate them (~40px left gutter).
8. Checklist layout is a 2-column grid (not a single column list) — items flow left column first, then right column.
9. The + and Aa buttons are pinned to the bottom-right of the editor panel — they are always visible regardless of scroll position.
10. User avatars in cards and top bar overlap each other by 8px with a 2px white border ring to separate them visually.

12. Tone & Voice (UI Copy)
* Section labels: Sentence case for nav items ("Templates", "Notes", "Tasks")
* The workspace section divider: ALL CAPS (WORKSPACE) — this is the only all-caps treatment in the nav
* Metadata is always lowercase relative to its type ("1 min", "5 min", "1 day", "2 days")
* Location is title case with a comma ("San Francisco, CA")
* Tags are always lowercase with # prefix — no capitalization
* Action buttons use imperative verbs: "Share", "New Page" (not "Create New Page")
* The "+" button at the bottom is paired with a label "+ New Page" to ensure discoverability

13. What This Design Is Not
* Not dark mode — no dark variant is implied
* Not a mobile layout — this is desktop-only as shown
* Not multi-accent — one amber accent, nothing else
* Not heavily bordered — no visible card strokes or input borders
* Not typographically adventurous — the UI is deliberately neutral/functional except at H1 scale
* Not animated in its base state — interactions are implied through states, not motion

End of design specification.
