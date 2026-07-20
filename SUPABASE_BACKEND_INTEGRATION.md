# Supabase Backend Integration Guide

This guide is specific to the current CCS Tutorial Clinic codebase. Supabase should be the authoritative backend. The browser's IndexedDB database should only be an offline cache and mutation queue, never the source of truth.

## 1. Current integration status

Already implemented:

- Supabase browser client in `src/services/supabase/client.ts`.
- Student/admin password login in `src/services/supabase/authAdapter.ts`.
- Initial `sessions`, `rsvps`, and `attendance` repositories.
- Session and attendance hydration after login.
- Offline IndexedDB entity/outbox stores.
- Automatic RSVP and attendance synchronization after reconnecting.
- PWA service worker generation through `vite-plugin-pwa`.

Still incomplete:

- The frontend creates temporary IDs such as `stu-...` instead of consistently using the authenticated Supabase UUID.
- Admin session create/update/delete actions only update React/local state.
- Notes, file uploads, favourites, schedules, notifications, announcements, points, preferences, and most admin mutations are not connected to Supabase.
- Account setup still stores demo password information in frontend state. Password changes must use Supabase Auth only.
- The sync engine only handles RSVP and attendance mutations.
- Database migrations, RLS policies, Storage policies, generated database types, and server-side user provisioning are not yet stored in this repository.

## 2. Fix local setup

After every pull that changes `package.json` or `package-lock.json`, run:

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Fill in the public values from **Supabase Dashboard > Project Settings > API**:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Never place `service_role`, secret, database-password, or JWT-signing values in a `VITE_` variable. Vite includes those variables in the browser bundle.

## 3. Track the backend as migrations

Install and initialize the Supabase CLI. The npm CLI requires Node.js 20 or newer:

```powershell
npm install --save-dev supabase
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration new tutorial_clinic_core
```

Put schema and policy SQL in the generated file under `supabase/migrations/`. Test locally with `npx supabase start` and `npx supabase db reset`, then deploy with `npx supabase db push`.

Supabase recommends committing `supabase/config.toml`, migrations, and safe development seed data. See the [official local-development workflow](https://supabase.com/docs/guides/local-development/overview).

## 4. Minimum schema for the code that already exists

The following migration matches the column names used by the current repositories. Review it with the backend team before applying it to production.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_id text not null unique,
  name text not null,
  role text not null default 'student'
    check (role in ('student', 'contributor', 'admin')),
  year_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  subject_id text not null,
  date timestamptz not null,
  end_date timestamptz not null,
  venue text not null,
  capacity integer not null check (capacity > 0),
  instructor text,
  attendance_code text unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > date)
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected')),
  method text not null default 'Code'
    check (method in ('Code', 'QR', 'Manual')),
  arrival text,
  scanned_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  correction_note text,
  unique (session_id, student_id)
);

create index sessions_date_idx on public.sessions(date);
create index rsvps_student_idx on public.rsvps(student_id);
create index attendance_student_idx on public.attendance(student_id);
```

Later migrations should add `subjects`, `notes`, `note_favourites`, `schedule_items`, `notifications`, `announcements`, `point_transactions`, and an idempotency table for offline mutations.

## 5. Enable Row Level Security

All tables exposed to the browser must have RLS enabled. Use the Supabase Auth UUID for ownership checks.

```sql
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.attendance enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "read own profile or admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

create policy "authenticated users read sessions"
on public.sessions for select to authenticated
using (true);

create policy "admins create sessions"
on public.sessions for insert to authenticated
with check (public.is_admin());

create policy "admins update sessions"
on public.sessions for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins delete sessions"
on public.sessions for delete to authenticated
using (public.is_admin());

create policy "students read own rsvps and admins read all"
on public.rsvps for select to authenticated
using (student_id = (select auth.uid()) or public.is_admin());

create policy "students create own rsvps"
on public.rsvps for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "students delete own rsvps"
on public.rsvps for delete to authenticated
using (student_id = (select auth.uid()));

create policy "students read own attendance and admins read all"
on public.attendance for select to authenticated
using (student_id = (select auth.uid()) or public.is_admin());

create policy "students submit own attendance"
on public.attendance for insert to authenticated
with check (student_id = (select auth.uid()) and status = 'Pending');

create policy "admins scan student attendance"
on public.attendance for insert to authenticated
with check (public.is_admin() and status = 'Pending' and method = 'QR');

create policy "admins moderate attendance"
on public.attendance for update to authenticated
using (public.is_admin()) with check (public.is_admin());
```

RLS is mandatory because the publishable key is intentionally visible to the browser. Authorization roles should come from protected profile data or `app_metadata`, not user-editable `user_metadata`. See the [official RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 6. Fix the frontend identity mapping first

This is the most important code change before enabling writes.

`signInStudent()` returns `data.user.id`, the UUID used by `auth.uid()`. However, `AppDataContext.login()` currently creates a different ID with `stu-${Date.now()}`. RSVP and attendance writes then send this temporary ID, so foreign keys and RLS will reject them.

Change the local login contract to accept the authenticated UUID:

```ts
login: (
  studentId: string,
  name?: string,
  role?: string,
  authUserId?: string,
) => Result;
```

Use it when creating the local user:

```ts
id: authUserId ?? crypto.randomUUID()
```

Pass it from `LoginPage.tsx`:

```ts
login(studentId, profile?.name, profile?.role, authData.user.id);
```

After this change, use `currentUser.id` as the UUID in `rsvps.student_id`, `attendance.student_id`, note ownership, favourites, preferences, and offline outbox namespacing.

Also change the initial attendance fetch from `getAttendance(currentUser.studentId)` to `getAttendance(currentUser.id)` because the repository filters the UUID-valued `student_id` column.

## 7. Provision student accounts on a trusted server

The current login adapter converts an ID to an internal email such as `24-1234-56@cpucss.edu.ph`. Each student therefore needs a matching Supabase Auth account and `profiles` row.

Do not call `supabase.auth.admin.createUser()` from React. It requires a privileged key and is server-only. Use one of these trusted environments:

- A one-time local/admin provisioning script whose secrets are never committed.
- A protected Supabase Edge Function restricted to authorized administrators.
- Another private backend service.

Provision each account with:

- Internal email matching `toAuthEmail()`.
- A temporary password matching the agreed first-login policy.
- `email_confirm: true` only if this internal email is not a real inbox.
- Name and student ID in profile metadata.
- Role in protected app metadata or a server-managed profile column.

Supabase explicitly requires admin user creation to run on a server and warns against exposing the service-role key. See [Auth admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) and [managing user data](https://supabase.com/docs/guides/auth/managing-user-data).

## 8. Connect each frontend action

Use repository functions as the boundary between React and Supabase:

| Frontend action | Backend operation |
|---|---|
| Login/logout/password change | Supabase Auth |
| Load profile | `profiles` select by `auth.uid()` |
| Admin session CRUD | `sessions` insert/update/delete |
| RSVP | Server RPC recommended for capacity-safe insert/delete |
| Attendance check-in | Server RPC validating session/code/duplicate |
| Attendance moderation | Admin-only RPC/update |
| Notes | `notes` metadata plus private Storage object |
| Favourites/schedule | Unique user-owned join tables |
| Points | Server-only append transactions; never trust client totals |
| Notifications/announcements | Tables plus Realtime subscription if desired |
| Preferences | User-owned profile/preferences update |

For capacity-limited RSVP, attendance approval, note rewards, and point adjustments, prefer Postgres functions called with `supabase.rpc()`. These operations need atomic validation and should not trust values supplied by the browser. Supabase recommends security-invoker functions by default; if a security-definer function is necessary, set an empty `search_path` and explicitly restrict execution privileges. See [Database Functions](https://supabase.com/docs/guides/database/functions).

## 9. Notes and Supabase Storage

Create a private bucket named `note-files`. Use a stable object path:

```text
{auth-user-uuid}/{note-uuid}/{safe-file-name}
```

The browser may cache a pending Blob in IndexedDB while offline. On reconnect:

1. Upload the Blob to `note-files`.
2. Store only the returned object path in the `notes` row.
3. Remove the local Blob after both upload and metadata save succeed.
4. Use a short-lived signed URL for preview/download.

Storage denies uploads until suitable `storage.objects` policies exist. Restrict insert/select/update/delete by bucket and the authenticated user's path or object owner. See [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## 10. Complete offline synchronization safely

Keep IndexedDB as a cache/outbox only. Every queued mutation should contain:

- A stable UUID record ID.
- The authenticated Supabase user UUID.
- A stable mutation UUID reused for retries.
- Operation and payload.
- Creation time, retry count, and sync status.

The backend should enforce unique constraints and idempotency. A network failure can occur after Supabase accepts a write but before the browser receives the response. Retrying must not award points or create attendance twice.

Add a `processed_mutations` table or an `apply_offline_mutation()` RPC for critical workflows. The server should return the already accepted result when it receives the same mutation UUID again.

Never consider an offline RSVP confirmed until the server accepts it. Never award points in the reducer; award them transactionally in the database after server-side approval.

## 11. Generate database types

After applying migrations, generate types and use them in the client:

```powershell
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/services/supabase/database.types.ts
```

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const supabase = createClient<Database>(url, publishableKey);
```

This replaces repository `any` values with schema-derived row, insert, and update types. See [Supabase TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support).

## 12. Recommended implementation order

1. Add and test migrations locally.
2. Enable RLS and test student/admin policies.
3. Provision test Auth users and profiles on a trusted server.
4. Fix the frontend UUID mapping.
5. Finish session and profile repositories.
6. Implement capacity-safe RSVP and attendance RPCs.
7. Add notes metadata and private Storage uploads.
8. Connect favourites, schedules, preferences, notifications, and announcements.
9. Move all point awards and moderation side effects to database transactions.
10. Generate TypeScript database types.
11. Expand the sync engine and add idempotency/conflict tests.
12. Remove the remaining demo seed and synchronous mock services after every screen reads from repositories.

## 13. Verification checklist

- A student cannot read or modify another student's private records.
- A student cannot create a row with another user's UUID.
- A non-admin cannot create sessions, moderate attendance/notes, or adjust points.
- The browser bundle contains only the Supabase URL and publishable key.
- Refreshing restores the Supabase session and authoritative profile UUID.
- A repeated offline mutation does not create duplicates.
- A full RSVP is rejected by the backend even when it was queued offline.
- One attendance approval produces exactly one point transaction.
- Note files are private and accessed through allowed policies or signed URLs.
- `npm run typecheck`, `npm test`, and `npm run build` pass before deployment.
