---
title: Open Decisions
status: needs-owner-approval
tags: [decisions, product, architecture]
---

# Open decisions

Resolve these before the production security migration. Defaults below preserve the current application behavior where possible.

| Decision | Recommended default | Owner answer |
|---|---|---|
| Account creation | Pre-provision students; disable open sign-up |  |
| First-login credential | Invitation/reset link; otherwise random temporary password |  |
| Admin provisioning | Dashboard first; protected server function for bulk later |  |
| Receptionist role | Admin performs scans in Phase 1; add `staff` only with a defined permission set |  |
| Public event access | Published sessions/active subjects are anonymous read-only |  |
| Student full-profile visibility | Own profile only; admin all |  |
| Leaderboard visibility | Authenticated users; return name/year/points only |  |
| RSVP cutoff | Close at session start |  |
| RSVP year eligibility | Must match at least one session year level |  |
| RSVP requirement for check-in | Recommended but not enforced by supplied migration |  |
| Attendance window | 30 minutes before start through 60 minutes after end |  |
| Student code attendance | Pending until admin approval |  |
| Admin QR attendance | Approved immediately |  |
| Attendance points | 40 |  |
| Approved-note points | 60 |  |
| Point reversals | Ledger net follows current approval state |  |
| Notes contributor eligibility | All authenticated students initially; restrict later if required |  |
| Approved note audience | Target year levels |  |
| Note bucket | Private |  |
| Maximum file size | 25 MB |  |
| Announcements public | Authenticated only in Phase 1 |  |
| Points reset/expiry | No expiry until an academic-year policy exists |  |
| Data retention | Define attendance, notes, logs, and deleted-account retention |  |

## Decision record format

For material changes, create a note from [[Templates/Architecture Decision]] and link it here.
