-- Allow authenticated administrators to record a student's scanned QR.
-- The existing admin update policy is still responsible for moderation.
drop policy if exists "admins scan student attendance" on public.attendance;

create policy "admins scan student attendance"
on public.attendance
for insert
to authenticated
with check (
  public.is_admin()
  and status = 'Pending'
  and method = 'QR'
);
