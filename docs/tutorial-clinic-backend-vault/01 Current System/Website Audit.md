---
title: Website Audit
status: reviewed
audited_at: 2026-08-30
tags: [audit, website, frontend, backend, pwa]
---

# Tutorial Clinic website audit

## Executive assessment

The frontend is visually and structurally mature enough to preserve. The production blockers are backend authorization/data ownership, stale verification tooling, incomplete PWA assets/update UX, and repository hygiene. The recommended program is backend-first; no UI redesign is required.

## Verified command results

Audit environment:

- Windows
- Node `v26.5.1`
- npm `11.17.0`
- repository branch `main`
- build package version `0.0.1`

| Check | Result | Evidence |
|---|---|---|
| Dependency availability before install | Blocked | TypeScript, Vitest, and `vite-plugin-pwa` were missing from the checked-out `node_modules` |
| TypeScript | Pass after restoring declared development dependencies | `tsc --noEmit` exited 0 |
| Production build | Pass with warnings | Vite transformed 2,100 modules and generated the PWA service worker |
| Main JS bundle | Needs optimization | 720.81 kB minified / 211.10 kB gzip; Vite emitted the >500 kB warning |
| CSS bundle | Monitor | 147.06 kB minified / 25.46 kB gzip |
| PWA generation | Partial | 13 precache entries, 904.49 KiB; service worker and manifest generated |
| Unit/workflow suite without env | Fail | App import throws when Supabase env values are absent |
| Unit/workflow suite with temporary test env | Fail | 14/14 fail before assertions because `window.localStorage` is unavailable in the current Node/jsdom environment |
| Mobile route audit | Fail before route checks | App cannot render without Supabase env; script then cannot find the login control |

These results describe the current checkout, not a production deployment.

## What is already strong

### Product/UI

- Clear mobile-first student and admin information architecture.
- Broad feature coverage: sessions, RSVP, attendance, notes, points, announcements, profiles, settings, and admin management.
- Existing lazy loading for several heavier admin/note pages.
- Consistent feedback components, empty states, status badges, confirmation dialogs, and toasts.
- Useful responsive layout work and an existing multi-viewport audit script.

### Accessibility foundations

- Skip link and semantic main content.
- Dialog labels/roles and focus management in the application shell.
- Keyboard focus trapping logic for modal dialogs.
- Reduced-motion and high-contrast preferences.
- Labels and descriptive button names in many core flows.

An automated accessibility scan was not available in the passing suite, so these are code-level positives rather than a WCAG certification.

### Supabase client basics

- Browser client reads public URL/publishable-key variables.
- The code explicitly rejects a Dashboard URL.
- No service-role key was found in the client configuration reviewed.
- Auth session persistence and auto refresh are enabled.
- Repositories already create a useful seam for backend integration.

## Critical findings

### A1 — Permissive RLS exposes/changes all rows

Severity: Critical  
Phase: [[07 Phase Playbooks/Phase 3 - Authentication RLS and Provisioning]]

The supplied SQL enables RLS but then creates `FOR ALL USING (true)` policies. This is not data isolation. Full findings: [[01 Current System/Existing SQL Security Review]].

### A2 — Predictable and directly inserted Auth users

Severity: Critical  
Phase: 3

The supplied SQL inserts known passwords directly into `auth.users`. The login UI also explains a password derived from the student ID. Stop direct Auth inserts and use invitations/reset links or random one-time credentials through Dashboard/server-only Admin API.

### A3 — QR identity is forgeable

Severity: Critical  
Phase: [[07 Phase Playbooks/Phase 4 - Sessions RSVP and Attendance]]

The browser generates every QR field and the server stores/verifies no nonce or signature. Use [[03 Implementation/QR Attendance Design]].

### A4 — Local and backend identities conflict

Severity: High  
Phase: 2, 4, and 6

The frontend mixes IDs such as `stu-...` with Auth UUIDs. RSVP/attendance foreign keys are text and calls alternate between local/user UUID values. Standardize on `profiles.id = auth.users.id`.

### A5 — Successful UI can represent a failed write

Severity: High  
Phase: 4–6

Several writes update local state and fire Supabase calls without awaiting or reconciling the result. A rejected RLS write can still show success. Durable UI actions must become async and use returned rows.

## Backend and architecture findings

| Priority | Finding | Recommendation |
|---|---|---|
| P0 | Supabase is only a partial source of truth | Move all product domains to canonical tables in phases |
| P0 | RSVP capacity is client-only | Use a session-locking `set_rsvp` RPC |
| P0 | Session insert ignores generated UUID | Use returned row before any dependent mutation |
| P0 | Attendance code is exposed/read in the client | Store only a private hash and verify with RPC |
| P0 | Moderation/points are local reducer behavior | Make status, audit, notification, and ledger changes transactional |
| P1 | Notes use local IndexedDB blobs | Use a private Storage bucket plus metadata/RLS |
| P1 | Offline RSVP sync replays a toggle | Replay desired state; make operations idempotent |
| P1 | Auth state is bridged into local demo state | Add an Auth provider/bootstrap and canonical profile |
| P1 | Profile list can expose student identifiers | Own/admin full profiles; sanitized leaderboard function |
| P2 | One large context owns server and UI state | Remove server collections incrementally; preserve UI state only |

## PWA audit

### Existing

- `vite-plugin-pwa` is configured.
- Build generates `sw.js`, Workbox runtime, `registerSW.js`, and a manifest.
- App-shell precaching is enabled.
- Network/offline hooks and an IndexedDB outbox exist.

### Missing or inconsistent

- Manifest icon files and favicon do not exist; there is no `public` directory.
- The manifest and HTML theme colors differ.
- Prompted updates have no React UI.
- No install prompt or iOS Add to Home Screen guidance.
- Connectivity is represented by duplicate components/logic.
- There is no documented cache purge on sign-out.
- The Workbox cache strategy is not explicitly separated from private Supabase data.
- Root-relative manifest paths need adjustment if deployed under a GitHub Pages subpath.

Implementation: [[03 Implementation/PWA Implementation]].

## Testing audit

### Test environment

The suite imports the Supabase client at module load and throws without env values. Add non-secret local Supabase test configuration or inject a test client. A missing environment should fail clearly in CI setup, not make every component test appear broken.

### Unit suite drift

The existing tests still describe the earlier demo:

- expected Student ID format differs from the current login format;
- tests click Login without entering the now-required password;
- many tests refer to users/events/notes no longer present in the current empty seed;
- the tests verify client-generated QR payloads that should be removed;
- Node `v26.5.1` plus the current jsdom/Vitest setup exposes `window.localStorage` as unavailable.

Pin a tested Node LTS in `engines` plus Volta/`.nvmrc`, fix the jsdom environment, then rewrite tests around current contracts and real RLS integration.

### Mobile audit drift

The mobile audit is a strong idea but is not aligned with the current Auth application:

- it has no Supabase test environment;
- it fills only Student ID, not password;
- it uses the legacy `tutorial-clinic:demo:v1` key while the app uses v2;
- some expected button labels and flows belong to an older QR implementation.

Refactor it to seed staging/local Supabase identities and authenticate through the current login or a test-only session helper.

## Performance audit

- The main JS bundle triggers Vite's chunk-size warning.
- Admin/note lazy chunks are already a good start.
- Review large shared imports (MUI/icon packages, charts, motion, and UI barrel imports).
- Use bundle visualization before manual chunking; do not split blindly.
- Add route-level performance budgets and measure on a throttled mobile profile.
- PWA precache is about 904 KiB today; keep it deliberate as the app grows.

Performance is a P2 improvement after backend correctness and tests, not a reason to delay the security migration.

## Repository and delivery hygiene

Severity: High

`.gitignore` correctly lists `node_modules` and `dist`, but Git already tracks:

- 64,717 files under `node_modules`;
- 13 files under `dist`.

Consequences:

- checkout is large and platform-specific;
- installing dependencies creates massive tracked diffs;
- generated build output becomes stale;
- dependency state is less trustworthy than `package-lock.json`;
- reviews and security updates become noisy.

Use a separate cleanup change:

1. verify `package-lock.json` and clean install in CI;
2. remove tracked `node_modules` and `dist` from the index;
3. keep them ignored;
4. add a tested Node version and CI commands;
5. build artifacts only in deployment/CI.

Do not mix this cleanup with the RLS migration.

## Hosting/security headers

No deployed response headers were available to inspect. Before production, verify:

- HTTPS and HSTS;
- a Content Security Policy compatible with Supabase and camera/file flows;
- `X-Content-Type-Options: nosniff`;
- appropriate Referrer Policy and Permissions Policy;
- service-worker and immutable-asset cache headers;
- SPA/hash route behavior;
- no source maps or environment data exposing secrets unintentionally.

## SEO/product visibility

`index.html` uses `noindex, nofollow`. That is appropriate for a private campus portal. It conflicts with a truly public/discoverable events page. Keep it until the public visibility decision is approved; if public discovery is desired, separate public content/metadata from authenticated app pages.

## Prioritized remediation

| Order | Action | Phase |
|---:|---|---|
| 1 | Backup, decisions, preflight, data cleanup | 0 |
| 2 | Reproducible Supabase migration/test setup | 1 |
| 3 | UUID/schema alignment | 2 |
| 4 | RLS, grants, provisioning, Auth hardening | 3 |
| 5 | Atomic sessions/RSVP/attendance/QR/points | 4 |
| 6 | Notes/Storage/content backend | 5 |
| 7 | Minimal frontend data wiring and current tests | 6 |
| 8 | PWA install/update/offline completion | 7 |
| 9 | Release, monitoring, repository cleanup in separate changes | 8 |

Follow [[START HERE - Implementation Roadmap]].
