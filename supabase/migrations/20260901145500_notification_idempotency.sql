-- Migration: 20260901145500_notification_idempotency.sql
-- Description: Add related_id column to public.notifications and enforce exact session-ID idempotency in notification triggers.

-- 1. Add related_id to public.notifications if not exists
alter table public.notifications
  add column if not exists related_id text;

create index if not exists idx_notifications_user_related
  on public.notifications(user_id, related_id);

-- 2. Exact session-ID idempotency trigger for published sessions
create or replace function private.notify_students_on_session_published()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  -- Only notify when session is published (status <> 'Draft')
  if (NEW.status <> 'Draft') and (TG_OP = 'INSERT' or OLD.status = 'Draft') then
    insert into public.notifications (user_id, title, message, type, related_tab, related_id, created_at)
    select
      p.id as user_id,
      'New tutorial session: ' || NEW.title as title,
      'A new ' || coalesce(s.code, 'Tutorial Clinic') || ' session is scheduled for ' || to_char(NEW.date at time zone 'Asia/Manila', 'Mon DD, YYYY at HH12:MI AM') || ' at ' || NEW.venue || '.' as message,
      'Session' as type,
      'events' as related_tab,
      NEW.id::text as related_id,
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
          and n.related_id = NEW.id::text
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

-- 3. Note moderation notification trigger with related_id
create or replace function private.notify_uploader_on_note_moderated()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if (NEW.status in ('Approved', 'Rejected')) and (OLD.status = 'Pending' or TG_OP = 'INSERT') then
    insert into public.notifications (user_id, title, message, type, related_tab, related_id, created_at)
    values (
      NEW.uploader_id,
      case when NEW.status = 'Approved' then 'Note approved' else 'Note needs revision' end,
      case
        when NEW.status = 'Approved' then 'Your study note "' || NEW.title || '" was approved and is now published in the library. +50 points awarded!'
        else 'Your study note "' || NEW.title || '" was rejected: ' || coalesce(NEW.rejection_reason, 'Please review moderator feedback.')
      end,
      'Note',
      'my-notes',
      NEW.id::text,
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
