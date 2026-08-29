---
title: Executive Implementation Plan
status: recommended
tags: [plan, backend, supabase]
---

# Executive implementation plan

## Recommendation

Use Supabase as the backend rather than adding a separate Node server for Phase 1:

- Supabase Auth owns identity and sessions.
- Postgres tables own product data.
- Row Level Security owns authorization.
- Database functions own atomic workflows such as RSVP capacity, attendance check-in, moderation, and point awards.
- Supabase Storage owns note files.
- React repositories call tables for ordinary reads and RPC functions for sensitive writes.
- IndexedDB caches data and queues deterministic mutations while offline.

This fits the existing Vite/React application and avoids maintaining a second API service before the product needs one.

## What exists today

The application already has a browser Supabase client and uses Supabase Auth. Sessions and attendance are partially synchronized. Most features—including notes, points, notifications, subjects, preferences, saved sessions, and announcements—still use local browser state. Local and backend user identifiers are mixed, and several writes are optimistic fire-and-forget operations.

## Delivery phases

| Phase | Outcome | Deploy gate |
|---|---|---|
| 0. Audit | Backup, preflight output, decisions recorded | No orphaned or duplicate identifiers are unexplained |
| 1. Foundation | Schema alignment and new tables | Migration succeeds in staging and can be re-run safely where documented |
| 2. Security | Permissive policies removed; least-privilege policies and RPCs active | RLS allow/deny matrix passes |
| 3. Identity | React uses the Auth UUID everywhere | Refresh, sign-out, inactive users, and admin routing pass |
| 4. Core workflows | Sessions, RSVP, attendance, QR, and points use Supabase only | Two-device and concurrency tests pass |
| 5. Content | Subjects, notes, private Storage, favourites, and moderation are live | Upload, preview, approval, and access tests pass |
| 6. Secondary data | Notifications, announcements, schedule, preferences | Cross-device persistence passes |
| 7. Cleanup | Legacy local source-of-truth and plaintext fields removed | Production observation period completes without rollback |

## Immediate priorities

1. Remove the `FOR ALL USING (true)` policies before using real student data.
2. Stop treating an ID ending in `-ADMIN` as admin authority.
3. Replace `student_id text` foreign keys in RSVP/attendance with `user_id uuid` references to `profiles.id`.
4. Replace client-generated QR identity payloads with an opaque server-issued credential.
5. Move code verification, capacity checks, moderation, and point awards into database functions.
6. Make mutations await the backend result before presenting durable success.

## Senior frontend guidance

- Preserve the current pages and visual components; replace the data layer underneath them incrementally.
- Keep one canonical domain model. Do not maintain a local `DemoUser.id` and a separate `authUserId` after cutover.
- Use query/mutation states (`idle`, `loading`, `success`, `error`) instead of logging backend failures to the console.
- Make repositories return typed domain data and typed errors. UI components should not know database column names.
- Prefer deterministic commands (`set RSVP joined = true`) over toggles. This is essential for offline replay.
- Treat optimistic state as provisional and reconcile it with the returned database row.

## Constraints and assumptions

- The supplied schema is incomplete compared with the TypeScript domain model.
- No live Supabase credentials or project reference were provided, so this vault does not alter the live database.
- The local machine does not currently have the Supabase CLI installed. The runbook includes setup and a Dashboard SQL Editor fallback.
- The current default point values are 40 for approved attendance and 60 for an approved note; confirm them before production.

Next: [[01 Current System/Current State Audit]].
