# Tutorial Clinic — Front-End System Design

## 1. Scope

Tutorial Clinic is a mobile-first React application for Computer Science students and society officers. This repository intentionally covers the front end only: screens, navigation, client-side state, interactions, accessibility, responsive behavior, and mock data. It does not claim to provide secure authentication, a database, file storage, or server-side authorization.

The system supports two demo roles:

- **Student:** discovers sessions, RSVPs, checks in, views attendance and points, browses shared notes, keeps personal notes, and manages preferences.
- **Admin:** reviews operational metrics, attendance, sessions, note submissions, students, and subjects.

## 2. Product map

```text
Public
├── Login
└── Register

Student workspace
├── Dashboard
├── Events + RSVP + QR pass
├── Attendance + check-in + history
├── Leaderboard
├── Notes Library + detail + upload
├── My Notes editor
├── Favourites
├── Profile
├── Points Guide
├── Notifications
└── Settings

Admin workspace
├── Dashboard
├── Attendance
├── Sessions
├── Notes Approval
├── Students
└── Subjects
```

## 3. Technical architecture

```text
HashRouter
   │
   ▼
App orchestration layer
   ├── mock session and role guard
   ├── route-to-tab mapping
   ├── RSVP / attendance state
   ├── toast / confirmation / QR overlays
   └── local browser persistence
          │
          ▼
Shared application shell
   ├── Sidebar / mobile bottom navigation
   ├── TopBar / breadcrumbs / account menu
   └── Main content boundary
          │
          ▼
Feature pages
   ├── auth      ├── attendance   ├── notes
   ├── dashboard ├── leaderboard  ├── points
   └── admin     └── notifications
          │
          ▼
Mock typed domain data + reusable feedback/UI primitives
```

React state remains close to the feature that owns it. Cross-feature demo state—session, RSVP, attendance, route, QR modal, confirmation dialogs, and toasts—lives in `App.tsx`. Editor state stays inside the notes features. The two editor-heavy note workspaces are lazy-loaded to keep the initial application bundle smaller.

## 4. Navigation and route model

Routes are defined centrally in `src/app/routes.ts`. `HashRouter` was selected because this is a front-end-only static build and must work on hosts without SPA rewrite configuration.

| Area | Route |
| --- | --- |
| Login / register | `#/login`, `#/register` |
| Student home | `#/dashboard` |
| Events / attendance | `#/events`, `#/attendance` |
| Notes | `#/notes`, `#/my-notes`, `#/favourites` |
| Progress | `#/leaderboard`, `#/points-guide`, `#/profile` |
| Account | `#/notifications`, `#/settings` |
| Admin | `#/admin`, `#/admin/*` |

The role guard is a usability boundary only. Real authorization must be enforced by a future server for every protected request.

## 5. State and persistence

| State | Owner | Persistence |
| --- | --- | --- |
| Demo session and selected role | `App` | `localStorage` |
| RSVP event IDs | `App` | per-user `localStorage` |
| Confirmed attendance IDs | `App` | per-user `localStorage` |
| Accessibility/preferences | `SettingsPage` | `localStorage` |
| Selected route and auth mode | Router | URL hash |
| Notes editor content | Notes feature | feature-local/browser storage |
| Toasts, modal, pending confirmation | `App` | transient only |

Storage parsing is guarded so malformed browser data falls back to safe demo defaults. No password is saved.

## 6. Visual system

The creative direction is “the warm study desk”: quiet white working surfaces, warm off-white canvas, ink typography, and one amber action color.

- **Canvas:** `#FAF8F2`
- **Surface:** `#FFFFFF`
- **Ink:** `#1C1C1C`
- **Secondary text:** `#6F6F6F`
- **Accent:** `#F5A623`
- **Selection:** `#FFF3DF`
- **Divider:** `#F0EFE9`

Cards use 12–14px radii, thin dividers, and very light shadows only when separation is necessary. Primary actions are amber pills. Metadata stays neutral. The interface avoids decorative gradients, multiple competing accents, and dense LMS-style chrome.

## 7. Responsive behavior

- Desktop uses a persistent 220px sidebar and flexible content region.
- Tablet and mobile convert the sidebar into a horizontally scrollable bottom navigation bar.
- Multi-column feature pages collapse into stacked sections below their page-specific breakpoints.
- Tables and dense lists preserve horizontal or independent scrolling rather than compressing text below legibility.
- Tap targets remain approximately 40–44px where space permits.

## 8. Accessibility

- Semantic landmarks and a keyboard-visible skip link are present in the application shell.
- Current navigation uses `aria-current`; settings switches use `role="switch"` and `aria-checked`.
- Dialogs, toasts, form labels, status badges, and icon buttons expose text alternatives.
- Focus-visible outlines use the amber accent with adequate separation.
- The app respects the operating-system reduced-motion preference and offers an explicit in-app reduced-motion setting.
- A higher-contrast preference strengthens secondary text and boundaries.
- Critical status is communicated with text, not color alone.

## 9. Front-end boundary for a future API

Mock imports should eventually be replaced by feature services with these stable responsibilities:

```text
authService          login, register, logout, current user
eventsService        list, detail, RSVP, cancel RSVP
attendanceService    submit code/token, history
notesService         list, detail, favourite, upload, download
pointsService        balance, transactions, leaderboard
notificationsService list, read state, preferences
adminService         sessions, approvals, students, subjects, reports
```

Remote data should be normalized into the existing types before it reaches components. Server errors should map to the current inline notice and toast patterns. Loading, empty, error, and success states must remain explicit in each feature.

## 10. Quality strategy

Minimum release checks for the front end:

1. Production build passes with no TypeScript or bundling errors.
2. Student and admin demo sessions land on the correct route.
3. A student cannot render admin content through normal navigation.
4. RSVP, cancellation, attendance, settings, and note actions show feedback.
5. Refresh preserves the current URL and locally persisted demo state.
6. Keyboard focus order works through login, navigation, dialogs, and forms.
7. Layout is checked at 360px, 768px, 1024px, and a wide desktop viewport.
8. Reduced-motion mode removes nonessential transforms and animation.

## 11. Production handoff

Before treating the product as secure or multi-user, add a backend, database, real session handling, server-enforced role checks, upload validation, signed file delivery, expiring QR attendance tokens, audit logging, and automated tests. Those concerns are deliberately outside this front-end-only implementation.
