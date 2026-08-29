-- Tutorial Clinic: post-migration verification
-- Read-only. Any returned row from a section marked MUST BE EMPTY is a release blocker.

-- 1. RLS status on public application tables.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles', 'subjects', 'sessions', 'session_rsvps', 'attendance',
    'notes', 'note_files', 'note_reviews', 'points_ledger',
    'notifications', 'attendance_qr_tokens'
  )
order by c.relname;

-- 2. Installed policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 3. MUST BE EMPTY: public/anon execute access to security-sensitive functions.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.proname in (
    'is_admin', 'set_rsvp', 'set_session_attendance_code',
    'check_in_with_code', 'issue_attendance_qr',
    'record_attendance_from_qr', 'moderate_note', 'adjust_points'
  )
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('public', p.oid, 'EXECUTE')
  )
order by n.nspname, p.proname;

-- 4. MUST BE EMPTY: security-definer functions without an explicit search_path.
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

-- 5. MUST BE EMPTY: unresolved legacy identity references.
select 'session_rsvps.user_id' as check_name, count(*) as problem_count
from public.session_rsvps where user_id is null
having count(*) > 0
union all
select 'attendance.user_id', count(*)
from public.attendance where user_id is null
having count(*) > 0;

-- 6. MUST BE EMPTY: duplicate RSVP or attendance ownership rows.
select 'duplicate session_rsvps' as check_name, count(*) as problem_count
from (
  select session_id, user_id
  from public.session_rsvps
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

-- 7. Table grants. Review against the intended matrix in the runbook.
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'private')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_schema, table_name, grantee, privilege_type;

-- 8. Function grants. Review for minimum access.
select routine_schema, routine_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema in ('public', 'private')
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
order by routine_schema, routine_name, grantee;

-- 9. Constraint validation state. Any false value requires data cleanup and VALIDATE CONSTRAINT.
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

-- 10. Private Storage bucket configuration.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'note-files';

-- 11. Manual authenticated checks still required:
-- - student can read own private records, never another student's;
-- - student cannot create sessions, moderate notes, or award points;
-- - admin can execute the approved workflows;
-- - repeated RSVP/check-in/moderation requests are idempotent;
-- - an expired or reused QR token is rejected;
-- - a note file is inaccessible unless its note is visible to the caller.

