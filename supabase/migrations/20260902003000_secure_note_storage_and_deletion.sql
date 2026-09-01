-- Migration: 20260902003000_secure_note_storage_and_deletion.sql
-- Description: Strengthen storage object upload/delete policies and implement server-authoritative delete_my_note RPC.

-- 1. Strengthen Storage Upload Policy for tutorial-notes
drop policy if exists "tutorial_notes_upload_own_folder" on storage.objects;
create policy "tutorial_notes_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tutorial-notes'
    and private.is_active_user()
    and (storage.foldername(name))[1] = (auth.uid())::text
    and (
      (storage.foldername(name))[2] is null
      or exists (
        select 1 from public.notes n
        where n.id::text = (storage.foldername(name))[2]
          and n.uploader_id = (select auth.uid())
          and n.status in ('Draft', 'Rejected')
      )
    )
  );

-- 2. Strengthen Storage Delete Policy for tutorial-notes
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
          (storage.foldername(name))[2] is null
          or exists (
            select 1 from public.notes n
            where n.id::text = (storage.foldername(name))[2]
              and n.uploader_id = (select auth.uid())
              and n.status in ('Draft', 'Rejected')
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

-- 3. Create delete_my_note RPC
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

  select id, uploader_id, status into v_existing from public.notes where id = p_note_id;
  if not found then
    raise exception 'DRAFT_NOT_FOUND: The requested note does not exist or was already deleted.' using errcode = 'P0003';
  end if;

  if v_existing.uploader_id <> v_uid then
    raise exception 'UNAUTHORIZED: You do not have permission to delete this note.' using errcode = 'P0001';
  end if;

  if v_existing.status not in ('Draft', 'Rejected') then
    raise exception 'DRAFT_NOT_EDITABLE: Only Draft or Rejected notes can be deleted.' using errcode = 'P0004';
  end if;

  -- Collect associated file storage paths
  select array_agg(storage_path) into v_paths
  from public.note_files
  where note_id = p_note_id;

  -- Delete metadata rows
  delete from public.note_files where note_id = p_note_id;

  -- Delete note row
  delete from public.notes where id = p_note_id;

  return jsonb_build_object(
    'success', true,
    'note_id', p_note_id,
    'storage_paths', coalesce(v_paths, array[]::text[])
  );
end;
$$;

revoke all on function public.delete_my_note(uuid) from public, anon;
grant execute on function public.delete_my_note(uuid) to authenticated;
