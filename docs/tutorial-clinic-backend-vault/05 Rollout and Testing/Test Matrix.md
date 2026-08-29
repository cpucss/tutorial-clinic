---
title: Test Matrix
status: required
tags: [testing, rls, qa]
---

# Test matrix

## Test identities

- anonymous request
- active Student A
- active Student B in another year level
- inactive student
- contributor
- admin

Use synthetic accounts in staging. Do not use the known default passwords from the supplied SQL.

## RLS matrix

| Resource/action | Anonymous | Student A | Student B | Inactive | Admin |
|---|---:|---:|---:|---:|---:|
| Read own full profile | Deny | Allow A | Allow B | Own read optional | Allow all |
| Read another full profile | Deny | Deny | Deny | Deny | Allow |
| Read published sessions | Decision | Allow | Allow | Read-only decision | Allow |
| Create/update session | Deny | Deny | Deny | Deny | Allow |
| Read RSVP | Deny | Own only | Own only | Deny | All |
| Join RSVP | Deny | Allow if eligible | Allow if eligible | Deny | Not required |
| Read attendance | Deny | Own only | Own only | Deny | All |
| Student code check-in | Deny | Allow in window | Allow in window | Deny | Not required |
| Issue QR | Deny | Allow | Allow | Deny | Not required |
| Consume QR | Deny | Deny | Deny | Deny | Allow |
| Read approved eligible note | Deny | By audience | By audience | Deny | Allow |
| Read another pending note | Deny | Deny | Deny | Deny | Allow |
| Moderate note/attendance | Deny | Deny | Deny | Deny | Allow |
| Read points | Deny | Own only | Own only | Deny | All |
| Get sanitized leaderboard | Decision | Allow | Allow | Decision | Allow |

## Concurrency and idempotency

- Run two simultaneous joins for the final capacity slot; assert the count never exceeds capacity.
- Replay `set_rsvp(joined = true)`; assert one row.
- Replay `set_rsvp(joined = false)`; assert no row.
- Replay a used QR token; assert rejection and one attendance row.
- Submit duplicate code check-in; assert unique conflict is mapped to a friendly error.
- Call attendance approval twice; assert the ledger net is 40, not 80.
- Approve, reject, and reapprove; assert the ledger net follows the current approved state.
- Retry an offline mutation after an uncertain response; assert desired state rather than a toggle.

## Auth

- Correct credentials, wrong password, malformed ID.
- Missing profile after valid Auth sign-in.
- Inactive profile.
- Admin-looking ID with a student profile remains a student.
- Refresh restores the session and profile.
- Password update and sign-out.
- Two tabs reflect sign-out.
- No protected route flashes while auth state initializes.

## Storage

- Allowed MIME/size upload.
- Video, HTML, executable, and >25 MB rejection.
- Object path cannot use another user's UUID.
- Pending file is owner/admin only.
- Approved file follows year-level audience.
- Delete/replacement restrictions.
- Metadata failure cleanup.
- Signed URL expiry if signed URLs are used.

## Existing frontend suite

Run:

```powershell
npm run typecheck
npm test
npm run test:mobile
npm run build
```

Add integration tests that call the real staging/local Supabase instance. Mock-only tests cannot prove RLS.

## Database tests

Create one pgTAP file per RLS-protected table and assert both allow and deny cases. Supabase's current recommended flow uses `supabase test db`; see [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Testing your database](https://supabase.com/docs/guides/database/testing).
