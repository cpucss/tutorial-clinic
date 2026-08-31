# CCS Tutorial Clinic - Frontend Reliability and Observation Guide

## Release status

This remediation is implemented locally but is not yet certified for production. The release remains in observation until the database migration is applied to the intended Supabase project, a fresh Preview is deployed, and the live multi-account checks in this guide pass.

Do not promote a Preview merely because the build is green. Promote only the exact Preview artifact that passed the database, student, administrator, file, and offline checks.

## User-facing behavior

### First-login password reminder

1. A student signs in with the temporary password.
2. The account security dialog asks the student to create a permanent password.
3. Choosing **I'll do it later** records the dismissal on the student's protected profile.
4. The dialog stays closed after refresh and on another device.
5. An action-required reminder appears in Notifications and links to Settings.
6. After the password is changed successfully, the protected profile is completed and the reminder disappears.

The browser never marks this workflow complete before the account service confirms both the password change and profile update.

### Note draft and file workflow

1. A new draft is inserted once and receives its database ID.
2. Editing the draft updates that same ID; it does not insert another row.
3. A selected file is uploaded to the private `tutorial-notes` bucket and its metadata is attached to the same note.
4. Submission occurs only after a file is confirmed.
5. If the file or submission step fails, the UI retains the authoritative draft ID so retrying cannot create a duplicate.
6. Preview and download use the protected remote file when it is not available in the device cache.

### Student and administrator refresh behavior

- Account-specific data refreshes after sign-in, every 60 seconds while visible, on focus, on reconnect, and when the tab becomes visible.
- Shared sessions, subjects, approved notes, and announcements refresh on the same user-driven triggers.
- Administrators load the complete RSVP and attendance sets allowed by their role; students load only their own records.
- Students do not receive other students' RSVP identities or totals. Capacity is enforced atomically when the RSVP is submitted.
- Saved schedule choices and user preferences are stored with the authenticated account.
- Offline RSVP, attendance, and schedule changes remain partitioned by user and are retried by the outbox.

## User interface language standard

User-facing screens use task language such as **Signing in**, **Saving**, **temporarily unavailable**, and **try again**. Product screens must not expose provider names, database terms, RPC names, storage buckets, row-level security, queue internals, or synchronization implementation details. Technical detail belongs in logs and engineering documentation only.

## Required database change

Apply `supabase/migrations/20260831000000_account_reliability.sql` before deploying the matching frontend. It adds:

- `profiles.password_prompt_dismissed_at`;
- an index for retrieving the latest note file efficiently;
- `defer_password_change()`;
- `complete_password_change()`;
- authenticated-only execution grants for those two functions.

Then run `supabase/migrations/20260830000003_verification.sql`. Every section labelled **MUST BE EMPTY** must return zero rows.

## Preview deployment order

1. Confirm the repository change set and migration are reviewed.
2. Back up the production database or confirm point-in-time recovery.
3. Apply the reliability migration to staging first.
4. Run the read-only verification script.
5. Deploy a fresh Vercel Preview with the Preview environment variables.
6. Confirm the Preview is `READY` and uses the intended Supabase project.
7. Complete the QA matrix below with separate student and administrator accounts.
8. Observe the Preview for at least one normal clinic workflow window.
9. Promote the exact verified Preview only after the owner approves the evidence.
10. Repeat smoke checks on the production alias and keep the previous deployment ready for rollback.

## Mandatory QA matrix

| Area | Positive check | Negative or recovery check |
| --- | --- | --- |
| Sign in | Valid student and administrator reach the correct dashboard | Invalid credentials show plain language and no provider details |
| Password deferral | **I'll do it later** closes the dialog and creates a notification reminder | Refresh and second-device sign-in do not reopen the dialog |
| Password completion | Settings changes the password and removes the reminder | Expired session does not show false success |
| Draft editing | Repeated saves update one note ID | Double-click and retry do not create extra drafts |
| File upload | DOCX, PDF, or allowed file uploads and previews | Oversized, disallowed, offline, and interrupted uploads show truthful errors |
| Note submission | File metadata and note status refer to the same note | Submission cannot proceed without a confirmed file |
| Moderation | Administrator approval/rejection reaches the student after refresh | Repeated moderation does not award points twice |
| RSVP | Student joins and cancels; administrator sees the correct total | Full session and concurrent final-seat attempts are rejected correctly |
| Attendance QR | Student generates an opaque token and administrator scans it | Expired and replayed tokens are rejected |
| Saved schedule | Choice remains after refresh and on a second device | Offline choice is retried once connectivity returns |
| Preferences | Settings remain after refresh and on another device | Failed save does not show success |
| Privacy | Student A cannot read Student B's private records or files | Browser logs and UI expose no tokens or technical backend messages |
| PWA | Manifest, icons, route refresh, and service worker load | Offline state does not invent successful server actions |

## Automated gates

Run and retain the output of:

```powershell
npm run typecheck
npm test
npm run test:mobile
npm run build
git diff --check
```

The current automated suite covers reducer/workflow behavior, password reminder behavior, QR security, draft identity reuse, file-before-submit ordering, upload retry safety, and responsive layouts. It does not replace live RLS, Storage, email/account, concurrency, or cross-user validation.

## Observation and rollback

During observation, review Vercel errors and Supabase Auth, Database, RPC, and Storage logs without exposing private values. Watch especially for password RPC errors, note-file metadata failures, repeated outbox attempts, QR replay errors, and duplicate point transactions.

Stop promotion or roll back immediately if any of these occur:

- another user's private record is visible;
- a password change reports success but the reminder remains after refresh;
- editing or retrying creates another draft;
- a file is public or downloadable without authorization;
- a QR can be reused;
- points are awarded more than once for one attendance or note decision;
- the new production deployment has higher sign-in or mutation failure rates.

## Known release blockers requiring live evidence

- The new migration has not been proven against the live project in this local pass.
- A Vercel Preview of this exact working tree has not been inspected.
- Real student-versus-student RLS and private file access have not been exercised here.
- The administrator student-account creation flow still requires a separately reviewed server-side onboarding endpoint; it must not be treated as production-complete based on local state alone.
- Administrator subject editing must be verified against live RLS before it is included in the release certificate.

Until these items are closed with evidence, the correct verdict is **OBSERVATION - NOT YET FINAL**.
