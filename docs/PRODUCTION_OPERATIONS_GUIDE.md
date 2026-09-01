# CCS Tutorial Clinic — Production Operations & Reliability Guide

## 1. System Baseline & Provenance

- **Application**: CCS Tutorial Clinic
- **Release Version**: `v1.0.2`
- **Release Commit**: `eebb194a56dc3c4cdb191374c90e0c0138d6eb4a`
- **Release Tag**: `v1.0.2`
- **Live Production URL**: `https://tutorial-clinic.vercel.app`
- **Production Deployment ID**: `dpl_4i7QJHfHvjzhCXco4kM9ihhBE6Ci`
- **Rollback Deployment ID**: `dpl_HsPYavLwUvZbHSQw3Aw1Fd5R7F74` (`https://tutorial-clinic-dlohjwel6-cpucss.vercel.app`)
- **Supabase Cloud Reference**: `ezuywzrbcitylrzggeiu` (Region: `ap-southeast-1`)

---

## 2. Operational Health & Metrics Baseline

### Availability & Error Thresholds:
- **Target Availability**: 99.9% uptime.
- **HTTP 5xx Error Rate Target**: < 0.05% of requests.
- **Authentication Error Threshold**: Expected only on invalid user input (e.g. bad password); 0 systemic 500s.
- **PWA Service Worker**: Precached shell assets (919 KiB total precache) with runtime stale-while-revalidate for offline access.
- **Bundle Sizing**: Maximum JavaScript chunk: 340 kB (102 kB gzip). Total initial bundle < 750 kB.

### Storage & Database:
- **Storage Bucket**: `tutorial-notes` (Private, maximum 25 MB per object, allowed types: PDF, images, docs).
- **Row-Level Security**: 100% active on all 15 public tables (`profiles`, `subjects`, `sessions`, `rsvps`, `attendance`, `notes`, `note_files`, `note_favorites`, `point_rules`, `point_transactions`, `notifications`, `announcements`, `announcement_reads`, `saved_sessions`, `user_preferences`).
- **Private Schemas**: `private.session_secrets` and `private.attendance_qr_tokens` inaccessible to `anon`, `authenticated`, and `PUBLIC`.

---

## 3. Incident Response & Instant Rollback Runbook

### Detection & Severity Classification:
1. **Severity 1 (Critical Incident)**:
   - Data privacy breach or cross-user data leakage.
   - Complete authentication outage or persistent white screen.
   - Storage upload/download authorization failure.
   - Replayable attendance QR tokens or point balance duplication.
2. **Severity 2 (Degraded Incident)**:
   - Specific route rendering failure on mobile devices.
   - Intermittent sync delay without data loss.

### Rollback Execution (Severity 1 Trigger):
When a Severity 1 defect is confirmed on production, execute instant promotion of the pre-verified rollback deployment:

```powershell
# Instant production rollback to pre-verified release
npx vercel promote dpl_HsPYavLwUvZbHSQw3Aw1Fd5R7F74 --yes
```

### Post-Rollback Verification:
1. Confirm `https://tutorial-clinic.vercel.app` resolves to `dpl_HsPYavLwUvZbHSQw3Aw1Fd5R7F74`.
2. Verify `/` returns `HTTP 200 OK`.
3. Inform CPU CSS leadership and log the incident timeline.

---

## 4. Backup & Disaster Recovery (Tabletop Runbook)

1. **Database Backups**:
   - Supabase PostgreSQL automated daily snapshots with point-in-time retention.
   - Database restore initiates from Supabase Dashboard under *Settings -> Backups*.
2. **Frontend Artifact Recovery**:
   - All deployments on Vercel are immutable and deterministic.
   - Any prior tagged release (e.g., `v1.0.1`, `v1.0.0-prod`) can be promoted instantaneously via `npx vercel promote <dpl_id>`.
3. **Environment & Secrets Recovery**:
   - Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are required for client execution.
   - Zero service-role keys are placed in client environments.

---

## 5. Platform Compatibility & Forward Governance

1. **ClickHouse Logs Migration**:
   - Codebase has 0 calls to deprecated `logs.all` endpoints (scheduled for removal Sept 23, 2026).
   - Log queries utilize current Supabase Analytics & ClickHouse ingestion.
2. **Data API & Explicit Grants**:
   - All client RPCs (`issue_attendance_qr`, `record_attendance_from_qr`, `defer_password_change`, `complete_password_change`, `set_rsvp`, `update_my_profile`, `adjust_points`, `moderate_note`, `moderate_attendance`, `get_leaderboard`) have explicit `GRANT EXECUTE TO authenticated` and revoked execution from `public, anon`.
   - Security-definer functions enforce `SET search_path = ''` and internal caller verification via `(select auth.uid())`.
3. **Realtime & Cross-Device Synchronization Architecture**:
   - `public.sessions` is published via `supabase_realtime` publication for instant cross-device updates when sessions are created, updated, or deleted.
   - Centralized background synchronization coordinator refreshes shared records, user-partitioned data, and server-authoritative leaderboard on a 45-second visible-tab interval, window focus, online reconnect, and tab visibility changes.
   - Leaderboard standings are server-authoritative via `get_leaderboard` RPC with student profile privacy preserved (student IDs omitted from public leaderboard payload).

4. **Automated Quality Verification Commands**:
   - `npm run typecheck`: TypeScript strict compilation (0 errors).
   - `npm test`: 35 Vitest core, security, offline persistence, and synchronization tests.
   - `npm run test:mobile`: 60 mobile/tablet viewport layout checks (0 overflow).
   - `npm run db:lint`: Database schema typing and linting.
   - `npm run build`: Production bundle and PWA service worker build.
