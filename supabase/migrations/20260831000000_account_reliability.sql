-- Durable first-login reminder state and note metadata lookup optimization.

alter table public.profiles
  add column if not exists password_prompt_dismissed_at timestamptz;

create index if not exists note_files_note_created_idx
  on public.note_files (note_id, created_at desc);

create or replace function public.defer_password_change()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set password_prompt_dismissed_at = now()
  where id = v_user_id
    and active = true
    and must_change_password = true
    and account_setup_completed = false
  returning * into v_profile;

  if not found then
    select * into v_profile
    from public.profiles
    where id = v_user_id
      and active = true;
  end if;

  if v_profile.id is null then
    raise exception 'Active profile not found';
  end if;

  return v_profile;
end;
$$;

create or replace function public.complete_password_change()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set
    must_change_password = false,
    account_setup_completed = true,
    password_prompt_dismissed_at = null
  where id = v_user_id
    and active = true
  returning * into v_profile;

  if not found then
    raise exception 'Active profile not found';
  end if;

  return v_profile;
end;
$$;

revoke execute on function public.defer_password_change()
  from public, anon, authenticated;
revoke execute on function public.complete_password_change()
  from public, anon, authenticated;
grant execute on function public.defer_password_change() to authenticated;
grant execute on function public.complete_password_change() to authenticated;
