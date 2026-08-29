-- Tutorial Clinic schema alignment
-- Apply to staging first. This is additive except that the exposed plaintext
-- sessions.attendance_code value is cleared after its hash is migrated.

begin;

create schema if not exists extensions;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;
alter extension pgcrypto set schema extensions;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

-- Profiles: the Auth UUID remains the primary key and canonical user ID.
alter table public.profiles
  add column if not exists year_level text,
  add column if not exists program text not null default 'BS Computer Science',
  add column if not exists section text not null default '',
  add column if not exists account_setup_completed boolean not null default false,
  add column if not exists must_change_password boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('student', 'contributor', 'admin')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_year_level_check'
  ) then
    alter table public.profiles
      add constraint profiles_year_level_check
      check (
        year_level is null
        or year_level in ('Freshman', 'Sophomore', 'Junior', 'Senior')
      ) not valid;
  end if;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- Subject IDs stay text during this migration because the frontend seed catalog
-- already uses stable text IDs such as sub-101.
create table if not exists public.subjects (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  name text not null,
  year_level text,
  coordinator text not null default 'TBD',
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_year_level_check check (
    year_level is null
    or year_level in ('Freshman', 'Sophomore', 'Junior', 'Senior')
  )
);

-- Preserve existing session references with visible placeholders. Replace these
-- placeholders with the authoritative curriculum catalog before production.
insert into public.subjects (id, code, name, coordinator, active)
select distinct
  s.subject_id,
  s.subject_id,
  s.subject_id,
  'TBD',
  true
from public.sessions s
where s.subject_id is not null
  and btrim(s.subject_id) <> ''
on conflict (id) do nothing;

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function private.set_updated_at();

alter table public.sessions
  add column if not exists topics text[] not null default '{}'::text[],
  add column if not exists year_levels text[] not null default array[
    'Freshman', 'Sophomore', 'Junior', 'Senior'
  ]::text[],
  add column if not exists instructor_role text not null default 'Facilitator',
  add column if not exists status text not null default 'Upcoming',
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and conname = 'sessions_subject_id_fkey'
  ) then
    alter table public.sessions
      add constraint sessions_subject_id_fkey
      foreign key (subject_id) references public.subjects(id)
      on update cascade on delete restrict not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and conname = 'sessions_status_check'
  ) then
    alter table public.sessions
      add constraint sessions_status_check
      check (status in ('Draft', 'Upcoming', 'Live', 'Completed', 'Cancelled'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and conname = 'sessions_capacity_check'
  ) then
    alter table public.sessions
      add constraint sessions_capacity_check check (capacity > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and conname = 'sessions_date_order_check'
  ) then
    alter table public.sessions
      add constraint sessions_date_order_check check (end_date > date) not valid;
  end if;
end;
$$;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function private.set_updated_at();

-- Secrets are outside the exposed public schema.
create table if not exists private.session_secrets (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  attendance_code_hash text not null,
  updated_at timestamptz not null default now()
);

insert into private.session_secrets (session_id, attendance_code_hash, updated_at)
select
  s.id,
  extensions.crypt(upper(btrim(s.attendance_code)), extensions.gen_salt('bf')),
  now()
from public.sessions s
where s.attendance_code is not null
  and btrim(s.attendance_code) <> ''
on conflict (session_id) do update
set attendance_code_hash = excluded.attendance_code_hash,
    updated_at = excluded.updated_at;

-- The legacy column is retained temporarily for frontend compatibility, but its
-- value is removed so published session reads cannot reveal the code.
update public.sessions
set attendance_code = null
where attendance_code is not null;

-- Canonical RSVP owner UUID.
alter table public.rsvps
  add column if not exists user_id uuid;

update public.rsvps r
set user_id = p.id
from public.profiles p
where r.user_id is null
  and (
    p.id::text = r.student_id
    or upper(p.student_id) = upper(r.student_id)
  );

do $$
declare
  unresolved_count bigint;
begin
  select count(*) into unresolved_count
  from public.rsvps
  where user_id is null;

  if unresolved_count > 0 then
    raise exception
      'Cannot continue: % RSVP rows do not map to a profile UUID. Run 00-preflight-audit.sql.',
      unresolved_count;
  end if;
end;
$$;

alter table public.rsvps
  alter column user_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.rsvps'::regclass
      and conname = 'rsvps_user_id_fkey'
  ) then
    alter table public.rsvps
      add constraint rsvps_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end;
$$;

create unique index if not exists rsvps_session_user_uidx
  on public.rsvps (session_id, user_id);
create index if not exists rsvps_user_created_idx
  on public.rsvps (user_id, created_at desc);

-- Canonical attendance owner UUID and missing audit fields.
alter table public.attendance
  add column if not exists user_id uuid,
  add column if not exists checked_in_at timestamptz,
  add column if not exists method text not null default 'Code',
  add column if not exists arrival text not null default 'On time',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists correction_note text,
  add column if not exists updated_at timestamptz not null default now();

update public.attendance a
set user_id = p.id
from public.profiles p
where a.user_id is null
  and (
    p.id::text = a.student_id
    or upper(p.student_id) = upper(a.student_id)
  );

update public.attendance
set checked_in_at = coalesce(checked_in_at, scanned_at, now())
where checked_in_at is null;

do $$
declare
  unresolved_count bigint;
begin
  select count(*) into unresolved_count
  from public.attendance
  where user_id is null;

  if unresolved_count > 0 then
    raise exception
      'Cannot continue: % attendance rows do not map to a profile UUID. Run 00-preflight-audit.sql.',
      unresolved_count;
  end if;
end;
$$;

alter table public.attendance
  alter column user_id set not null,
  alter column checked_in_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance'::regclass
      and conname = 'attendance_user_id_fkey'
  ) then
    alter table public.attendance
      add constraint attendance_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance'::regclass
      and conname = 'attendance_status_check'
  ) then
    alter table public.attendance
      add constraint attendance_status_check
      check (status in ('Pending', 'Approved', 'Rejected')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance'::regclass
      and conname = 'attendance_method_check'
  ) then
    alter table public.attendance
      add constraint attendance_method_check
      check (method in ('Code', 'QR', 'Manual')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance'::regclass
      and conname = 'attendance_arrival_check'
  ) then
    alter table public.attendance
      add constraint attendance_arrival_check
      check (arrival in ('Early', 'On time', 'Late')) not valid;
  end if;
end;
$$;

create unique index if not exists attendance_session_user_uidx
  on public.attendance (session_id, user_id);
create index if not exists attendance_user_checked_idx
  on public.attendance (user_id, checked_in_at desc);
create index if not exists attendance_status_checked_idx
  on public.attendance (status, checked_in_at desc);

drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function private.set_updated_at();

-- Opaque, short-lived QR credentials. Only their hashes are stored.
create table if not exists private.attendance_qr_tokens (
  token_hash text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(id) on delete set null,
  constraint attendance_qr_expiry_check check (expires_at > issued_at)
);

create index if not exists attendance_qr_user_expiry_idx
  on private.attendance_qr_tokens (user_id, expires_at desc);

-- Shared notes and file metadata.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_id text not null references public.subjects(id) on update cascade on delete restrict,
  description text not null default '',
  tags text[] not null default '{}'::text[],
  target_year_levels text[] not null default array[
    'Freshman', 'Sophomore', 'Junior', 'Senior'
  ]::text[],
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Draft',
  rejection_reason text,
  moderated_at timestamptz,
  moderated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_status_check check (
    status in ('Draft', 'Pending', 'Approved', 'Rejected')
  )
);

create table if not exists public.note_files (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  created_at timestamptz not null default now()
);

create table if not exists public.note_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create index if not exists notes_status_subject_updated_idx
  on public.notes (status, subject_id, updated_at desc);
create index if not exists notes_uploader_updated_idx
  on public.notes (uploader_id, updated_at desc);
create index if not exists note_files_note_idx
  on public.note_files (note_id);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row execute function private.set_updated_at();

-- Append-only points ledger and editable award values.
create table if not exists public.point_rules (
  code text primary key,
  points integer not null check (points >= 0),
  label text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.point_rules (code, points, label, active)
values
  ('attendance_approved', 40, 'Administrator-approved session attendance', true),
  ('note_approved', 60, 'Administrator-approved study note', true)
on conflict (code) do nothing;

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check (points <> 0),
  reason text not null,
  related_type text not null,
  related_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint point_transactions_type_check check (
    related_type in ('Attendance', 'Note', 'Adjustment', 'Account')
  )
);

create index if not exists point_transactions_user_created_idx
  on public.point_transactions (user_id, created_at desc);
create index if not exists point_transactions_related_idx
  on public.point_transactions (related_type, related_id);

-- Account-scoped secondary data.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  related_tab text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  audience text not null default 'All',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_audience_check check (
    audience in ('All', 'Freshman', 'Sophomore', 'Junior', 'Senior')
  )
);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table if not exists public.saved_sessions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reduced_motion boolean not null default false,
  high_contrast boolean not null default false,
  compact_navigation boolean not null default false,
  session_reminders boolean not null default true,
  note_updates boolean not null default true,
  leaderboard_updates boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function private.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function private.set_updated_at();

commit;

-- After this migration:
-- 1. Replace subject placeholders with the authoritative curriculum.
-- 2. Resolve any NOT VALID constraints, then validate them deliberately.
-- 3. Apply 02-security-and-rpc.sql in the coordinated frontend cutover.
