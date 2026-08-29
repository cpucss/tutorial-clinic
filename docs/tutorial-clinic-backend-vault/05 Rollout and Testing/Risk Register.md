---
title: Risk Register
status: active
tags: [risk, migration, security]
---

# Risk register

| Risk | Likelihood | Impact | Mitigation | Release gate |
|---|---|---|---|---|
| Permissive RLS exposes student records | High today | Critical | Replace policies and test anonymous/two-student access | No production data before pass |
| Legacy ID cannot map to Auth UUID | Medium | High | Preflight/backfill; stop migration on unresolved rows | Zero unexplained rows |
| Old frontend breaks after grants are revoked | High | High | Coordinated migration and frontend release | Compatible build ready |
| Session local ID differs from database UUID | High today | High | Await insert and use returned UUID | Create→RSVP integration passes |
| RSVP overbooks under concurrency | Medium | High | Lock session row in RPC | Final-slot race test passes |
| Offline replay toggles state incorrectly | High today | High | Deterministic set command and idempotent operation | Replay tests pass |
| Forged/replayed QR records attendance | High today | High | Opaque server token, hash, expiry, single use | Forgery/replay tests pass |
| Approval awards duplicate points | Medium | High | State-based ledger reconciliation in same transaction | Repeated moderation tests pass |
| Predictable default passwords compromise accounts | High | Critical | Invite/reset or random temporary password; forced change | No known defaults in production |
| Secret key enters Vite bundle | Low | Critical | Server-only environment and bundle scan | Bundle contains no secret |
| Storage exposes pending notes | Medium | High | Private bucket and owner/admin/approved-audience policies | Cross-user tests pass |
| Auth trigger blocks account creation | Medium | Medium | Test trigger and validate metadata/defaults | Account provisioning test passes |
| Large one-shot migration is hard to rollback | Medium | High | Additive phases and maintenance window | Staging rehearsal completed |
| Browser cache overwrites newer server state | Medium | Medium | Server wins, versions/updated timestamps | Two-device test passes |
| Inactive user keeps a valid token briefly | Medium | High | Sensitive functions check active profile; revoke sessions for urgent lockout | Inactive test passes |

## Operational watch list

Monitor after release:

- Auth sign-in/profile lookup errors
- PostgREST `42501` permission errors
- RPC exceptions by operation and reason
- unique violations on RSVP/attendance
- outbox conflict and retry counts
- Storage upload/authorization failures
- point-ledger reconciliation anomalies
- slow session/attendance/admin queries
