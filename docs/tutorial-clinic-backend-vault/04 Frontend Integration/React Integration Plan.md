---
title: React Integration Plan
status: recommended
tags: [react, frontend, migration]
---

# React integration plan

## Goal

Keep the current interface while replacing browser-owned product data with typed Supabase queries and mutations.

## Phase A — Auth bootstrap

1. Add an auth provider state: `initializing | anonymous | authenticated`.
2. On mount, call `supabase.auth.getSession()` for fast restoration and fetch the protected profile.
3. Subscribe to `onAuthStateChange` and refresh/clear the profile when the session changes.
4. Use the profile UUID as `DemoUser.id` during transition, then rename `DemoUser` to `User`.
5. Reject inactive/missing profiles with a clear sign-out screen.
6. Remove admin inference from the student ID suffix.

Route rendering must wait for `initializing` to finish to avoid redirect flicker.

## Phase B — Separate server and UI state

Remove server collections from the monolithic local reducer one domain at a time:

- profiles
- subjects
- sessions
- RSVPs
- attendance
- notes
- points
- notifications
- announcements

Keep temporary UI state in React: selected filters, open dialogs, draft form input, scanner state, and toasts.

Keep account preferences in Supabase but mirror them locally for instant rendering.

## Phase C — Make mutations truthful

Change context methods from synchronous `Result` to `Promise<Result>`. A durable workflow should:

1. validate;
2. enter pending state;
3. call the repository;
4. use the returned row;
5. update/invalidate cached data;
6. present success only after confirmation;
7. roll back and show a useful error on failure.

Disable duplicate submit buttons while pending.

## Phase D — Fix each repository

### Sessions

- Insert without a client ID.
- Map and return the inserted row.
- Store that returned UUID in UI state.
- Compute effective time-based status separately only if the persisted status is not Draft/Cancelled.
- Set attendance code through the dedicated admin RPC.

### RSVP

- Replace `toggleRsvp` with `setRsvp(sessionId, joined)`.
- Let the RPC decide capacity, eligibility, and closed status.
- Queue the desired state—not a toggle—while offline.

### Attendance

- Query by `user_id = auth UUID`.
- Student code check-in calls `check_in_with_code`.
- QR check-in calls `record_attendance_from_qr`.
- Moderation calls `moderate_attendance` and awaits it.
- Remove client-side point awards and notifications.

### Profiles

- Students fetch only their own full profile.
- Admin roster queries are allowed by admin RLS.
- Leaderboard uses `get_leaderboard` instead of exposing all profiles/transactions.

### Notes

- Create metadata first, then upload file(s), then submit.
- Replace IndexedDB shared blobs with the private bucket.
- Keep a local draft only as recovery, not the published record.

## Phase E — Generated database types

After schema stabilizes, generate Supabase TypeScript definitions and instantiate:

```ts
createClient<Database>(url, publishableKey)
```

Keep domain mapping functions even with generated types. Database rows and UI objects have different naming and derived fields.

## Error mapping

Repositories should translate expected errors:

| Backend condition | User message |
|---|---|
| `42501` / forbidden | “You do not have permission to do that.” |
| Unique RSVP/attendance | “This record already exists.” |
| Capacity exception | “This session is already full.” |
| Closed session | “RSVP/check-in is closed for this session.” |
| Expired QR | “Ask the student to generate a new QR.” |
| Network error | “You appear to be offline. We’ll retry eligible changes.” |

Do not show raw SQL, policy names, or internal table details to end users.

## Existing verification to preserve

Continue running:

```powershell
npm run typecheck
npm test
npm run test:mobile
npm run build
```

Add repository integration tests using two student identities and one admin identity. Component tests that mock every Supabase response are insufficient for RLS.
