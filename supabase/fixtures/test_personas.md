# Staging Synthetic Test Personas

Use these non-production synthetic test accounts in the staging Supabase environment to validate RLS policies, role gates, and workflows.

| Persona | Role | Year Level | Status | Target Tests |
|---|---|---|---|---|
| **Student A** | `student` | Freshman | Active | Can view freshman sessions/notes, join RSVP, issue QR, view own points |
| **Student B** | `student` | Senior | Active | Multi-year visibility, distinct audience filtering |
| **Inactive Student** | `student` | Sophomore | Inactive (`active = false`) | Must be rejected by all sensitive RPC functions and RLS |
| **Contributor** | `contributor` | Junior | Active | Can upload notes, request moderation, view own pending uploads |
| **Admin User** | `admin` | Senior | Active | Can manage sessions, scan student QRs, moderate notes/attendance, award points |
| **Anonymous** | Unauthenticated | N/A | Guest | Can read published sessions & active subjects only; zero access to private data |
