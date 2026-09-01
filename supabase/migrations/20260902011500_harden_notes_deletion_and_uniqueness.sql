-- Migration: 20260902011500_harden_notes_deletion_and_uniqueness.sql
-- Description: Add deletion_requested_at column, unique constraint on note_files(note_id), and prepare_delete_my_note RPC.

-- 1. Add deletion_requested_at column to public.notes if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notes' and column_name = 'deletion_requested_at'
  ) then
    alter table public.notes add column deletion_requested_at timestamptz default null;
  end if;
end $$;

-- 2. Enforce 1:1 relationship between note and file metadata
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.note_files'::regclass and conname = 'note_files_note_id_unique'
  ) then
    alter table public.note_files add constraint note_files_note_id_unique unique (note_id);
  end if;
end $$;

-- 3. Create or replace prepare_delete_my_note RPC
create or replace function public.prepare_delete_my_note(
  p_note_id uuid
)
returns text[]
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid;
  v_is_active boolean;
  v_existing record;
  v_paths text[];
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'UNAUTHORIZED: Authentication required.' using errcode = 'P0001';
  end if;

  select active into v_is_active from public.profiles where id = v_uid;
  if v_is_active is distinct from true then
    raise exception 'UNAUTHORIZED: User account is inactive.' using errcode = 'P0001';
  end if;

  select id, uploader_id, status, deletion_requested_at into v_existing from public.notes where id = p_note_id;
  if not found then
    raise exception 'DRAFT_NOT_FOUND: The requested note does not exist or was already deleted.' using errcode = 'P0003';
  end if;

  if v_existing.uploader_id <> v_uid then
    raise exception 'UNAUTHORIZED: You do not have permission to delete this note.' using errcode = 'P0001';
  end if;

  if v_existing.status not in ('Draft', 'Rejected') and v_existing.deletion_requested_at is null then
    raise exception 'DRAFT_NOT_EDITABLE: Only Draft or Rejected notes can be deleted.' using errcode = 'P0004';
  end if;

  -- Mark note as deletion pending
  update public.notes
  set deletion_requested_at = coalesce(deletion_requested_at, now())
  where id = p_note_id;

  -- Collect storage paths
  select array_agg(storage_path) into v_paths
  from public.note_files
  where note_id = p_note_id;

  return coalesce(v_paths, array[]::text[]);
end;
$$;

revoke all on function public.prepare_delete_my_note(uuid) from public, anon;
grant execute on function public.prepare_delete_my_note(uuid) to authenticated;

-- 4. Alias get_deletable_note_paths to prepare_delete_my_note for backward compatibility
create or replace function public.get_deletable_note_paths(
  p_note_id uuid
)
returns text[]
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  return public.prepare_delete_my_note(p_note_id);
end;
$$;

revoke all on function public.get_deletable_note_paths(uuid) from public, anon;
grant execute on function public.get_deletable_note_paths(uuid) to authenticated;

-- 5. Strengthen Storage Delete Policy to allow deletion when deletion_requested_at is set
drop policy if exists "tutorial_notes_delete_authorized" on storage.objects;
create policy "tutorial_notes_delete_authorized" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tutorial-notes'
    and (
      private.is_admin()
      or (
        private.is_active_user()
        and (storage.foldername(name))[1] = (auth.uid())::text
        and (
          exists (
            select 1 from public.notes n
            where n.id::text = (storage.foldername(name))[2]
              and n.uploader_id = (select auth.uid())
              and (n.status in ('Draft', 'Rejected') or n.deletion_requested_at is not null)
          )
          or exists (
            select 1 from public.note_files f
            where f.storage_path = objects.name
              and f.uploader_id = (select auth.uid())
          )
        )
      )
    )
  );

-- 6. Update delete_my_note RPC
create or replace function public.delete_my_note(
  p_note_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid;
  v_is_active boolean;
  v_existing record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'UNAUTHORIZED: Authentication required.' using errcode = 'P0001';
  end if;

  select active into v_is_active from public.profiles where id = v_uid;
  if v_is_active is distinct from true then
    raise exception 'UNAUTHORIZED: User account is inactive.' using errcode = 'P0001';
  end if;

  select id, uploader_id, status, deletion_requested_at into v_existing from public.notes where id = p_note_id;
  if not found then
    raise exception 'DRAFT_NOT_FOUND: The requested note does not exist or was already deleted.' using errcode = 'P0003';
  end if;

  if v_existing.uploader_id <> v_uid then
    raise exception 'UNAUTHORIZED: You do not have permission to delete this note.' using errcode = 'P0001';
  end if;

  if v_existing.status not in ('Draft', 'Rejected') and v_existing.deletion_requested_at is null then
    raise exception 'DRAFT_NOT_EDITABLE: Only Draft or Rejected notes can be deleted.' using errcode = 'P0004';
  end if;

  -- Delete metadata rows
  delete from public.note_files where note_id = p_note_id;

  -- Delete note row
  delete from public.notes where id = p_note_id;

  return jsonb_build_object(
    'success', true,
    'note_id', p_note_id
  );
end;
$$;

revoke all on function public.delete_my_note(uuid) from public, anon;
grant execute on function public.delete_my_note(uuid) to authenticated;
