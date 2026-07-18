# Product Requirements Document
## Tutorial Clinic Web App
**Version:** 1.0  
**Date:** June 2026  
**Organization:** Computer Science Society  
**Status:** Draft

---

## 1. Overview

### 1.1 Background

Tutorial Clinic is a Computer Science Society initiative that organizes structured study sessions facilitated by senior students or teachers. These sessions are designed to address specific academic pain points that students encounter while studying, providing a guided, peer-supported learning environment.

### 1.2 Purpose of This Document

This PRD defines the product requirements for the Tutorial Clinic Web App — a centralized digital hub that supports the full lifecycle of the Tutorial Clinic program: event discovery, attendance tracking, community engagement through a leaderboard, and a resource-sharing system powered by a points incentive.

### 1.3 Vision

A mobile-first web platform that makes it seamless for students to discover tutorial sessions, RSVP, attend, share knowledge, and stay motivated through friendly competition.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Give students a single place to discover upcoming Tutorial Clinic sessions.
- Enable a fast, QR-based RSVP and attendance system that reduces manual logging.
- Motivate participation and knowledge-sharing through a transparent points and leaderboard system.
- Create a community resource library where older-year students share study notes.
- Provide admins with basic content moderation tools (note verification).

### 2.2 Non-Goals

- This is not a full Learning Management System (LMS); it does not host live video sessions or conduct assessments.
- It does not integrate with the school's official student information system (Phase 1).
- It does not support video file uploads for notes.

---

## 3. User Personas

| Persona | Description | Primary Actions |
|---|---|---|
| **Student (Any Year)** | Enrolled CS student looking for study support | Browse events, RSVP, view notes, track own points |
| **Senior / Note Contributor** | 3rd–4th year student sharing academic resources | Upload notes, earn points, view leaderboard |
| **Receptionist / Event Staff** | Society officer running check-in at a session | Scan QR codes to log attendance |
| **Admin** | CS Society officer managing the platform | Approve/reject note uploads, manage events, oversee users |

---

## 4. Platform Requirements

- **Primary Target:** Mobile web browsers (iOS Safari, Android Chrome)
- **Secondary Target:** Desktop web browsers
- **Approach:** Responsive design, mobile-first layout
- **No native app** required for Phase 1; progressive enhancement for desktop

---

## 5. Feature Requirements

---

### F1 — Events Page

**Priority:** P0 (Must Have)

#### Description
A public-facing page listing all upcoming Tutorial Clinic sessions. This is the primary discovery surface for students.

#### Requirements

- Display a list/feed of upcoming events sorted by date (soonest first).
- Each event card must show:
  - Session title / topic(s) covered
  - Date and time
  - Year level(s) accommodated (e.g., "Open to Freshmen & Sophomores")
  - Speaker name(s) and designation (Senior Student / Teacher)
  - Venue or platform (physical room or online link)
  - Available slots / capacity indicator (optional, Phase 1.1)
- Events in the past are archived and no longer shown on the main feed (accessible via a Past Events tab).
- Admin can create, edit, and delete events.
- Page is accessible without logging in (read-only).
- Logged-in students see an RSVP button on each event card.

#### Acceptance Criteria
- [ ] Events render correctly on a 375px mobile viewport.
- [ ] Year level tags are visually distinct and filterable.
- [ ] Past events do not appear on the default view.

---

### F2 — Student Authentication

**Priority:** P0 (Must Have)

#### Description
Students must be able to create an account and log in to access personalized features (RSVP, profile, leaderboard ranking).

#### Requirements

- Registration with: full name, student ID, year level, email, password.
- Year level selection: Freshman, Sophomore, Junior, Senior.
- Email verification on registration.
- Login via email + password.
- Password reset via email.
- Session persistence (stay logged in across browser sessions).
- Admin accounts are created separately; admin role is not self-assignable.

#### Acceptance Criteria
- [ ] A new student can register, verify email, and log in end-to-end.
- [ ] Year level is captured at registration and reflected in the leaderboard.
- [ ] Incorrect credentials show a clear, user-friendly error.

---

### F3 — QR Code RSVP & Attendance

**Priority:** P0 (Must Have)

#### Description
A two-step attendance system: students RSVP ahead of time and generate a personal QR code, which a receptionist scans on the day to confirm attendance.

#### Requirements

**Student Side:**
- Logged-in students can tap "RSVP" on any upcoming event they are eligible for.
- After RSVPing, the student can access a unique QR code from their profile or from the event card.
- The QR code encodes: student ID + event ID (signed/hashed to prevent forgery).
- QR code is accessible offline once loaded (rendered client-side).
- Students can cancel an RSVP before the event (within a configurable cutoff window).

**Receptionist Side:**
- A dedicated Scan Attendance page accessible to authorized staff (Receptionist role).
- Uses the device camera to scan QR codes in real time.
- On successful scan: displays student name, year level, and event name for confirmation.
- Marks the student's attendance as confirmed in the system.
- Handles edge cases: already scanned (duplicate), invalid QR, event not yet started.

**Admin Side:**
- View attendance list per event with timestamps.
- Manually mark attendance for students in edge cases.
- Export attendance list (CSV).

#### Acceptance Criteria
- [ ] A student can RSVP and generate a QR code within 3 taps.
- [ ] QR scan successfully logs attendance with a visible confirmation screen.
- [ ] Duplicate scan within the same event shows a "Already Checked In" message.
- [ ] Attendance is correctly reflected in the student's profile and point record.

---

### F4 — Leaderboard

**Priority:** P1 (Should Have)

#### Description
A ranked leaderboard showing students with the most accumulated points. Serves as a social motivator for participation and contribution.

#### Requirements

- Default view: Overall leaderboard across all year levels.
- Filterable by year level: All / Freshman / Sophomore / Junior / Senior.
- Each leaderboard entry shows: rank, student name, profile avatar (optional), year level, total points.
- Top 3 entries are visually highlighted (e.g., gold/silver/bronze treatment).
- The logged-in student's own rank is always visible (pinned at the bottom if not in the visible list).
- Leaderboard updates in near-real-time or on page refresh.
- No personally sensitive information is shown beyond name and year level.

#### Acceptance Criteria
- [ ] Year level filter correctly scopes the ranking.
- [ ] Logged-in user's position is visible even if outside the top 20.
- [ ] Points update within 5 minutes of being awarded.

---

### F5 — Notes Upload System

**Priority:** P1 (Should Have)

#### Description
A mechanism for older-year students to contribute academic notes organized by subject/curriculum, earning points upon admin approval.

#### Requirements

**Upload Flow (Student — Sophomore and above):**
- Access an Upload Notes section from their profile or navigation.
- Select the subject from a curriculum-based dropdown (subjects are pre-populated by admin per year level).
- Fill in metadata: title, description, year level this note is for, academic year/semester.
- Upload one or more files. Supported formats:
  - Documents: PDF, DOCX, DOC, TXT
  - Images: JPG, PNG
  - Presentations: PPTX, PPT
  - Spreadsheets: XLSX, XLS
  - **Video files are explicitly not supported and blocked.**
- Maximum file size per upload: configurable by admin (default: 25MB per file).
- Submission goes into a Pending Approval queue.
- The student sees a status indicator: Pending / Approved / Rejected.
- Admin can include a rejection reason visible to the submitter.
- Upon approval, points are credited to the student's account.
- A single submission (even with multiple files) is counted as one contribution for points.

**Admin Moderation:**
- A moderation queue listing all pending note submissions.
- Admin can preview files before approving.
- Approve or reject with an optional note.
- Bulk approve/reject.

#### Acceptance Criteria
- [ ] Video file types are blocked at the upload input level.
- [ ] Submission status is visible to the student on their profile.
- [ ] Points are credited only after admin approval, not on submission.
- [ ] Rejected submissions include the reason from admin.

---

### F6 — Points System Guidelines Page

**Priority:** P1 (Should Have)

#### Description
A clearly written, always-accessible page that explains how points are earned, calculated, and applied. This promotes transparency and trust in the system.

#### Requirements

- A dedicated, publicly accessible page (or a prominent section in the app).
- Must clearly explain all point-earning actions, including:

| Action | Points Awarded |
|---|---|
| Attending a Tutorial Clinic session (QR scan confirmed) | TBD by admin |
| Uploading approved study notes | TBD by admin |
| First-time profile completion | TBD by admin |
| Referring another student (optional future feature) | TBD |

- Explain any point multipliers or bonuses (e.g., uploading a note for a high-demand subject).
- Explain any point expiry rules (if applicable).
- Explain how leaderboard tiers/year-level categories are determined.
- Content is editable by admin without a code deployment (CMS-managed or rich-text editable).

#### Acceptance Criteria
- [ ] Page is reachable from the main navigation.
- [ ] Content accurately reflects the current configured point values.
- [ ] Admin can update point values and the page reflects changes.

---

### F7 — Student Profile

**Priority:** P1 (Should Have)

#### Description
A personal profile page for each student that aggregates their activity, contributions, and progress within the Tutorial Clinic ecosystem.

#### Requirements

**Profile Overview:**
- Display: name, year level, student ID (partially masked), profile photo (optional upload), total points, current leaderboard rank.
- Edit profile: name, photo, password change.

**Notes Library (uploaded by seniors, available to the student's year level):**
- A browsable library of all approved notes relevant to the student's year level.
- Filter by: subject, year level posted for, upload date.
- Search by title or keyword.
- Sort by: newest, most downloaded, subject name.
- Download or preview files directly.

**My Contributions (for note uploaders):**
- List of all notes submitted by the student.
- Status per submission: Pending / Approved / Rejected.
- Points earned per approved submission.

**Attendance History:**
- List of all events the student attended (confirmed via QR scan).
- Date, event title, points earned per session.

**My RSVPs:**
- Upcoming events the student has RSVP'd for.
- Ability to cancel RSVP from this view.

#### Acceptance Criteria
- [ ] Notes library renders correctly with search and filter applied simultaneously.
- [ ] Contribution status is accurate and up to date.
- [ ] Student cannot view notes intended for a year level they are not (e.g., a Freshman cannot see Senior-specific notes unless marked as open).

---

## 6. Admin Panel Summary

The Admin role has access to a separate management interface covering:

- **Event Management:** Create, edit, delete, archive events. Set year level eligibility, speaker, topics, capacity.
- **User Management:** View all registered students, edit year levels, suspend accounts.
- **Notes Moderation:** Review, approve, or reject submitted notes with feedback.
- **Points Configuration:** Set point values per action type.
- **Attendance Override:** Manually mark or unmark attendance.
- **Points System Page:** Edit the guidelines content.
- **Reports:** Export attendance and leaderboard data as CSV.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Pages load within 3 seconds on a 4G mobile connection |
| **Responsiveness** | UI is functional and usable at 375px–1440px viewport widths |
| **Security** | QR codes are signed/hashed to prevent spoofing; passwords hashed (bcrypt or equivalent) |
| **Availability** | Targeting 99% uptime during active event periods |
| **Accessibility** | Sufficient color contrast; tappable targets ≥ 44×44px on mobile |
| **Scalability** | Designed to support up to 500 registered students in Phase 1 |

---

## 8. User Flow Summary

```
[Student] → Register / Log In
    │
    ├─→ Events Page → RSVP → Generate QR
    │                            │
    │               [Receptionist scans QR] → Attendance Logged → Points Awarded
    │
    ├─→ Profile → View Notes Library → Search / Filter / Download
    │          → My Contributions → Track Approval Status
    │          → Attendance History
    │
    ├─→ Upload Notes (Sophomore+) → Pending → [Admin Approves] → Points Awarded
    │
    └─→ Leaderboard → Filter by Year Level → See Own Rank
```

---

## 9. Open Questions

1. **Point values** — What are the exact point values per action? To be finalized with CS Society officers.
2. **Subject curriculum list** — Which subjects and year levels should be pre-loaded? Needs input from the academic committee.
3. **Receptionist authentication** — Is the Receptionist role separate from Admin, or is it a subset permission?
4. **Note visibility rules** — Can Freshmen see notes uploaded by Seniors for Freshman subjects? Or are notes always filtered by the uploader's target year level?
5. **Event eligibility** — Can students RSVP to events not intended for their year level (e.g., a Freshman attending a Senior-targeted session)?
6. **Tech stack** — Not scoped in this document; to be decided by the development team.
7. **Points expiry** — Do points carry over between academic years or reset?

---

## 10. Out of Scope (Phase 1)

- Native iOS / Android app
- Live video streaming or video upload for notes
- Integration with school SIS (Student Information System)
- In-app messaging or comments on notes
- Automated grading or quiz features
- OAuth / SSO with school accounts

---

*This document is a living draft. Updates should be versioned and reviewed by CS Society officers before development begins.*