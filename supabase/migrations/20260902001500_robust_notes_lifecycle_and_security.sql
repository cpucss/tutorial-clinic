-- Migration: 20260902001500_robust_notes_lifecycle_and_security.sql
-- Description: Implement robust server-authoritative note draft, attachment, and submission RPCs with strict RLS and domain errors.

-- 1. Create save_my_note_draft RPC
create or replace function public.save_my_note_draft(
  p_note_id uuid default null,
  p_title text default '',
  p_subject_id text default '',
  p_description text default '',
  p_tags text[] default array[]::text[]
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
  v_target_years text[];
  v_res record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'UNAUTHORIZED: Authentication required.' using errcode = 'P0001';
  end if;

  select active into v_is_active from public.profiles where id = v_uid;
  if v_is_active is distinct from true then
    raise exception 'UNAUTHORIZED: User account is inactive.' using errcode = 'P0001';
  end if;

  if trim(coalesce(p_title, '')) = '' then
    raise exception 'VALIDATION_FAILED: Note title is required.' using errcode = 'P0002';
  end if;

  if trim(coalesce(p_subject_id, '')) = '' then
    raise exception 'VALIDATION_FAILED: Subject selection is required.' using errcode = 'P0002';
  end if;

  -- Determine default target year levels from subject if available
  select case 
    when s.year_level is not null then array[s.year_level]::text[]
    else array['Freshman','Sophomore','Junior','Senior']::text[]
  end into v_target_years
  from public.subjects s
  where s.id = p_subject_id;

  if v_target_years is null then
    v_target_years := array['Freshman','Sophomore','Junior','Senior']::text[];
  end if;

  if p_note_id is not null then
    select id, uploader_id, status into v_existing from public.notes where id = p_note_id;
    if not found then
      raise exception 'DRAFT_NOT_FOUND: The requested note draft does not exist or was deleted.' using errcode = 'P0003';
    end if;

    if v_existing.uploader_id <> v_uid then
      raise exception 'UNAUTHORIZED: You do not have permission to edit this note.' using errcode = 'P0001';
    end if;

    if v_existing.status not in ('Draft', 'Rejected') then
      raise exception 'DRAFT_NOT_EDITABLE: This note is currently in review or approved and cannot be edited.' using errcode = 'P0004';
    end if;

    update public.notes
    set title = trim(p_title),
        subject_id = p_subject_id,
        description = coalesce(trim(p_description), ''),
        tags = coalesce(p_tags, array[]::text[]),
        target_year_levels = coalesce(v_target_years, target_year_levels),
        status = 'Draft',
        rejection_reason = null,
        moderated_at = null,
        moderated_by = null,
        updated_at = now()
    where id = p_note_id
    returning * into v_res;
  else
    insert into public.notes (
      id,
      uploader_id,
      title,
      subject_id,
      description,
      tags,
      target_year_levels,
      status,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_uid,
      trim(p_title),
      p_subject_id,
      coalesce(trim(p_description), ''),
      coalesce(p_tags, array[]::text[]),
      v_target_years,
      'Draft',
      now(),
      now()
    )
    returning * into v_res;
  end if;

  return to_jsonb(v_res);
end;
$$;

revoke all on function public.save_my_note_draft(uuid, text, text, text, text[]) from public, anon;
grant execute on function public.save_my_note_draft(uuid, text, text, text, text[]) to authenticated;

-- 2. Create submit_my_note RPC
create or replace function public.submit_my_note(
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
  v_file_count int;
  v_res record;
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
    raise exception 'DRAFT_NOT_FOUND: The requested note draft does not exist.' using errcode = 'P0003';
  end if;

  if v_existing.uploader_id <> v_uid then
    raise exception 'UNAUTHORIZED: You do not have permission to submit this note.' using errcode = 'P0001';
  end if;

  if v_existing.status = 'Pending' then
    -- Idempotent return if already submitted
    select * into v_res from public.notes where id = p_note_id;
    return to_jsonb(v_res);
  end if;

  if v_existing.status not in ('Draft', 'Rejected') then
    raise exception 'DRAFT_NOT_EDITABLE: Only Draft or Rejected notes can be submitted for review.' using errcode = 'P0004';
  end if;

  -- Validate that at least one valid attachment file exists for this note owned by the uploader
  select count(*) into v_file_count
  from public.note_files
  where note_id = p_note_id
    and uploader_id = v_uid
    and storage_path like (v_uid::text || '/' || p_note_id::text || '/%');

  if v_file_count = 0 then
    raise exception 'NO_ATTACHMENT: Please attach a study file before submitting for review.' using errcode = 'P0005';
  end if;

  update public.notes
  set status = 'Pending',
      rejection_reason = null,
      moderated_at = null,
      moderated_by = null,
      updated_at = now()
  where id = p_note_id
  returning * into v_res;

  return to_jsonb(v_res);
end;
$$;

revoke all on function public.submit_my_note(uuid) from public, anon;
grant execute on function public.submit_my_note(uuid) to authenticated;

-- 3. Strengthen note_files RLS policies
drop policy if exists "note_files_select_visible_note" on public.note_files;
drop policy if exists "note_files_select_authorized" on public.note_files;

create policy "note_files_select_authorized" on public.note_files
  for select to authenticated
  using (
    private.is_admin()
    or (
      uploader_id = (select auth.uid())
      and private.is_active_user()
    )
    or (
      exists (
        select 1 from public.notes n
        join public.profiles p on p.id = (select auth.uid())
        where n.id = note_files.note_id
          and n.status = 'Approved'
          and p.active = true
          and (
            n.target_year_levels is null
            or cardinality(n.target_year_levels) = 0
            or p.year_level = any (n.target_year_levels)
          )
      )
    )
  );

-- Ensure update on note_files is restricted
drop policy if exists "note_files_update_authorized" on public.note_files;
create policy "note_files_update_authorized" on public.note_files
  for update to authenticated
  using (
    (uploader_id = (select auth.uid()))
    and private.is_active_user()
    and exists (
      select 1 from public.notes n
      where n.id = note_files.note_id
        and n.uploader_id = (select auth.uid())
        and n.status in ('Draft', 'Rejected')
    )
  )
  with check (
    (uploader_id = (select auth.uid()))
    and private.is_active_user()
    and exists (
      select 1 from public.notes n
      where n.id = note_files.note_id
        and n.uploader_id = (select auth.uid())
        and n.status in ('Draft', 'Rejected')
    )
  );

-- 4. Storage update policy constraint
drop policy if exists "tutorial_notes_update_own_folder" on storage.objects;
create policy "tutorial_notes_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tutorial-notes'
    and private.is_active_user()
    and (storage.foldername(name))[1] = (auth.uid())::text
    and exists (
      select 1 from public.notes n
      where n.id::text = (storage.foldername(name))[2]
        and n.uploader_id = (select auth.uid())
        and n.status in ('Draft', 'Rejected')
    )
  )
  with check (
    bucket_id = 'tutorial-notes'
    and private.is_active_user()
    and (storage.foldername(name))[1] = (auth.uid())::text
  );
