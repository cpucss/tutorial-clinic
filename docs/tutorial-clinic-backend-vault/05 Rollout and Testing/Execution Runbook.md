---
title: Execution Runbook
status: implementation-ready
tags: [runbook, deployment, migration]
---

# Execution runbook

## Before the change window

- [ ] Resolve [[06 Decisions/Open Decisions]].
- [ ] Create a staging Supabase project or isolated database clone.
- [ ] Back up the production database and confirm restoration steps.
- [ ] Record the Supabase project reference and Auth redirect URLs.
- [ ] Confirm whether the Data API exposes `public` and whether default grants are enabled.
- [ ] Install/pin the Supabase CLI only if using the CLI path; run each command's `--help`.
- [ ] Save [[Assets/SQL/00-preflight-audit.sql]] results.
- [ ] Resolve every orphan, duplicate, or invalid enum value.
- [ ] Prepare the frontend branch that uses the new RPC contracts.

## Migration path A — recommended CLI workflow

Use the exact CLI help output installed in the project. The normal workflow is:

1. Initialize/link the local Supabase directory if it is not linked.
2. Create a descriptively named migration through the CLI—do not invent a timestamp filename.
3. Copy the reviewed SQL from this vault into the generated files.
4. Apply to local/staging.
5. Run database/RLS tests.
6. Review database advisors.
7. Verify the migration list.
8. Apply the same committed migrations to production.

The local machine did not have a Supabase CLI available when this vault was generated, so command flags must be confirmed from `--help` before execution.

## Migration path B — Dashboard SQL Editor

If using the Dashboard:

1. Open the staging project.
2. Run `00-preflight-audit.sql`; export results.
3. Run `01-schema-alignment.sql`.
4. Rerun preflight and inspect unresolved legacy rows.
5. Run `02-security-and-rpc.sql`.
6. Run `03-verification.sql`.
7. Execute manual role-based smoke tests.
8. Save every executed script in source control before production.

The SQL Editor changes schema state but does not create a source-controlled migration history by itself. Source control remains mandatory.

## Coordinated release order

1. Announce a short maintenance window if the app is already used.
2. Stop writes or place the app in maintenance mode.
3. Apply schema alignment.
4. Verify tables/backfills.
5. Apply policies/functions.
6. Deploy the compatible frontend.
7. Configure/verify the private Storage bucket if notes are included.
8. Run smoke tests with student A, student B, and admin.
9. Re-enable normal access.
10. Watch Auth, PostgREST, Function, and database logs.

## Required smoke test

- [ ] Anonymous can read published events only if the decision allows it.
- [ ] Anonymous cannot read profiles, RSVPs, attendance, notes, points, or notifications.
- [ ] Student A cannot read or change Student B's private data.
- [ ] Inactive student is rejected by sensitive functions.
- [ ] Student cannot create/update/delete sessions.
- [ ] Admin can manage sessions and set a code.
- [ ] Two simultaneous final-slot RSVPs yield exactly one success.
- [ ] Student code check-in does not expose the stored code/hash.
- [ ] Forged/expired/replayed QR tokens fail.
- [ ] Accepted QR inserts one attendance record and one point award.
- [ ] Repeated moderation does not double-award.
- [ ] Note uploader can access their own pending file; other student cannot.
- [ ] Approved eligible note is downloadable; ineligible year is denied.
- [ ] Service-role/secret key is absent from the browser bundle and environment.

## Rollback

Prefer application rollback/feature flags over immediately reversing additive schema changes.

If a release fails:

1. Disable new writes or re-enable maintenance mode.
2. Roll the frontend back to the matching data contract.
3. Restore previous policies only from a reviewed rollback migration—never recreate `USING (true)` as an emergency shortcut.
4. Keep newly added tables/columns if they are additive and harmless.
5. Restore the database backup only when data integrity is compromised and after recording the recovery point.
6. Reconcile writes made during the window before reopening.

## After release

- [ ] Run [[Assets/SQL/03-verification.sql]] again.
- [ ] Run database advisors and fix security findings.
- [ ] Review errors and slow queries.
- [ ] Confirm point totals and duplicate constraints.
- [ ] Confirm no unresolved outbox conflicts.
- [ ] Record the deployed migration IDs and frontend commit.
- [ ] Schedule the legacy-column cleanup only after a stable observation period.
