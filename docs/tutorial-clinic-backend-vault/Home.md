---
title: Tutorial Clinic Backend Handbook
status: implementation-ready
last_reviewed: 2026-08-30
tags:
  - tutorial-clinic
  - supabase
  - backend
  - pwa
---

# Tutorial Clinic Backend Handbook

> [!important] Recommended outcome
> Make Supabase Auth and Postgres the system of record. Keep IndexedDB only as an offline cache and mutation outbox. Enforce authorization with database policies and server-side functions, never only with React role checks.

## Start here

1. Open [[START HERE - Implementation Roadmap]].
2. Review [[01 Current System/Website Audit]] and [[01 Current System/Existing SQL Security Review]].
3. Resolve [[06 Decisions/Open Decisions]].
4. Run [[Assets/SQL/00-preflight-audit.sql]] against a staging clone.
5. Complete the phase playbooks in order and use [[05 Rollout and Testing/Execution Runbook]] for release.

## Phase board

| Phase | Focus | Playbook |
|---:|---|---|
| 0 | Audit, baseline, decisions | [[07 Phase Playbooks/Phase 0 - Baseline and Decisions]] |
| 1 | Supabase development setup | [[07 Phase Playbooks/Phase 1 - Supabase Development Setup]] |
| 2 | Schema and data alignment | [[07 Phase Playbooks/Phase 2 - Schema and Data Alignment]] |
| 3 | Auth, RLS, and provisioning | [[07 Phase Playbooks/Phase 3 - Authentication RLS and Provisioning]] |
| 4 | Sessions, RSVP, attendance | [[07 Phase Playbooks/Phase 4 - Sessions RSVP and Attendance]] |
| 5 | Notes, Storage, points, notifications | [[07 Phase Playbooks/Phase 5 - Notes Storage Points and Notifications]] |
| 6 | Minimal frontend wiring | [[07 Phase Playbooks/Phase 6 - Minimal Frontend Wiring]] |
| 7 | PWA and offline reliability | [[07 Phase Playbooks/Phase 7 - PWA and Offline Reliability]] |
| 8 | Release and operations | [[07 Phase Playbooks/Phase 8 - Release and Operations]] |

## Knowledge map

### Audit

- [[01 Current System/Current State Audit]]
- [[01 Current System/Website Audit]]
- [[01 Current System/Existing SQL Security Review]]

### Architecture

- [[02 Architecture/Target Architecture]]
- [[02 Architecture/Data Model and Ownership]]
- [[02 Architecture/Auth and Authorization]]
- [[02 Architecture/Offline and Sync Strategy]]

### Implementation

- [[03 Implementation/Backend Implementation Guide]]
- [[03 Implementation/QR Attendance Design]]
- [[03 Implementation/Notes and Storage Design]]
- [[03 Implementation/PWA Implementation]]
- [[04 Frontend Integration/React Integration Plan]]
- [[04 Frontend Integration/Repository Contracts]]

### Release

- [[05 Rollout and Testing/Execution Runbook]]
- [[05 Rollout and Testing/Test Matrix]]
- [[05 Rollout and Testing/Risk Register]]

## Migration pack

| Order | File | Purpose |
|---:|---|---|
| 0 | [[Assets/SQL/00-preflight-audit.sql]] | Read-only inventory and orphan checks |
| 1 | [[Assets/SQL/01-schema-alignment.sql]] | Add production tables and align existing columns |
| 2 | [[Assets/SQL/02-security-and-rpc.sql]] | Replace permissive RLS and add atomic backend operations |
| 3 | [[Assets/SQL/03-verification.sql]] | Verify schema, grants, policies, and unresolved legacy rows |

> [!warning] Do not paste all scripts into production at once
> Execute each file in staging, review its output, run the application tests, and only then repeat the same versioned migration in production.

## Definition of done

- [ ] No browser code contains a secret or service-role key.
- [ ] Every exposed table has RLS, minimum grants, and allow/deny tests.
- [ ] A student can only read or mutate authorized records.
- [ ] Admin status comes from a trusted profile row, not an ID suffix.
- [ ] RSVP capacity is enforced atomically in Postgres.
- [ ] QR credentials are server-issued, opaque, expiring, and single-use.
- [ ] Attendance and note approvals award points exactly once.
- [ ] Note files are private and governed by Storage policies.
- [ ] Auth restoration works after refresh and across tabs.
- [ ] Offline retries are idempotent and never toggle an already-applied mutation.
- [ ] Install, update, offline shell, and recovery paths pass PWA checks.

## Primary references

- [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: User management](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase: Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase: Database functions](https://supabase.com/docs/guides/database/functions)
- [Supabase: Testing your database](https://supabase.com/docs/guides/database/testing)

