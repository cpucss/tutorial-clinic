-- Migration: 20260901144500_repair_storage_and_session_sync.sql
-- Description: Repair tutorial-notes storage bucket, add UPDATE storage policy, expand Realtime publications, and add server-authoritative notification triggers.

-- 1. Ensure private tutorial-notes bucket exists in storage.buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutorial-notes',
  'tutorial-notes',
  false,
  26214400, -- 25 MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-powerpoint'
  ]::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-powerpoint'
  ]::text[];

-- 2. Add UPDATE policy for storage.objects on tutorial-notes bucket (required for upsert / replace / retry)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tutorial_notes_update_own_folder'
  ) then
    create policy "tutorial_notes_update_own_folder"
      on storage.objects
      for update
      using (
        (bucket_id = 'tutorial-notes'::text)
        and private.is_active_user()
        and ((storage.foldername(name))[1] = (auth.uid())::text)
      )
      with check (
        (bucket_id = 'tutorial-notes'::text)
        and private.is_active_user()
        and ((storage.foldername(name))[1] = (auth.uid())::text)
      );
  end if;
end $$;

-- 3. Ensure all relevant tables are included in supabase_realtime publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notes') then
    alter publication supabase_realtime add table public.notes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'attendance') then
    alter publication supabase_realtime add table public.attendance;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'rsvps') then
    alter publication supabase_realtime add table public.rsvps;
  end if;
end $$;

-- 4. Server-authoritative session creation notification trigger
create or replace function private.notify_students_on_session_published()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  -- Only notify when session is published (not Draft) and start date is in the future
  if (NEW.status <> 'Draft') and (TG_OP = 'INSERT' or OLD.status = 'Draft') then
    insert into public.notifications (user_id, title, message, type, related_tab, created_at)
    select
      p.id as user_id,
      'New tutorial session: ' || NEW.title as title,
      'A new ' || coalesce(s.code, 'Tutorial Clinic') || ' session is scheduled for ' || to_char(NEW.date at time zone 'Asia/Manila', 'Mon DD, YYYY at HH12:MI AM') || ' at ' || NEW.venue || '.' as message,
      'Session' as type,
      'events' as related_tab,
      now() as created_at
    from public.profiles p
    left join public.subjects s on s.id = NEW.subject_id
    where p.role = 'student'
      and p.active = true
      and (
        NEW.year_levels is null
        or cardinality(NEW.year_levels) = 0
        or p.year_level = any(NEW.year_levels)
      )
      and not exists (
        select 1 from public.notifications n
        where n.user_id = p.id
          and n.title = ('New tutorial session: ' || NEW.title)
          and n.created_at > (now() - interval '1 hour')
      );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_students_on_session on public.sessions;
create trigger trg_notify_students_on_session
  after insert or update of status, title, date, venue, year_levels on public.sessions
  for each row
  execute function private.notify_students_on_session_published();

-- 5. Server-authoritative note moderation notification trigger
create or replace function private.notify_uploader_on_note_moderated()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if (NEW.status in ('Approved', 'Rejected')) and (OLD.status = 'Pending' or TG_OP = 'INSERT') then
    insert into public.notifications (user_id, title, message, type, related_tab, created_at)
    values (
      NEW.uploader_id,
      case when NEW.status = 'Approved' then 'Note approved' else 'Note needs revision' end,
      case
        when NEW.status = 'Approved' then 'Your study note "' || NEW.title || '" was approved and is now published in the library. +50 points awarded!'
        else 'Your study note "' || NEW.title || '" was rejected: ' || coalesce(NEW.rejection_reason, 'Please review moderator feedback.')
      end,
      'Note',
      'my-notes',
      now()
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_uploader_on_note on public.notes;
create trigger trg_notify_uploader_on_note
  after update of status on public.notes
  for each row
  execute function private.notify_uploader_on_note_moderated();
