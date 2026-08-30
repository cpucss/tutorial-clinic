-- Tutorial Clinic least-privilege security and atomic backend workflows.
-- Coordinate this migration with the compatible frontend: direct RSVP and
-- attendance writes are intentionally revoked.

begin;

-- Remove all existing application-table policies in scope, including the
-- permissive development policies from the supplied SQL.
do $$
declare
  target_table text;
  existing_policy record;
begin
  foreach target_table in array array[
    'profiles',
    'subjects',
    'sessions',
    'rsvps',
    'attendance',
    'notes',
    'note_files',
    'note_favorites',
    'point_rules',
    'point_transactions',
    'notifications',
    'announcements',
    'announcement_reads',
    'saved_sessions',
    'user_preferences'
  ]
  loop
    for existing_policy in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        existing_policy.policyname,
        target_table
      );
    end loop;
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.attendance enable row level security;
alter table public.notes enable row level security;
alter table public.note_files enable row level security;
alter table public.note_favorites enable row level security;
alter table public.point_rules enable row level security;
alter table public.point_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.saved_sessions enable row level security;
alter table public.user_preferences enable row level security;

-- Reset Data API grants, then explicitly add only required operations.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.subjects from anon, authenticated;
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.rsvps from anon, authenticated;
revoke all on table public.attendance from anon, authenticated;
revoke all on table public.notes from anon, authenticated;
revoke all on table public.note_files from anon, authenticated;
revoke all on table public.note_favorites from anon, authenticated;
revoke all on table public.point_rules from anon, authenticated;
revoke all on table public.point_transactions from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.announcements from anon, authenticated;
revoke all on table public.announcement_reads from anon, authenticated;
revoke all on table public.saved_sessions from anon, authenticated;
revoke all on table public.user_preferences from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update on table public.profiles to authenticated;

grant select on table public.subjects to anon, authenticated;
grant insert, update, delete on table public.subjects to authenticated;

grant select on table public.sessions to anon, authenticated;
grant insert, update, delete on table public.sessions to authenticated;

grant select on table public.rsvps to authenticated;
grant select on table public.attendance to authenticated;

grant select, insert, update, delete on table public.notes to authenticated;
grant select, insert, delete on table public.note_files to authenticated;
grant select, insert, delete on table public.note_favorites to authenticated;

grant select on table public.point_rules to anon, authenticated;
grant update on table public.point_rules to authenticated;
grant select on table public.point_transactions to authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

grant select, insert, update, delete on table public.announcements to authenticated;
grant select, insert, update, delete on table public.announcement_reads to authenticated;
grant select, insert, delete on table public.saved_sessions to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;

-- Protected helpers. The private schema is not exposed through the Data API.
create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.active = true
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.active = true
      and p.role = 'admin'
  );
$$;

create or replace function private.arrival_for(
  session_start timestamptz,
  checked_at timestamptz
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when checked_at < session_start - interval '10 minutes' then 'Early'
    when checked_at <= session_start + interval '10 minutes' then 'On time'
    else 'Late'
  end;
$$;

revoke execute on function private.is_active_user() from public, anon;
revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.arrival_for(timestamptz, timestamptz)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Keep the existing helper name secure for any reviewed code that still calls it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke execute on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Profiles.
create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id and private.is_active_user());

create policy profiles_select_admin
on public.profiles for select
to authenticated
using (private.is_admin());

create policy profiles_update_admin
on public.profiles for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Public event catalog. Admins can also see drafts.
create policy subjects_select_active_anon
on public.subjects for select
to anon
using (active = true);

create policy subjects_select_active_authenticated
on public.subjects for select
to authenticated
using (active = true and private.is_active_user());

create policy subjects_select_admin
on public.subjects for select
to authenticated
using (private.is_admin());

create policy subjects_insert_admin
on public.subjects for insert
to authenticated
with check (private.is_admin());

create policy subjects_update_admin
on public.subjects for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy subjects_delete_admin
on public.subjects for delete
to authenticated
using (private.is_admin());

create policy sessions_select_published_anon
on public.sessions for select
to anon
using (status <> 'Draft');

create policy sessions_select_published_authenticated
on public.sessions for select
to authenticated
using (status <> 'Draft' and private.is_active_user());

create policy sessions_select_admin
on public.sessions for select
to authenticated
using (private.is_admin());

create policy sessions_insert_admin
on public.sessions for insert
to authenticated
with check (private.is_admin());

create policy sessions_update_admin
on public.sessions for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy sessions_delete_admin
on public.sessions for delete
to authenticated
using (private.is_admin());

-- Private per-user core records. Writes happen through RPC functions below.
create policy rsvps_select_own
on public.rsvps for select
to authenticated
using ((select auth.uid()) = user_id and private.is_active_user());

create policy rsvps_select_admin
on public.rsvps for select
to authenticated
using (private.is_admin());

create policy attendance_select_own
on public.attendance for select
to authenticated
using ((select auth.uid()) = user_id and private.is_active_user());

create policy attendance_select_admin
on public.attendance for select
to authenticated
using (private.is_admin());

-- Notes and metadata.
create policy notes_select_visible
on public.notes for select
to authenticated
using (
  private.is_admin()
  or (uploader_id = (select auth.uid()) and private.is_active_user())
  or (
    status = 'Approved'
    and private.is_active_user()
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.active = true
        and p.year_level = any (notes.target_year_levels)
    )
  )
);

create policy notes_insert_own
on public.notes for insert
to authenticated
with check (
  uploader_id = (select auth.uid())
  and private.is_active_user()
  and status in ('Draft', 'Pending')
);

create policy notes_update_own
on public.notes for update
to authenticated
using (
  uploader_id = (select auth.uid())
  and private.is_active_user()
  and status in ('Draft', 'Rejected')
)
with check (
  uploader_id = (select auth.uid())
  and status in ('Draft', 'Pending')
);

create policy notes_update_admin
on public.notes for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy notes_delete_own
on public.notes for delete
to authenticated
using (
  uploader_id = (select auth.uid())
  and private.is_active_user()
  and status in ('Draft', 'Rejected')
);

create policy notes_delete_admin
on public.notes for delete
to authenticated
using (private.is_admin());

create policy note_files_select_visible_note
on public.note_files for select
to authenticated
using (
  exists (
    select 1 from public.notes n where n.id = note_files.note_id
  )
);

create policy note_files_insert_owner
on public.note_files for insert
to authenticated
with check (
  uploader_id = (select auth.uid())
  and private.is_active_user()
  and exists (
    select 1
    from public.notes n
    where n.id = note_files.note_id
      and n.uploader_id = (select auth.uid())
      and n.status in ('Draft', 'Rejected')
  )
);

create policy note_files_delete_owner_or_admin
on public.note_files for delete
to authenticated
using (
  private.is_admin()
  or (
    uploader_id = (select auth.uid())
    and private.is_active_user()
    and exists (
      select 1
      from public.notes n
      where n.id = note_files.note_id
        and n.uploader_id = (select auth.uid())
        and n.status in ('Draft', 'Rejected')
    )
  )
);

create policy note_favorites_select_own
on public.note_favorites for select
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy note_favorites_insert_own
on public.note_favorites for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_active_user()
  and exists (
    select 1 from public.notes n
    where n.id = note_favorites.note_id and n.status = 'Approved'
  )
);

create policy note_favorites_delete_own
on public.note_favorites for delete
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

-- Points.
create policy point_rules_select_active_anon
on public.point_rules for select
to anon
using (active = true);

create policy point_rules_select_active_authenticated
on public.point_rules for select
to authenticated
using (active = true and private.is_active_user());

create policy point_rules_select_admin
on public.point_rules for select
to authenticated
using (private.is_admin());

create policy point_rules_update_admin
on public.point_rules for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy point_transactions_select_own
on public.point_transactions for select
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy point_transactions_select_admin
on public.point_transactions for select
to authenticated
using (private.is_admin());

-- Notifications, announcements, saved sessions, and preferences.
create policy notifications_select_own
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy notifications_update_own_read_state
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user())
with check (user_id = (select auth.uid()));

create policy announcements_select_eligible
on public.announcements for select
to authenticated
using (
  private.is_admin()
  or (
    private.is_active_user()
    and published_at is not null
    and published_at <= now()
    and (
      audience = 'All'
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.active = true
          and p.year_level = announcements.audience
      )
    )
  )
);

create policy announcements_insert_admin
on public.announcements for insert
to authenticated
with check (private.is_admin());

create policy announcements_update_admin
on public.announcements for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy announcements_delete_admin
on public.announcements for delete
to authenticated
using (private.is_admin());

create policy announcement_reads_select_own
on public.announcement_reads for select
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy announcement_reads_insert_own
on public.announcement_reads for insert
to authenticated
with check (user_id = (select auth.uid()) and private.is_active_user());

create policy announcement_reads_update_own
on public.announcement_reads for update
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user())
with check (user_id = (select auth.uid()));

create policy announcement_reads_delete_own
on public.announcement_reads for delete
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy saved_sessions_select_own
on public.saved_sessions for select
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy saved_sessions_insert_own
on public.saved_sessions for insert
to authenticated
with check (user_id = (select auth.uid()) and private.is_active_user());

create policy saved_sessions_delete_own
on public.saved_sessions for delete
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy user_preferences_select_own
on public.user_preferences for select
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

create policy user_preferences_insert_own
on public.user_preferences for insert
to authenticated
with check (user_id = (select auth.uid()) and private.is_active_user());

create policy user_preferences_update_own
on public.user_preferences for update
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user())
with check (user_id = (select auth.uid()));

create policy user_preferences_delete_own
on public.user_preferences for delete
to authenticated
using (user_id = (select auth.uid()) and private.is_active_user());

-- Safe profile creation. User metadata may initialize non-authorization fields,
-- but role is always hard-coded to student.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_year text;
  safe_year text;
  derived_student_id text;
begin
  requested_year := new.raw_user_meta_data ->> 'year_level';
  safe_year := case
    when requested_year in ('Freshman', 'Sophomore', 'Junior', 'Senior')
      then requested_year
    else null
  end;

  derived_student_id := upper(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'student_id'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    new.id::text
  ));

  insert into public.profiles (
    id,
    student_id,
    name,
    year_level,
    program,
    role,
    active,
    account_setup_completed,
    must_change_password
  )
  values (
    new.id,
    derived_student_id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      new.email,
      'New student'
    ),
    safe_year,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'program'), ''),
      'BS Computer Science'
    ),
    'student',
    true,
    false,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Whitelisted self-profile update. Role and active state are never accepted.
create or replace function public.update_my_profile(
  p_name text,
  p_year_level text,
  p_program text,
  p_section text,
  p_account_setup_completed boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles%rowtype;
begin
  if not private.is_active_user() then
    raise exception 'Active authentication is required';
  end if;

  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'Name is required';
  end if;

  if p_year_level not in ('Freshman', 'Sophomore', 'Junior', 'Senior') then
    raise exception 'Unsupported year level';
  end if;

  update public.profiles
  set name = btrim(p_name),
      year_level = p_year_level,
      program = coalesce(nullif(btrim(p_program), ''), program),
      section = btrim(coalesce(p_section, '')),
      account_setup_completed = coalesce(
        p_account_setup_completed,
        account_setup_completed
      )
  where id = (select auth.uid())
  returning * into updated_profile;

  return to_jsonb(updated_profile);
end;
$$;

-- Atomic desired-state RSVP.
create or replace function public.set_rsvp(
  p_session_id uuid,
  p_joined boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  target_session public.sessions%rowtype;
  saved_rsvp public.rsvps%rowtype;
  reserved_count integer;
begin
  select * into current_profile
  from public.profiles
  where id = (select auth.uid())
    and active = true;

  if not found or current_profile.role not in ('student', 'contributor') then
    raise exception 'An active student account is required';
  end if;

  select * into target_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found';
  end if;

  if target_session.status in ('Draft', 'Cancelled', 'Completed')
     or target_session.date <= now() then
    raise exception 'RSVP is closed for this session';
  end if;

  if current_profile.year_level is null
     or not (current_profile.year_level = any (target_session.year_levels)) then
    raise exception 'This session is not available for your year level';
  end if;

  if p_joined then
    select count(*) into reserved_count
    from public.rsvps
    where session_id = p_session_id;

    if reserved_count >= target_session.capacity then
      raise exception 'This session is already full';
    end if;

    insert into public.rsvps (session_id, student_id, user_id)
    values (
      p_session_id,
      current_profile.student_id,
      current_profile.id
    )
    on conflict (session_id, user_id) do nothing;

    select * into saved_rsvp
    from public.rsvps
    where session_id = p_session_id
      and user_id = current_profile.id;

    return jsonb_build_object(
      'joined', true,
      'rsvp', to_jsonb(saved_rsvp)
    );
  end if;

  delete from public.rsvps
  where session_id = p_session_id
    and user_id = current_profile.id;

  return jsonb_build_object('joined', false, 'rsvp', null);
end;
$$;

-- Admin-only attendance code storage.
create or replace function public.set_session_attendance_code(
  p_session_id uuid,
  p_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required';
  end if;

  normalized_code := upper(btrim(coalesce(p_code, '')));
  if char_length(normalized_code) < 4 or char_length(normalized_code) > 32 then
    raise exception 'Attendance code must be 4 to 32 characters';
  end if;

  if not exists (select 1 from public.sessions where id = p_session_id) then
    raise exception 'Session not found';
  end if;

  insert into private.session_secrets (
    session_id,
    attendance_code_hash,
    updated_at
  )
  values (
    p_session_id,
    extensions.crypt(normalized_code, extensions.gen_salt('bf')),
    now()
  )
  on conflict (session_id) do update
  set attendance_code_hash = excluded.attendance_code_hash,
      updated_at = excluded.updated_at;
end;
$$;

-- Student code check-in. The code/hash and timing checks never occur in React.
create or replace function public.check_in_with_code(
  p_session_id uuid,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  target_session public.sessions%rowtype;
  stored_hash text;
  checked_at timestamptz := now();
  saved_attendance public.attendance%rowtype;
begin
  select * into current_profile
  from public.profiles
  where id = (select auth.uid())
    and active = true
    and role in ('student', 'contributor');

  if not found then
    raise exception 'An active student account is required';
  end if;

  select * into target_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found or target_session.status in ('Draft', 'Cancelled') then
    raise exception 'Session is not available for check-in';
  end if;

  if checked_at < target_session.date - interval '30 minutes'
     or checked_at > target_session.end_date + interval '60 minutes' then
    raise exception 'Attendance check-in is outside the allowed time window';
  end if;

  select attendance_code_hash into stored_hash
  from private.session_secrets
  where session_id = p_session_id;

  if stored_hash is null
     or extensions.crypt(upper(btrim(coalesce(p_code, ''))), stored_hash)
        <> stored_hash then
    raise exception 'Invalid attendance code';
  end if;

  insert into public.attendance (
    session_id,
    student_id,
    user_id,
    status,
    method,
    arrival,
    scanned_at,
    checked_in_at
  )
  values (
    p_session_id,
    current_profile.student_id,
    current_profile.id,
    'Pending',
    'Code',
    private.arrival_for(target_session.date, checked_at),
    checked_at,
    checked_at
  )
  returning * into saved_attendance;

  return to_jsonb(saved_attendance);
exception
  when unique_violation then
    raise exception 'Attendance already exists for this session';
end;
$$;

-- Server-issued, opaque, five-minute, single-use student credential.
create or replace function public.issue_attendance_qr()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  raw_token text;
  hashed_token text;
  token_expiry timestamptz := now() + interval '5 minutes';
begin
  select * into current_profile
  from public.profiles
  where id = (select auth.uid())
    and active = true
    and role in ('student', 'contributor');

  if not found then
    raise exception 'An active student account is required';
  end if;

  delete from private.attendance_qr_tokens
  where user_id = current_profile.id;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  hashed_token := encode(extensions.digest(raw_token, 'sha256'), 'hex');

  insert into private.attendance_qr_tokens (
    token_hash,
    user_id,
    expires_at
  )
  values (
    hashed_token,
    current_profile.id,
    token_expiry
  );

  return jsonb_build_object(
    'token', raw_token,
    'expires_at', token_expiry
  );
end;
$$;

-- Admin consumes the opaque token and records attendance atomically.
create or replace function public.record_attendance_from_qr(
  p_session_id uuid,
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_id uuid := (select auth.uid());
  hashed_token text;
  token_record private.attendance_qr_tokens%rowtype;
  student_profile public.profiles%rowtype;
  target_session public.sessions%rowtype;
  checked_at timestamptz := now();
  saved_attendance public.attendance%rowtype;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required';
  end if;

  hashed_token := encode(
    extensions.digest(coalesce(p_token, ''), 'sha256'),
    'hex'
  );

  select * into token_record
  from private.attendance_qr_tokens
  where token_hash = hashed_token
  for update;

  if not found then
    raise exception 'Invalid attendance QR';
  end if;

  if token_record.used_at is not null then
    raise exception 'Attendance QR has already been used';
  end if;

  if token_record.expires_at <= checked_at then
    raise exception 'Attendance QR has expired';
  end if;

  select * into student_profile
  from public.profiles
  where id = token_record.user_id
    and active = true
    and role in ('student', 'contributor');

  if not found then
    raise exception 'Student account is not active';
  end if;

  select * into target_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found or target_session.status in ('Draft', 'Cancelled') then
    raise exception 'Session is not available for check-in';
  end if;

  if checked_at < target_session.date - interval '30 minutes'
     or checked_at > target_session.end_date + interval '60 minutes' then
    raise exception 'Attendance check-in is outside the allowed time window';
  end if;

  insert into public.attendance (
    session_id,
    student_id,
    user_id,
    status,
    method,
    arrival,
    scanned_at,
    checked_in_at,
    reviewed_at,
    reviewed_by
  )
  values (
    p_session_id,
    student_profile.student_id,
    student_profile.id,
    'Approved',
    'QR',
    private.arrival_for(target_session.date, checked_at),
    checked_at,
    checked_at,
    checked_at,
    admin_id
  )
  returning * into saved_attendance;

  update private.attendance_qr_tokens
  set used_at = checked_at,
      used_by = admin_id
  where token_hash = hashed_token;

  return jsonb_build_object(
    'attendance', to_jsonb(saved_attendance),
    'student', jsonb_build_object(
      'id', student_profile.id,
      'student_id', student_profile.student_id,
      'name', student_profile.name,
      'year_level', student_profile.year_level
    )
  );
exception
  when unique_violation then
    raise exception 'Attendance already exists for this session';
end;
$$;

create or replace function public.moderate_attendance(
  p_attendance_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_attendance public.attendance%rowtype;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required';
  end if;

  if p_status not in ('Approved', 'Rejected') then
    raise exception 'Attendance decision must be Approved or Rejected';
  end if;

  if p_status = 'Rejected' and btrim(coalesce(p_note, '')) = '' then
    raise exception 'A rejection reason is required';
  end if;

  update public.attendance
  set status = p_status,
      correction_note = nullif(btrim(coalesce(p_note, '')), ''),
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = p_attendance_id
  returning * into saved_attendance;

  if not found then
    raise exception 'Attendance record not found';
  end if;

  return to_jsonb(saved_attendance);
end;
$$;

create or replace function public.moderate_note(
  p_note_id uuid,
  p_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_note public.notes%rowtype;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required';
  end if;

  if p_status not in ('Approved', 'Rejected') then
    raise exception 'Note decision must be Approved or Rejected';
  end if;

  if p_status = 'Rejected' and btrim(coalesce(p_reason, '')) = '' then
    raise exception 'A rejection reason is required';
  end if;

  update public.notes
  set status = p_status,
      rejection_reason = case
        when p_status = 'Rejected' then btrim(p_reason)
        else null
      end,
      moderated_at = now(),
      moderated_by = (select auth.uid())
  where id = p_note_id
  returning * into saved_note;

  if not found then
    raise exception 'Note not found';
  end if;

  return to_jsonb(saved_note);
end;
$$;

create or replace function public.adjust_points(
  p_user_id uuid,
  p_points integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_transaction public.point_transactions%rowtype;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required';
  end if;

  if p_points = 0 or btrim(coalesce(p_reason, '')) = '' then
    raise exception 'A non-zero value and reason are required';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Student profile not found';
  end if;

  insert into public.point_transactions (
    user_id,
    points,
    reason,
    related_type,
    created_by
  )
  values (
    p_user_id,
    p_points,
    btrim(p_reason),
    'Adjustment',
    (select auth.uid())
  )
  returning * into saved_transaction;

  insert into public.notifications (
    user_id,
    title,
    message,
    type,
    related_tab
  )
  values (
    p_user_id,
    'Points adjusted',
    concat(
      case when p_points > 0 then '+' else '' end,
      p_points,
      ' points: ',
      btrim(p_reason)
    ),
    'Points',
    'points-history'
  );

  return to_jsonb(saved_transaction);
end;
$$;

-- State-based point reconciliation. The ledger net follows current approval
-- state, so retries/re-approval cannot double-award.
create or replace function private.reconcile_attendance_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_points integer := 0;
  current_points integer := 0;
  point_delta integer;
begin
  if new.status = 'Approved' then
    select coalesce(max(points), 0) into expected_points
    from public.point_rules
    where code = 'attendance_approved'
      and active = true;
  end if;

  select coalesce(sum(points), 0)::integer into current_points
  from public.point_transactions
  where related_type = 'Attendance'
    and related_id = new.id;

  point_delta := expected_points - current_points;

  if point_delta <> 0 then
    insert into public.point_transactions (
      user_id,
      points,
      reason,
      related_type,
      related_id,
      created_by
    )
    values (
      new.user_id,
      point_delta,
      case
        when point_delta > 0 then 'Approved session attendance'
        else 'Attendance approval reversed'
      end,
      'Attendance',
      new.id,
      new.reviewed_by
    );
  end if;

  if new.status in ('Approved', 'Rejected')
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    insert into public.notifications (
      user_id,
      title,
      message,
      type,
      related_tab
    )
    values (
      new.user_id,
      case
        when new.status = 'Approved' then 'Attendance approved'
        else 'Attendance needs attention'
      end,
      case
        when new.status = 'Approved'
          then concat('Your attendance was approved. You earned ', expected_points, ' points.')
        else coalesce(new.correction_note, 'Your check-in was rejected by an administrator.')
      end,
      'Attendance',
      'attendance-history'
    );
  end if;

  return new;
end;
$$;

create or replace function private.reconcile_note_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_points integer := 0;
  current_points integer := 0;
  point_delta integer;
begin
  if new.status = 'Approved' then
    select coalesce(max(points), 0) into expected_points
    from public.point_rules
    where code = 'note_approved'
      and active = true;
  end if;

  select coalesce(sum(points), 0)::integer into current_points
  from public.point_transactions
  where related_type = 'Note'
    and related_id = new.id;

  point_delta := expected_points - current_points;

  if point_delta <> 0 then
    insert into public.point_transactions (
      user_id,
      points,
      reason,
      related_type,
      related_id,
      created_by
    )
    values (
      new.uploader_id,
      point_delta,
      case
        when point_delta > 0 then concat('Approved note: ', new.title)
        else concat('Note approval reversed: ', new.title)
      end,
      'Note',
      new.id,
      new.moderated_by
    );
  end if;

  if new.status in ('Approved', 'Rejected')
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    insert into public.notifications (
      user_id,
      title,
      message,
      type,
      related_tab
    )
    values (
      new.uploader_id,
      case
        when new.status = 'Approved' then 'Note approved'
        else 'Note changes requested'
      end,
      case
        when new.status = 'Approved'
          then concat(new.title, ' was approved. You earned ', expected_points, ' points.')
        else coalesce(new.rejection_reason, 'Please update the note before resubmitting.')
      end,
      'Notes',
      'my-notes'
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.reconcile_attendance_points()
  from public, anon, authenticated;
revoke execute on function private.reconcile_note_points()
  from public, anon, authenticated;

drop trigger if exists attendance_reconcile_points on public.attendance;
create trigger attendance_reconcile_points
after insert or update of status on public.attendance
for each row execute function private.reconcile_attendance_points();

drop trigger if exists notes_reconcile_points on public.notes;
create trigger notes_reconcile_points
after insert or update of status on public.notes
for each row execute function private.reconcile_note_points();

-- Sanitized leaderboard: never exposes student ID, email, or private profile fields.
create or replace function public.get_leaderboard(
  p_year_level text default null
)
returns table (
  user_id uuid,
  name text,
  year_level text,
  total_points bigint,
  rank bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_active_user() then
    raise exception 'Active authentication is required';
  end if;

  if p_year_level is not null
     and p_year_level not in ('Freshman', 'Sophomore', 'Junior', 'Senior') then
    raise exception 'Unsupported year level';
  end if;

  return query
  with totals as (
    select
      p.id as user_id,
      p.name,
      p.year_level,
      coalesce(sum(t.points), 0)::bigint as total_points
    from public.profiles p
    left join public.point_transactions t on t.user_id = p.id
    where p.active = true
      and p.role <> 'admin'
      and (p_year_level is null or p.year_level = p_year_level)
    group by p.id, p.name, p.year_level
  )
  select
    totals.user_id,
    totals.name,
    totals.year_level,
    totals.total_points,
    dense_rank() over (
      order by totals.total_points desc, totals.name asc
    )::bigint as rank
  from totals
  order by rank, name;
end;
$$;

-- Storage authorization helpers. The bucket itself should be created as private
-- with a 25 MB limit and MIME allow-list before enabling uploads.
create or replace function private.can_access_note_object(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.note_files f
    join public.notes n on n.id = f.note_id
    join public.profiles caller on caller.id = (select auth.uid())
    where f.storage_path = p_storage_path
      and caller.active = true
      and (
        n.uploader_id = caller.id
        or caller.role = 'admin'
        or (
          n.status = 'Approved'
          and caller.year_level = any (n.target_year_levels)
        )
      )
  );
$$;

create or replace function private.can_manage_note_object(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.note_files f
    join public.notes n on n.id = f.note_id
    join public.profiles caller on caller.id = (select auth.uid())
    where f.storage_path = p_storage_path
      and caller.active = true
      and (
        caller.role = 'admin'
        or (
          n.uploader_id = caller.id
          and n.status in ('Draft', 'Rejected')
        )
      )
  );
$$;

revoke execute on function private.can_access_note_object(text)
  from public, anon;
revoke execute on function private.can_manage_note_object(text)
  from public, anon;
grant execute on function private.can_access_note_object(text) to authenticated;
grant execute on function private.can_manage_note_object(text) to authenticated;

drop policy if exists tutorial_notes_upload_own_folder on storage.objects;
drop policy if exists tutorial_notes_read_authorized on storage.objects;
drop policy if exists tutorial_notes_delete_authorized on storage.objects;

create policy tutorial_notes_upload_own_folder
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tutorial-notes'
  and private.is_active_user()
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy tutorial_notes_read_authorized
on storage.objects for select
to authenticated
using (
  bucket_id = 'tutorial-notes'
  and private.can_access_note_object(name)
);

create policy tutorial_notes_delete_authorized
on storage.objects for delete
to authenticated
using (
  bucket_id = 'tutorial-notes'
  and private.can_manage_note_object(name)
);

-- Function execution is denied by default, then granted deliberately.
revoke execute on function public.update_my_profile(text, text, text, text, boolean)
  from public, anon, authenticated;
revoke execute on function public.set_rsvp(uuid, boolean)
  from public, anon, authenticated;
revoke execute on function public.set_session_attendance_code(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.check_in_with_code(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.issue_attendance_qr()
  from public, anon, authenticated;
revoke execute on function public.record_attendance_from_qr(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.moderate_attendance(uuid, text, text)
  from public, anon, authenticated;
revoke execute on function public.moderate_note(uuid, text, text)
  from public, anon, authenticated;
revoke execute on function public.adjust_points(uuid, integer, text)
  from public, anon, authenticated;
revoke execute on function public.get_leaderboard(text)
  from public, anon, authenticated;

grant execute on function public.update_my_profile(text, text, text, text, boolean)
  to authenticated;
grant execute on function public.set_rsvp(uuid, boolean)
  to authenticated;
grant execute on function public.set_session_attendance_code(uuid, text)
  to authenticated;
grant execute on function public.check_in_with_code(uuid, text)
  to authenticated;
grant execute on function public.issue_attendance_qr()
  to authenticated;
grant execute on function public.record_attendance_from_qr(uuid, text)
  to authenticated;
grant execute on function public.moderate_attendance(uuid, text, text)
  to authenticated;
grant execute on function public.moderate_note(uuid, text, text)
  to authenticated;
grant execute on function public.adjust_points(uuid, integer, text)
  to authenticated;
grant execute on function public.get_leaderboard(text)
  to authenticated;

commit;
