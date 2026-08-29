---
title: Phase 4 - Sessions RSVP and Attendance
status: blocked-by-phase-3
tags: [phase, sessions, attendance, qr]
---

# Phase 4 — sessions, RSVP, and attendance

## Objective

Implement the core Tutorial Clinic backend workflows before secondary features.

## Backend tasks

- [ ] Admin session CRUD returns/stores database UUIDs.
- [ ] Attendance code is set with `set_session_attendance_code`.
- [ ] RSVP uses atomic `set_rsvp(session_id, joined)`.
- [ ] Capacity, year eligibility, cutoff, and status are checked in Postgres.
- [ ] Student code check-in uses `check_in_with_code`.
- [ ] QR issuance uses `issue_attendance_qr`.
- [ ] Admin QR consumption uses `record_attendance_from_qr`.
- [ ] Attendance moderation uses `moderate_attendance`.
- [ ] Duplicate constraints and arrival calculation are server-side.
- [ ] Attendance approval reconciles the point ledger.

## Minimal frontend files likely touched

- `src/services/supabase/sessionRepository.ts`
- `src/services/supabase/attendanceRepository.ts`
- `src/features/attendance/components/StudentAttendanceQr.tsx`
- `src/context/AppDataContext.tsx` during transition
- `src/sync/syncEngine.ts`

Do not redesign the pages.

## Required tests

- [ ] Create session then RSVP using the returned UUID.
- [ ] Two users race for the final slot; one succeeds.
- [ ] Replayed joined/cancelled commands are idempotent.
- [ ] Closed/cancelled/draft sessions reject operations.
- [ ] Wrong code and out-of-window code fail.
- [ ] Forged, expired, and replayed QR values fail.
- [ ] Accepted QR creates one approved attendance record.
- [ ] Repeated moderation does not double-award points.
- [ ] Student cannot approve their own attendance.

## Exit gate

Sessions, RSVP, code check-in, QR check-in, moderation, and attendance points work across two devices with Supabase as the only source of truth.

Next: [[07 Phase Playbooks/Phase 5 - Notes Storage Points and Notifications]].
