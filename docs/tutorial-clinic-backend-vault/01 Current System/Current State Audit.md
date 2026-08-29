---
title: Current State Audit
status: reviewed
tags: [audit, frontend, supabase]
---

# Current state audit

Reviewed against the application beside this vault on 2026-08-30.

## Stack and boundaries

- Vite, React, TypeScript, React Router, Vitest, and a PWA plugin.
- `@supabase/supabase-js` is present and the lockfile resolves version `2.109.0`.
- The browser client correctly uses public `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values.
- Supabase Auth is used for password sign-in and password updates.
- `AppDataContext` remains the main application database. It persists the full state to `localStorage`.
- IndexedDB implements an outbox, but only RSVP and attendance mutations are routed to Supabase.

## Data ownership today

| Feature | Current source | Main issue |
|---|---|---|
| Authentication | Supabase Auth | App session is not restored into React state after a reload unless local state remains |
| Profiles | Supabase for admin hydration; local for active user state | Backend UUID and local user ID are separate |
| Sessions | Supabase read/write plus local state | Insert result is ignored, so the local ID can differ from the generated database UUID |
| RSVP | Local state plus IndexedDB outbox | Payload uses the local user ID and sync calls a non-idempotent toggle |
| Attendance | Partial Supabase plus local state | UUID/text identifier mismatch; normal moderation is not persisted |
| QR | Generated and trusted in the browser | Any caller can forge `user`, `student`, timestamps, and nonce |
| Subjects | Local state | No backend repository or table in the supplied SQL |
| Notes/files | Local state and IndexedDB blobs | No Storage bucket, database metadata, or cross-device access |
| Points | Local reducer | Not authoritative and can diverge across devices |
| Notifications | Local reducer | Not cross-device and not tied to backend transactions |
| Announcements | Local reducer | No backend persistence or read receipts |
| Preferences/schedule | Local state | Browser-specific rather than account-specific |

## Critical implementation findings

### 1. Two user IDs are used

The frontend creates IDs such as `stu-<timestamp>` while Supabase Auth uses UUIDs. Repositories sometimes send the local ID to a database column and sometimes send `authUserId`. All relational tables should reference `profiles.id`, which equals `auth.users.id`. After cutover, the domain `user.id` must be that UUID.

### 2. Admin authority is partly inferred from text

The login adapter treats an ID with `-ADMIN` as an administrator even when the profile does not. UI routing is not a security boundary, but this also causes misleading UI authorization. Resolve the role only from the protected profile row. RLS remains the final authority.

### 3. Session inserts lose the generated UUID

`saveEvent` builds a local ID, `saveSession` omits it from the insert, and the returned database record is ignored. An RSVP can then reference a local ID that is not a valid session UUID. The mutation must await the insert and replace the provisional record with the returned row.

### 4. Offline RSVP replay is not deterministic

An outbox entry says `upsert` or `delete`, but the sync engine always calls `toggleRsvp`. A retry after an uncertain response can undo a successful first request. Use `set_rsvp(session_id, joined)` and include a mutation ID for idempotency where necessary.

### 5. Backend errors do not reach the user

Several mutations update local state immediately and call Supabase with `.catch(console.error)`. The UI reports success even if RLS rejects the write. Return a Promise from every durable mutation, show a pending state, and reconcile or roll back on failure.

### 6. QR authenticity is not verified

The current nonce is random but it is neither signed nor stored server-side. The scanner validates only payload shape, time, and matching identifiers already visible to the app. Use [[03 Implementation/QR Attendance Design]].

### 7. Schema and repository contracts disagree

The attendance repository reads `method`, `arrival`, `reviewed_at`, `reviewed_by`, and `correction_note`, but the supplied table definition does not create them. The profile repository reads `year_level`, which is also absent from the supplied definition.

### 8. Dependencies are not fully pinned in the manifest

Several dependencies use caret ranges. The committed lockfile reduces risk, but production packages should use deliberate exact versions and a committed lockfile. Update versions in a separate, tested dependency change—not during the backend cutover.

## Reuse rather than rewrite

Keep these useful boundaries:

- `src/services/supabase/client.ts`
- the repository folder under `src/services/supabase`
- domain mapping between snake_case database records and camelCase UI objects
- IndexedDB outbox primitives after their identifier and idempotency fixes
- page/component structure and the existing mobile verification suite

Replace or refactor:

- authentication bootstrap and local login state
- local reducer ownership of server data
- fire-and-forget mutations
- client-side authorization assumptions
- client-generated attendance credentials
- local-only file storage for shared notes

Next: [[01 Current System/Existing SQL Security Review]].
