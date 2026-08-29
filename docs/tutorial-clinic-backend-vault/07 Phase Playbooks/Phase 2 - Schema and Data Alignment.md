---
title: Phase 2 - Schema and Data Alignment
status: blocked-by-phase-1
tags: [phase, schema, data-migration]
---

# Phase 2 — schema and data alignment

## Objective

Create the complete data model and make the Auth UUID the canonical relational identity without losing legacy rows.

## Tasks

- [ ] Generate a schema-alignment migration.
- [ ] Adapt and apply [[Assets/SQL/01-schema-alignment.sql]] in staging.
- [ ] Backfill `rsvps.user_id` and `attendance.user_id`.
- [ ] Stop on unresolved IDs; map them manually.
- [ ] Import/confirm the subject catalog and replace placeholder subject names.
- [ ] Move attendance-code hashes into `private.session_secrets`.
- [ ] Confirm the public attendance-code value is cleared.
- [ ] Create notes, files, points, notifications, announcements, favourites, saved sessions, and preferences tables.
- [ ] Review delete/cascade behavior with realistic records.
- [ ] Add/validate domain constraints after data cleanup.

## Data-migration rule

Never guess a user mapping. A text value must match either:

- `profiles.id::text`; or
- `profiles.student_id`.

Anything else is an explicit data issue.

## Verification

- [ ] Zero unresolved RSVP user IDs.
- [ ] Zero unresolved attendance user IDs.
- [ ] Zero duplicate `(session_id, user_id)` pairs.
- [ ] Zero orphan session references.
- [ ] All active profiles have a supported role and year level.
- [ ] No plaintext attendance code remains in the exposed session row.
- [ ] New table indexes exist on known query paths.

## Exit gate

The staging database contains the full target schema and all legacy core records have canonical UUID ownership.

Next: [[07 Phase Playbooks/Phase 3 - Authentication RLS and Provisioning]].
