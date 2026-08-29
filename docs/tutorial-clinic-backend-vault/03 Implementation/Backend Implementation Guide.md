---
title: Backend Implementation Guide
status: implementation-ready
tags: [implementation, backend, supabase]
---

# Backend implementation guide

## 1. Prepare a safe environment

- Create a staging Supabase project or restore a production backup into an isolated project.
- Capture the project reference, Region, Auth URL settings, sign-up setting, and Data API exposed schemas.
- Export the current public schema and save the [[Assets/SQL/00-preflight-audit.sql]] output.
- Do not test destructive policy changes first against production.

The Supabase CLI is not installed on this machine today. When installing it, pin the development dependency and commit the lockfile. Run `npx supabase --help` and the relevant subcommand `--help` before using commands because the CLI changes over time.

## 2. Record the decisions

Resolve the items in [[06 Decisions/Open Decisions]], especially account provisioning, point values, public event visibility, RSVP cutoff, note visibility, and whether a separate staff role is required. The migration defaults to the behavior already represented by the frontend.

## 3. Run preflight

Execute [[Assets/SQL/00-preflight-audit.sql]] in the staging SQL Editor. Pay special attention to:

- policies containing `true`;
- RSVP/attendance identifiers that match neither a profile UUID nor student ID;
- duplicate session/user pairs;
- orphaned session references;
- profile roles/year levels outside the supported values;
- plaintext attendance codes.

Fix data anomalies explicitly. Never delete unmatched records just to make a migration pass.

## 4. Apply schema alignment

Run [[Assets/SQL/01-schema-alignment.sql]]. It:

- creates the private helper schema and `pgcrypto` extension if needed;
- adds missing profile/session/attendance columns;
- creates subjects, notes, files, points, notifications, announcements, favourites, saved sessions, and preferences;
- adds canonical UUID user columns and backfills them from the legacy value;
- creates private tables for session code hashes and QR-token hashes;
- migrates existing plaintext attendance codes into private hashes and clears the public value;
- creates indexes and update timestamps.

It intentionally retains legacy text columns for the transition. Remove them only in a later cleanup migration after the frontend uses UUIDs and the verification period is complete.

## 5. Apply security and backend functions

Run [[Assets/SQL/02-security-and-rpc.sql]]. It:

- removes policies from the scoped application tables;
- enables RLS and resets grants;
- creates owner/admin/published-data policies;
- hardens private role helpers;
- adds atomic RPCs for RSVP, code check-in, QR issuance/consumption, attendance moderation, note moderation, point adjustment, attendance-code changes, and leaderboard retrieval;
- creates triggers that synchronize attendance/note point awards to the ledger;
- creates a safe Auth profile trigger that never copies a client-supplied role.

> [!warning] Security cutover and frontend cutover must be coordinated
> The old repositories will fail after direct RSVP/attendance writes are revoked. Deploy the new frontend in the same release window or use a short maintenance window.

## 6. Configure Storage

Follow [[03 Implementation/Notes and Storage Design]]. Create a private `tutorial-notes` bucket with a 25 MB limit and an explicit allow-list. Add Storage policies only after testing the note metadata policies.

## 7. Update the React data layer

Follow [[04 Frontend Integration/React Integration Plan]] and [[04 Frontend Integration/Repository Contracts]]. The highest-risk changes are:

- make the Auth UUID the only user ID;
- restore Supabase Auth on startup;
- remove ID-suffix role inference;
- make every backend mutation asynchronous and await it;
- replace client code/QR checks with RPC calls;
- replace `toggleRsvp` with `setRsvp(joined)`;
- use the returned session UUID after create;
- load server data as canonical and local data only as cache.

## 8. Verify

Run [[Assets/SQL/03-verification.sql]], [[05 Rollout and Testing/Test Matrix]], and the existing frontend commands:

```powershell
npm run typecheck
npm test
npm run test:mobile
npm run build
```

Add RLS database tests before production. Current Supabase guidance recommends testing allow and deny paths with `supabase test db`. See [Testing your database](https://supabase.com/docs/guides/database/testing).

## 9. Release in slices

Recommended slice order:

1. Auth/profile bootstrap.
2. Subjects and sessions.
3. RSVP.
4. Attendance code and admin moderation.
5. Opaque QR attendance.
6. Points/leaderboard.
7. Notes/Storage/favourites.
8. Notifications, announcements, saved schedule, and preferences.

Do not migrate every feature in one frontend commit. Each slice should have a feature flag or an easily reversible deployment boundary.

## 10. Cleanup after observation

After at least one stable release cycle:

- remove `student_id` from RSVP/attendance;
- remove the public `sessions.attendance_code` column;
- remove local reducer actions that create authoritative server records;
- clear old localStorage demo keys with a one-time versioned migration;
- remove the old client-generated QR parser/builder;
- add database advisors and query-plan review to the release checklist.

## When an Edge Function is appropriate

Use a protected Edge Function for account provisioning or future email/file processing. Do not expose the service role. By default, authenticated functions should require a valid user JWT and then independently authorize the role. See [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) and [`auth.admin.createUser`](https://supabase.com/docs/reference/javascript/auth-admin-createuser).
