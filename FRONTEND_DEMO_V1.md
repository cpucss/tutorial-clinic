# Functional Front-End Demo v1

## Implementation summary

The Tutorial Clinic now uses one versioned React Context and reducer store for authentication state, users, sessions, subjects, RSVPs, schedules, attendance, notes, favourites, points, notifications, announcements, and preferences. Mutations persist to browser storage and are reflected immediately across student and admin pages.

Completed workflows include:

- Student ID login with centralized demo-account validation.
- Required first-login backup email and password setup.
- Personalized dashboard, profile, leaderboard, point history, schedule, and activity.
- Searchable, filterable sessions with RSVP capacity, cancellation, schedule saving, details, and scannable QR codes.
- Manual attendance codes, supported-browser camera QR scanning, duplicate prevention, arrival status, admin moderation, corrections, and point awards.
- Local note upload metadata, IndexedDB file storage, supported preview, drafts, submission, rejection reasons, resubmission, moderation, and personal favourites.
- Persistent notification inbox and top-bar dropdown with unread counts, filters, read state, deletion, and related navigation.
- Admin CRUD for sessions, students, and subjects; note and attendance moderation; point adjustments; and CSV exports.
- Announcements, global search, Help and Support, accessibility preferences, responsive navigation, offline state, and admin-only demo controls.

## Main created files

- `src/app/routes.ts`
- `src/context/AppDataContext.tsx`
- `src/data/seed.ts`
- `src/types/app.ts`
- `src/services/index.ts`
- `src/utils/fileStorage.ts`
- `src/utils/format.ts`
- `src/features/auth/components/AccountSetupModal.tsx`
- `src/features/auth/pages/SettingsPage.tsx`
- `src/features/schedule/pages/SchedulePage.tsx`
- `src/features/points/pages/PointHistoryPage.tsx`
- `src/features/announcements/pages/AnnouncementsPage.tsx`
- `src/features/help/pages/HelpPage.tsx`
- `src/features/notes/components/NotePreviewModal.tsx`
- `src/features/admin/pages/AdminDemoToolsPage.tsx`
- `src/test/core-workflows.test.tsx`
- `src/test/setup.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `.env.example`

## Main modified files

- Application shell and routing: `src/app/App.tsx`, `src/main.tsx`
- Shared feedback and navigation: `src/components/common/Feedback.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/TopBar.tsx`
- Authentication and personalization: `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/pages/ProfilePage.tsx`, `src/features/dashboard/pages/DashboardPage.tsx`
- Student sessions and attendance: `src/features/attendance/components/QrModal.tsx`, `src/features/attendance/pages/AttendanceCheckinPage.tsx`, `src/features/attendance/pages/AttendanceHistoryPage.tsx`, `src/features/attendance/pages/EventsPage.tsx`
- Notes, notifications, points, and rankings: all active pages under `src/features/notes/pages`, plus `src/features/notifications/pages/NotificationsPage.tsx`, `src/features/points/pages/PointsPage.tsx`, and `src/features/leaderboard/pages/LeaderboardPage.tsx`
- Admin workflows: all existing pages under `src/features/admin/pages`
- UI, metadata, dependencies, and documentation: `src/styles/theme.css`, `index.html`, `vite.config.ts`, `package.json`, `package-lock.json`, and `README.md`

## Removed or merged duplicates

- `src/mock/index.ts` was replaced by `src/data/seed.ts`.
- `src/types/data.ts` was removed; application models now live in `src/types/app.ts`.
- `src/features/auth/mock/currentUser.ts` was removed.
- `src/features/notes/mock/notes.ts` was removed.
- The unused `src/features/notes/pages/NoteDetailsPage.tsx` was replaced by the reusable note preview modal.
- The unused `src/components/ui/PlaceholderPage.tsx` was removed after real pages replaced the placeholders.
- Legacy split model files (`src/types/user.ts`, `src/types/event.ts`, `src/types/note.ts`, and `src/types/leaderboard.ts`) were merged into `src/types/app.ts`.

## Verification result

- TypeScript: passed with `tsc --noEmit`.
- Core workflows: 12 of 12 Vitest tests passed.
- Production build: passed with Vite 6.4.3.
- Dependency audit: 0 known vulnerabilities.

## Browser storage

| Storage | Key or store | Purpose |
|---|---|---|
| localStorage | `tutorial-clinic:demo:v1` | Versioned centralized state, current demo session, setup status, preferences, and application records |
| IndexedDB | `tutorial-clinic-files` | Local note file database |
| IndexedDB object store | `noteFiles` | File blobs keyed by note file ID |

## Prepared service functions

The facade in `src/services/index.ts` is the replacement boundary for a future backend:

- `authService.loginStudent`
- `authService.getCurrentStudent`
- `authService.setBackupEmailAndPassword`
- `studentService.list`
- `studentService.getById`
- `eventService.getEvents`
- `eventService.getById`
- `eventService.createOrUpdateEvent`
- `eventService.deleteEvent`
- `eventService.submitRsvp`
- `attendanceService.listForStudent`
- `attendanceService.validateCode`
- `attendanceService.hasDuplicate`
- `attendanceService.submitAttendance`
- `attendanceService.moderateAttendance`
- `notesService.getApproved`
- `notesService.getForStudent`
- `notesService.uploadNote`
- `notesService.submitNote`
- `notesService.moderateNote`
- `notificationService.getNotifications`
- `notificationService.markNotificationAsRead`
- `notificationService.deleteNotification`
- `pointsService.getBalance`
- `pointsService.getLeaderboard`
- `pointsService.updatePoints`

`VITE_API_BASE_URL` is reserved in `.env.example`; no backend URL is hard-coded.

## Remaining backend-dependent limitations

- Student ID login and roles are simulations and are not secure authentication.
- The demo password is browser-local and must never be treated as a production credential.
- Data is limited to one browser profile and does not synchronize across devices or users.
- Uploaded files are local IndexedDB blobs and cannot be shared with other devices.
- Camera QR scanning depends on browser `BarcodeDetector` and camera support; manual entry is the fallback.
- Notifications and announcements are local application records, not email, SMS, or push messages.
- CSV exports are generated locally.
- Server authorization, file validation, audit logging, backups, and concurrent updates remain backend responsibilities.
