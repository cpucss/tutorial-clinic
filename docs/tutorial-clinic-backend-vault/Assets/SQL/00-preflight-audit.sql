-- Tutorial Clinic preflight audit
-- READ ONLY. Run this before any migration and save the result.

select
  current_database() as database_name,
  current_user as executed_by,
  current_setting('server_version') as postgres_version,
  now() as audited_at;

-- Expected core objects.
select
  to_regclass('public.profiles') as profiles,
  to_regclass('public.sessions') as sessions,
  to_regclass('public.rsvps') as rsvps,
  to_regclass('public.attendance') as attendance;

-- Current application columns.
select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'sessions', 'rsvps', 'attendance')
order by table_name, ordinal_position;

-- Current policies. Qualifiers containing a literal true require review.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'sessions', 'rsvps', 'attendance')
order by tablename, policyname;

-- Current Data API role grants.
select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'sessions', 'rsvps', 'attendance')
  and grantee in ('anon', 'authenticated', 'service_role')
group by table_name, grantee
order by table_name, grantee;

-- Profile/Auth integrity.
select count(*) as profiles_without_auth_user
from public.profiles p
left join auth.users u on u.id = p.id
where u.id is null;

select count(*) as auth_users_without_profile
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

select role, count(*) as profile_count
from public.profiles
group by role
order by role;

-- Legacy RSVP IDs that cannot be mapped safely to a profile.
select
  r.id,
  r.session_id,
  r.student_id as unresolved_student_id
from public.rsvps r
left join public.profiles p
  on p.id::text = r.student_id
  or upper(p.student_id) = upper(r.student_id)
where p.id is null
order by r.created_at nulls last, r.id;

-- Legacy attendance IDs that cannot be mapped safely to a profile.
select
  a.id,
  a.session_id,
  a.student_id as unresolved_student_id
from public.attendance a
left join public.profiles p
  on p.id::text = a.student_id
  or upper(p.student_id) = upper(a.student_id)
where p.id is null
order by a.scanned_at nulls last, a.id;

-- Duplicate rows after canonical UUID mapping.
with mapped as (
  select r.id, r.session_id, p.id as user_id
  from public.rsvps r
  join public.profiles p
    on p.id::text = r.student_id
    or upper(p.student_id) = upper(r.student_id)
)
select session_id, user_id, count(*) as duplicate_count
from mapped
group by session_id, user_id
having count(*) > 1;

with mapped as (
  select a.id, a.session_id, p.id as user_id
  from public.attendance a
  join public.profiles p
    on p.id::text = a.student_id
    or upper(p.student_id) = upper(a.student_id)
)
select session_id, user_id, count(*) as duplicate_count
from mapped
group by session_id, user_id
having count(*) > 1;

-- Orphaned session references.
select 'rsvps' as source, r.id, r.session_id
from public.rsvps r
left join public.sessions s on s.id = r.session_id
where s.id is null
union all
select 'attendance' as source, a.id, a.session_id
from public.attendance a
left join public.sessions s on s.id = a.session_id
where s.id is null;

-- Session data quality.
select id, title, date, end_date, capacity, subject_id
from public.sessions
where title is null
   or btrim(title) = ''
   or subject_id is null
   or btrim(subject_id) = ''
   or date is null
   or end_date is null
   or end_date <= date
   or capacity is null
   or capacity < 1;

-- Plaintext attendance-code exposure inventory.
select
  count(*) filter (where attendance_code is not null and btrim(attendance_code) <> '') as sessions_with_plaintext_code,
  count(*) as total_sessions
from public.sessions;

-- Existing functions that use elevated privileges.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as configuration
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.prosecdef
order by n.nspname, p.proname;

-- Row counts for reconciliation after migration.
select 'profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'sessions', count(*) from public.sessions
union all
select 'rsvps', count(*) from public.rsvps
union all
select 'attendance', count(*) from public.attendance;
