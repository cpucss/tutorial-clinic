-- Migration: 20260901153000_refine_session_notification_rules.sql
-- Description: Ensure session notifications are only delivered for active published sessions (not Draft, Cancelled, or Completed, and end_date in future).

create or replace function private.notify_students_on_session_published()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  -- Only notify when session is active and published (not Draft, Cancelled, or Completed, and not expired)
  if (NEW.status not in ('Draft', 'Cancelled', 'Completed'))
     and (NEW.end_date > now())
     and (TG_OP = 'INSERT' or OLD.status = 'Draft') then
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
      and p.year_level is not null
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
