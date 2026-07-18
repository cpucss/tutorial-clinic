# Tutorial Clinic Website Completion Plan

This document explains what is still missing to make the website work properly as a real application instead of a front-end MVP with mock data.

## Current Status

- The app is a Vite + React front end.
- Navigation is controlled by local React state in `src/app/App.tsx`, not by real URL routes.
- Most app data comes from `src/mock/index.ts`.
- `src/features/auth/pages/LoginPage.tsx` now has a mock login/register UI with demo student and admin shortcuts.
- There is no real authentication, backend API, database, file storage, or server-side protected admin access yet.
- Student and admin navigation is role-aware in the front-end mock, but it still needs backend-backed route guards.

## Priority Roadmap

1. Connect the mock login and registration flow to a real backend.
2. Add real routing so each page has its own URL.
3. Add authentication and role-based access.
4. Replace mock data with backend API calls.
5. Add a database for users, events, attendance, notes, points, and notifications.
6. Add file storage for uploaded notes.
7. Improve mobile responsiveness and accessibility.
8. Add admin-only workflows for approvals, attendance, sessions, students, and subjects.

## Login And Authentication

### Existing Login Page

The current `LoginPage` in `src/features/auth/pages/LoginPage.tsx` is a front-end demo. For a real release, connect it to the backend and replace local mock authentication.

Recommended fields:

- School email or student ID
- Password
- Login button
- Register link
- Forgot password link
- Error message area
- Loading state

Recommended login behavior:

- Validate empty fields before submitting.
- Send credentials to the backend.
- Store the authenticated user session securely.
- Redirect students to `Dashboard`.
- Redirect admins to `Admin Dashboard`.
- Prevent logged-out users from opening app pages.

### Registration Page

Add a registration page for new students.

Recommended fields:

- Full name
- Student ID
- School email
- Year level
- Password
- Confirm password

Optional admin control:

- Require admin approval before new accounts become active.
- Allow admins to import student accounts from a CSV file.

### Role-Based Access

Use at least these roles:

- `student`
- `contributor`
- `admin`

Rules:

- Students can view events, RSVP, check attendance, browse notes, upload notes, and view points.
- Contributors can do student actions plus upload more resources or host sessions if approved.
- Admins can manage students, subjects, sessions, attendance, notes approval, and point rules.

## Routing

The app currently uses a `tab` state in `App.tsx`. For a real website, use routes.

Suggested routes:

- `/login`
- `/register`
- `/dashboard`
- `/events`
- `/attendance`
- `/leaderboard`
- `/notes`
- `/notes/:noteId`
- `/my-notes`
- `/favourites`
- `/profile`
- `/notifications`
- `/points-guide`
- `/admin`
- `/admin/attendance`
- `/admin/sessions`
- `/admin/notes`
- `/admin/students`
- `/admin/subjects`

Add route guards:

- Public routes: `/login`, `/register`
- Authenticated routes: student pages
- Admin routes: `/admin/*`

## Backend Requirements

You can build the backend with Node.js + Express, NestJS, Laravel, Django, or a backend-as-a-service like Supabase or Firebase.

Recommended API modules:

- Auth API
- Users API
- Events API
- RSVP API
- Attendance API
- Notes API
- File Upload API
- Points API
- Leaderboard API
- Notifications API
- Admin API

Suggested endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/events`
- `POST /api/events`
- `PATCH /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/events/:id/rsvp`
- `DELETE /api/events/:id/rsvp`
- `POST /api/attendance/check-in`
- `GET /api/attendance/me`
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes/:id/star`
- `GET /api/leaderboard`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/admin/notes/:id/approve`
- `POST /api/admin/notes/:id/reject`

## Database Plan

Recommended database: PostgreSQL or MySQL.

Minimum tables:

### `users`

- `id`
- `name`
- `student_id`
- `email`
- `password_hash`
- `year_level`
- `role`
- `points`
- `status`
- `created_at`
- `updated_at`

### `events`

- `id`
- `title`
- `description`
- `topics`
- `date`
- `venue`
- `capacity`
- `speaker_id`
- `created_by`
- `status`
- `created_at`
- `updated_at`

### `event_year_levels`

- `id`
- `event_id`
- `year_level`

### `rsvps`

- `id`
- `event_id`
- `user_id`
- `status`
- `created_at`

### `attendance`

- `id`
- `event_id`
- `user_id`
- `checked_in_at`
- `checked_in_by`
- `qr_token_id`

### `notes`

- `id`
- `title`
- `description`
- `subject_id`
- `year_level`
- `uploader_id`
- `file_url`
- `file_type`
- `status`
- `approved_by`
- `approved_at`
- `rejection_reason`
- `downloads_count`
- `stars_count`
- `created_at`
- `updated_at`

### `subjects`

- `id`
- `code`
- `name`
- `year_level`
- `status`

### `note_stars`

- `id`
- `note_id`
- `user_id`
- `created_at`

### `note_discussions`

- `id`
- `note_id`
- `user_id`
- `body`
- `created_at`

### `points_transactions`

- `id`
- `user_id`
- `source_type`
- `source_id`
- `points`
- `reason`
- `created_by`
- `created_at`

### `notifications`

- `id`
- `user_id`
- `title`
- `body`
- `type`
- `read_at`
- `created_at`

## File Storage

The Notes Library needs real file upload and download handling.

Add:

- Upload validation by file type and size.
- Storage bucket for files.
- Virus or unsafe-file checks if available.
- Private file URLs or signed download URLs.
- Download count tracking.
- Admin approval before public visibility.

Good storage options:

- Supabase Storage
- Firebase Storage
- AWS S3
- Cloudinary for images only

## QR Attendance

Current QR behavior is front-end only.

To make it real:

- Generate a unique attendance token per event and student.
- Expire QR tokens after a short time.
- Let admins scan QR codes from the admin attendance page.
- Prevent duplicate attendance records.
- Award points only after valid check-in.
- Store check-in time, event, student, and admin scanner.

## UI/UX Improvements

### Global Improvements

- Add a real logged-out layout for login and register pages.
- Add loading, empty, error, and success states for every data view.
- Add toast notifications for RSVP, upload, approval, rejection, and check-in actions.
- Make mobile navigation more compact, such as a bottom tab bar or collapsible sidebar.
- Hide admin navigation from non-admin users.
- Add breadcrumb links, not only breadcrumb text.
- Add consistent page titles and action buttons.
- Improve form validation messages.
- Add confirmation dialogs for destructive actions like cancel RSVP, reject notes, delete sessions, and remove students.
- Add keyboard focus states and accessible labels.
- Add a user menu with profile, settings, and logout.
- Replace hard-coded demo avatars with real user initials or profile photos.

### Visual Design Improvements

- Reduce repeated card styling and create reusable page components.
- Use the orange accent only for important actions and active states.
- Improve contrast for light gray text where readability is weak.
- Keep button sizes consistent across pages.
- Add status badges for pending, approved, rejected, upcoming, completed, full, and cancelled.
- Add table views for admin pages where bulk management matters.
- Use real empty states instead of blank areas.

## Per Navbar Missing Items To Add

### Utility

Current items:

- Points Guide
- Notifications

Missing or recommended additions:

- Help / FAQ
- Announcements
- Settings
- Contact Admin or Support
- Notification read/unread filters
- Point history, not only point rules

### Workspace

Current items:

- Dashboard
- Events
- Attendance
- Leaderboard
- Notes Library

Missing or recommended additions:

- Calendar view for events
- My RSVPs
- Session details page with route support
- Attendance QR scanner or check-in instructions
- Search across events and notes
- Subject directory
- Recently viewed notes
- Event feedback or rating after attendance

### Personal

Current items:

- My Notes
- Favourites
- Profile

Missing or recommended additions:

- My RSVPs
- My Attendance History
- My Points History
- Account Settings
- Change Password
- Saved Filters
- Uploaded Notes status tracking
- Profile completion checklist

### Admin

Current items:

- Admin Dashboard
- Admin Attendance
- Admin Sessions
- Admin Notes
- Admin Students
- Admin Subjects

Missing or recommended additions:

- Admin login protection
- Roles and permissions management
- Reports and exports
- Point rules management
- Audit logs
- Bulk student import
- Session speaker management
- QR scanner page
- Attendance correction tools
- Note rejection reason templates
- Announcement management

### Top Bar

Current items:

- Breadcrumb text
- Share button
- Demo avatars
- More options button

Missing or recommended additions:

- Global search
- User account menu
- Logout button
- Notification shortcut with unread count
- Theme or accessibility settings
- Real breadcrumbs with clickable links
- Remove or redefine the `Share` button if it does not have a clear purpose

## Page-Specific Improvements

### Dashboard

- Replace mock metrics with backend totals.
- Add next RSVP session.
- Add recent notification feed.
- Add student progress toward next rank or reward.

### Events

- Add create/edit/delete event for admins.
- Add full event detail route.
- Add capacity validation.
- Add waitlist when an event is full.
- Add event cancellation status.
- Add event feedback after attendance.

### Attendance

- Separate student attendance history from admin check-in tools.
- Add QR scan flow for admins.
- Add manual check-in fallback.
- Add filters by event, student, date, and year level.

### Leaderboard

- Add time filters, such as this week, this month, all time.
- Add explanation for how points are earned.
- Add tie handling.
- Add privacy option if students should not show full names.

### Notes Library

- Connect upload to real file storage.
- Add preview for PDF/image notes.
- Add subject and year filters backed by the database.
- Add approval status visibility for the uploader.
- Add report note button.
- Add download permission rules.

### My Notes

- Show uploaded, pending, approved, and rejected notes.
- Show rejection reason and resubmit action.
- Add edit metadata action before approval.

### Favourites

- Persist starred notes in the database.
- Add remove favorite action.
- Add sorting by recent, subject, and file type.

### Profile

- Add editable profile fields.
- Add password change.
- Add attendance and points summary.
- Add account status and role display.

### Notifications

- Persist notifications in the database.
- Add read/unread state.
- Add links to related pages.
- Add notification preferences.

### Points Guide

- Add real point rules from the database.
- Add point transaction history.
- Show pending points from notes awaiting approval.

## Suggested Implementation Order

1. Create `LoginPage` and `RegisterPage`.
2. Install and configure React Router routes.
3. Add an auth context or auth store.
4. Hide sidebar until the user is logged in.
5. Hide admin nav unless `currentUser.role === "admin"`.
6. Build backend auth endpoints.
7. Add database schema and migrations.
8. Replace `src/mock/index.ts` reads with API service functions.
9. Implement events and RSVP persistence.
10. Implement notes upload, storage, and approval.
11. Implement attendance QR check-in.
12. Implement points transactions and leaderboard.
13. Implement notifications.
14. Add tests for auth, API services, and important workflows.

## Minimum Version For A Working Demo

If the goal is a working school demo, build this first:

- Login page with demo student and demo admin accounts.
- Protected routes.
- Admin-only sidebar section.
- Local backend or Supabase database.
- Events stored in the database.
- RSVP stored in the database.
- Notes metadata stored in the database.
- Notes upload to storage.
- Admin note approval.
- Attendance check-in saved to the database.
- Points awarded from attendance and approved notes.

## Production Checklist

- Passwords are hashed.
- Sessions or tokens are secure.
- Admin routes are protected on both frontend and backend.
- File uploads are validated.
- Database has backups.
- API validates all input.
- Users cannot edit records they do not own.
- Admin actions are logged.
- Errors do not expose sensitive details.
- Mobile layout is tested.
- Accessibility basics are checked.
- Build command passes: `npm run build`.
