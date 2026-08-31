-- Validate existing constraints added with NOT VALID
alter table public.attendance validate constraint attendance_arrival_check;
alter table public.attendance validate constraint attendance_method_check;
alter table public.attendance validate constraint attendance_status_check;
alter table public.profiles validate constraint profiles_role_check;
alter table public.profiles validate constraint profiles_year_level_check;
alter table public.sessions validate constraint sessions_capacity_check;
alter table public.sessions validate constraint sessions_date_order_check;
alter table public.sessions validate constraint sessions_status_check;
alter table public.sessions validate constraint sessions_subject_id_fkey;
