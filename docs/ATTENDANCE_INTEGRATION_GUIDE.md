# CCS Tutorial Clinic — Frontend Attendance & QR Integration Guide

## 1. Overview & Architectural Principles

The CCS Tutorial Clinic attendance system supports two distinct, cryptographically isolated attendance workflows:

1. **Option 1: Session Attendance Code** (Self-service student check-in using an administrator-announced session code).
2. **Option 2: Personal Attendance QR** (Single-use opaque token issued by PostgreSQL and scanned by an administrator).

---

## 2. Roles & Permissions

| Role | Permissions & Capabilities | Restrictions |
| :--- | :--- | :--- |
| **Student** (`role: "student"`) | • Generate personal 5-minute single-use attendance QR<br>• Submit session attendance code via `check_in_with_code`<br>• View personal attendance history & status | • Cannot scan student QRs<br>• Cannot view private session secrets or attendance codes in advance<br>• Cannot modify or approve records |
| **Contributor** (`role: "contributor"`) | • Same attendance check-in capabilities as Student | • Cannot access administrative scanner |
| **Administrator** (`role: "admin"`) | • Access camera-based QR scanner (`AdminStudentQrScanner`)<br>• Select active session and redeem student QR tokens via `record_attendance_from_qr`<br>• Assign/update session attendance codes<br>• Review, approve, or reject attendance records with audit notes | • Cannot generate student personal attendance QRs for own account |

---

## 3. Workflow Specifications

### Option 1: Session Attendance Code Check-In
```
[Student] -> Opens Attendance Check-in -> Selects Session -> Enters Code
                 |
                 v
       check_in_with_code(p_session_id, p_code)
                 |
                 v
       PostgreSQL validates code against private.session_secrets within active check-in window
                 |
                 +-> Success: Creates public.attendance record, +40 pts awarded
                 +-> Failure: Throws exception / returns error (Invalid code or outside window)
```
- **Security Invariant**: The private session attendance code is stored only in `private.session_secrets` (hashed or isolated) and is never transmitted to the client in session listings.

### Option 2: Personal Attendance QR Check-In
```
[Student] -> Clicks "Generate My QR"
                 |
                 v
       issue_attendance_qr()
                 |
                 v
       PostgreSQL generates 32-byte cryptographic random hex token (64 hex chars),
       stores SHA-256 hash in private.attendance_qr_tokens (expires_at = now() + 5 min),
       and returns { token: raw_hex, expires_at: timestamptz }
                 |
                 v
       Student UI renders <QRCodeSVG value={token} /> with 5:00 countdown timer
                 |
                 v
[Admin]   -> Selects active session -> Starts camera -> Scans Student QR
                 |
                 v
       record_attendance_from_qr(p_session_id, p_token)
                 |
                 v
       PostgreSQL validates hash in private.attendance_qr_tokens:
         - Checks expiry (now() <= expires_at)
         - Checks single-use (used_at is NULL)
         - Marks token used (used_at = now(), used_by = auth.uid())
         - Resolves student profile from token user_id
         - Records public.attendance row (+40 pts)
                 |
                 v
       Returns { attendance: record, student: { name, student_id, year_level } }
```

---

## 4. Component Responsibilities

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| `StudentAttendanceQr` | `src/features/attendance/components/StudentAttendanceQr.tsx` | Issues and displays server-only opaque QR token with 5-minute live countdown; handles offline, expired, and error retry states. **Zero client-side fallback tokens**. |
| `AdminStudentQrScanner` | `src/features/attendance/components/StudentAttendanceQr.tsx` | Admin-only camera scanner; enforces session selection; submits raw token; displays verified student name/ID only from server response; releases camera tracks on unmount. |
| `QrModeSheet` | `src/features/attendance/components/QrModeSheet.tsx` | Accessible modal dialog shell hosting `StudentAttendanceQr` (for students) or `AdminStudentQrScanner` (for admins). |
| `AttendanceCheckinPage` | `src/features/attendance/pages/AttendanceCheckinPage.tsx` | Dedicated dual-tab page providing Option 1 (Personal QR) and Option 2 (Session Code). |
| `AttendanceHistoryPage` | `src/features/attendance/pages/AttendanceHistoryPage.tsx` | Student attendance timeline, approval badges, summary statistics (+40 pts), and check-in launcher. |
| `AdminAttendancePage` | `src/features/admin/pages/AdminAttendancePage.tsx` | Administrative review table, CSV export, inline moderation/correction dialog, and QR scanner launcher. |
| `DashboardPage` | `src/features/dashboard/pages/DashboardPage.tsx` | Student dashboard with prominent "Generate My QR" hero card and Quick Action. |

---

## 5. RPC Parameter & Return Contracts

### `issue_attendance_qr`
- **Caller**: `authenticated` (Student/Contributor).
- **Parameters**: `none`
- **Return Type**: `jsonb`
  ```json
  {
    "token": "a1b2c3d4...64-char-hex",
    "expires_at": "2026-08-30T16:05:00.000Z"
  }
  ```

### `record_attendance_from_qr`
- **Caller**: `authenticated` (Admin only).
- **Parameters**:
  - `p_session_id`: `uuid`
  - `p_token`: `text` (raw 64-char hex string)
- **Return Type**: `jsonb`
  ```json
  {
    "attendance": { "id": "...", "session_id": "...", "status": "Approved", ... },
    "student": { "id": "...", "name": "Aria Montgomery", "student_id": "2024-00421", "year_level": "Freshman" }
  }
  ```

### `check_in_with_code`
- **Caller**: `authenticated` (Student/Contributor).
- **Parameters**:
  - `p_session_id`: `uuid`
  - `p_code`: `text` (4–32 alphanumeric string)
- **Return Type**: `public.attendance` row

---

## 6. State Handling & Edge Cases

| State | UI Behavior & Indicator |
| :--- | :--- |
| **Loading** | Status badge: `Requesting QR...`; spinner animation in place of QR. |
| **Ready** | Active QR displayed; live countdown badge (e.g. `4:38 remaining`); info alert that generating a new QR invalidates the old one. |
| **Expired** | QR SVG hidden; red warning: `This attendance QR has expired.`; `Generate new QR` button enabled. |
| **Offline** | QR SVG hidden; amber badge: `Unavailable`; notice: `Internet Connection Required`; `Retry` button enabled. |
| **RPC Error** | QR SVG hidden; red badge: `Unavailable`; error body displayed safely; `Retry` button enabled. |
| **Camera Starting / Active** | Live video stream with QR targeting overlay; `Stop camera` button. |
| **Camera Denied / Unsupported** | Friendly warning; instructions to enable camera in browser settings. |
| **Verifying (Admin)** | Submissions locked; badge: `Verifying with server...`; prevents rapid double-scanning. |
| **Scan Success (Admin)** | Green checkmark; student full name, student ID, and session title displayed; `Scan another` button. |
| **Scan Rejection (Admin)** | Error notice with exact server rejection reason; `Scan another` button. |

---

## 7. Accessibility & Mobile Compliance

- **Dialog Shells**: All modal sheets enforce `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and focus trap with Escape key listener.
- **Accessible Names**: All action buttons have explicit `aria-label` or text content (`aria-label="Close attendance QR"`, `aria-label="Student attendance QR scanner camera preview"`).
- **QR Accessibility**: QR `<QRCodeSVG />` contains `title="Attendance QR"` and hides raw cryptographic hex strings from visual screen readers.
- **Live Regions**: Dynamic notices use `.inline-notice` with role status.
- **Viewport Layout**: 100% compliant with mobile viewport constraints (360px, 390px, 768px, 1280px) with zero horizontal overflow.

---

## 8. Automated QA Checklist & Test Verification

- [x] Student dashboard displays "Generate My QR" hero card and quick action.
- [x] Admin dashboard hides student QR generation components.
- [x] `issue_attendance_qr` failure hides QR SVG and offers Retry button.
- [x] Offline status hides QR SVG and displays Internet Connection Required notice.
- [x] No `crypto.randomUUID()` demo or fallback credentials generated anywhere in client code.
- [x] Expired QR tokens are hidden and require manual refresh.
- [x] Admin scanner requires active session selection before camera start or token submission.
- [x] Admin scanner submits raw opaque token without client-side identity parsing.
- [x] Admin scanner displays student identity only upon confirmed server RPC response.
- [x] Camera tracks are stopped immediately upon modal close or unmount.
- [x] Dual workflows (Code vs QR) are distinctly separated in `AttendanceCheckinPage`.
