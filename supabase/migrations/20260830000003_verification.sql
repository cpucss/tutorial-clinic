-- Tutorial Clinic: post-migration verification
-- READ ONLY. Any returned row from a section marked MUST BE EMPTY is a release blocker.

-- ============================================================================
-- 1. Expected public application tables and RLS status
-- ============================================================================
-- Displays all 15 core public tables. Every table must exist and have rls_enabled = true.
with expected_public_tables(table_name) as (
  values
    ('profiles'),
    ('subjects'),
    ('sessions'),
    ('rsvps'),
    ('attendance'),
    ('notes'),
    ('note_files'),
    ('note_favorites'),
    ('point_rules'),
    ('point_transactions'),
    ('notifications'),
    ('announcements'),
    ('announcement_reads'),
    ('saved_sessions'),
    ('user_preferences')
)
select
  e.table_name,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as rls_forced,
  case
    when c.oid is null then 'MISSING TABLE (BLOCKER)'
    when not c.relrowsecurity then 'RLS DISABLED (BLOCKER)'
    else 'OK'
  end as status
from expected_public_tables e
left join pg_class c
  on c.relname = e.table_name
 and c.relnamespace = 'public'::regnamespace
 and c.relkind = 'r'
order by e.table_name;

-- MUST BE EMPTY: Missing public tables or public tables with RLS disabled.
with expected_public_tables(table_name) as (
  values
    ('profiles'), ('subjects'), ('sessions'), ('rsvps'), ('attendance'),
    ('notes'), ('note_files'), ('note_favorites'), ('point_rules'),
    ('point_transactions'), ('notifications'), ('announcements'),
    ('announcement_reads'), ('saved_sessions'), ('user_preferences')
)
select e.table_name as check_name, 'Table missing or RLS not enabled' as reason
from expected_public_tables e
left join pg_class c
  on c.relname = e.table_name
 and c.relnamespace = 'public'::regnamespace
 and c.relkind = 'r'
where c.oid is null or not c.relrowsecurity;

-- ============================================================================
-- 2. Private schema objects & isolation verification
-- ============================================================================
-- MUST BE EMPTY: Missing private tables or exposed table permissions.
with expected_private_tables(schema_name, table_name) as (
  values
    ('private', 'session_secrets'),
    ('private', 'attendance_qr_tokens')
)
select
  e.schema_name || '.' || e.table_name as check_name,
  'Private table is missing' as reason
from expected_private_tables e
left join pg_class c
  on c.relname = e.table_name
 and c.relnamespace = e.schema_name::regnamespace
 and c.relkind = 'r'
where c.oid is null
union all
select
  table_schema || '.' || table_name as check_name,
  'Unintended table grant to ' || grantee || ': ' || privilege_type as reason
from information_schema.role_table_grants
where table_schema = 'private'
  and grantee in ('anon', 'authenticated', 'PUBLIC');

-- MUST BE EMPTY: Plaintext attendance codes exposed in public.sessions.
select
  'sessions.attendance_code' as check_name,
  count(*) as problem_count
from public.sessions
where attendance_code is not null
  and btrim(attendance_code) <> ''
having count(*) > 0;

-- ============================================================================
-- 3. Installed RLS policies
-- ============================================================================
-- Inventory of active policies on public and storage schemas.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- MUST BE EMPTY: Permissive development policies on real application tables.
select schemaname, tablename, policyname, 'Permissive true policy detected' as reason
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'subjects', 'sessions', 'rsvps', 'attendance',
    'notes', 'note_files', 'note_favorites', 'point_rules',
    'point_transactions', 'notifications', 'announcements',
    'announcement_reads', 'saved_sessions', 'user_preferences'
  )
  and (
    btrim(qual) = 'true'
    or btrim(with_check) = 'true'
  )
  -- Legitimate public read policies for subjects/point_rules/sessions are scoped by condition (e.g. active = true, status <> 'Draft')
  and policyname not in ('subjects_select_active_anon', 'sessions_select_published_anon', 'point_rules_select_active_anon');

-- ============================================================================
-- 4. Function security: search_path and execution privileges
-- ============================================================================
-- MUST BE EMPTY: public/anon execute access to security-sensitive functions.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.proname in (
    'is_admin', 'is_active_user', 'set_rsvp', 'set_session_attendance_code',
    'check_in_with_code', 'issue_attendance_qr',
    'record_attendance_from_qr', 'moderate_attendance', 'moderate_note',
    'adjust_points', 'update_my_profile', 'get_leaderboard'
  )
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('public', p.oid, 'EXECUTE')
  )
order by n.nspname, p.proname;

-- MUST BE EMPTY: security-definer functions without an explicit search_path.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef
  and n.nspname in ('public', 'private')
  and not exists (
    select 1
    from unnest(coalesce(p.proconfig, array[]::text[])) as setting
    where setting like 'search_path=%'
  )
order by n.nspname, p.proname;

-- ============================================================================
-- 5. UUID integrity and legacy mapping checks
-- ============================================================================
-- MUST BE EMPTY: Unresolved legacy identity references or null user_ids.
select 'rsvps.user_id' as check_name, count(*) as problem_count
from public.rsvps where user_id is null
having count(*) > 0
union all
select 'attendance.user_id', count(*)
from public.attendance where user_id is null
having count(*) > 0
union all
select 'notes.uploader_id', count(*)
from public.notes where uploader_id is null
having count(*) > 0
union all
select 'point_transactions.user_id', count(*)
from public.point_transactions where user_id is null
having count(*) > 0
union all
select 'notifications.user_id', count(*)
from public.notifications where user_id is null
having count(*) > 0;

-- MUST BE EMPTY: Duplicate RSVP or attendance ownership rows.
select 'duplicate rsvps' as check_name, count(*) as problem_count
from (
  select session_id, user_id
  from public.rsvps
  group by session_id, user_id
  having count(*) > 1
) duplicate_rows
having count(*) > 0
union all
select 'duplicate attendance', count(*)
from (
  select session_id, user_id
  from public.attendance
  group by session_id, user_id
  having count(*) > 1
) duplicate_rows
having count(*) > 0;

-- MUST BE EMPTY: Orphaned session references.
select 'orphaned rsvps' as check_name, count(*) as problem_count
from public.rsvps r
left join public.sessions s on s.id = r.session_id
where s.id is null
having count(*) > 0
union all
select 'orphaned attendance', count(*)
from public.attendance a
left join public.sessions s on s.id = a.session_id
where s.id is null
having count(*) > 0;

-- ============================================================================
-- 6. Storage bucket configuration
-- ============================================================================
-- Displays the tutorial-notes bucket configuration.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'tutorial-notes';

-- MUST BE EMPTY: Missing tutorial-notes bucket or insecure bucket settings.
select
  'tutorial-notes bucket' as check_name,
  case
    when count(*) = 0 then 'Bucket tutorial-notes does not exist'
    when bool_or(public) then 'Bucket tutorial-notes must be private (public = false)'
    when bool_or(file_size_limit is null or file_size_limit > 26214400) then 'Bucket file size limit must be <= 25MB (26214400 bytes)'
    else null
  end as reason
from storage.buckets
where id = 'tutorial-notes'
group by id
having count(*) = 0 or bool_or(public) or bool_or(file_size_limit is null or file_size_limit > 26214400);

-- MUST BE EMPTY: Storage policies targeting obsolete or wrong bucket names.
select policyname, 'Policy targets incorrect bucket' as reason
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and qual like '%note-files%';

-- ============================================================================
-- 7. Constraint validation state
-- ============================================================================
-- MUST BE EMPTY: Any unvalidated constraints on public tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  con.convalidated
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not con.convalidated
order by c.relname, con.conname;

-- ============================================================================
-- 8. Table & Function Grants Review
-- ============================================================================
-- Table grants summary
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'private')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_schema, table_name, grantee, privilege_type;

-- Function grants summary
select routine_schema, routine_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema in ('public', 'private')
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
order by routine_schema, routine_name, grantee;
