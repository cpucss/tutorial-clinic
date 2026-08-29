---
title: Existing SQL Security Review
status: action-required
tags: [security, sql, rls]
---

# Existing SQL security review

> [!danger] Do not use the supplied permissive policies with real data
> `FOR ALL USING (true)` allows any caller with the relevant table grant to read and modify every row. RLS is technically enabled but provides no isolation.

## Findings

| Severity | Finding | Required correction |
|---|---|---|
| Critical | Sessions, RSVPs, and attendance use `FOR ALL USING (true)` | Replace with operation-specific policies and explicit grants |
| Critical | `profiles` is readable by everyone | Restrict full profiles to the owner/admin; expose only a sanitized leaderboard result |
| Critical | SQL directly inserts known-password accounts into `auth.users` | Provision through Dashboard or a server-only admin function using `auth.admin.createUser` |
| Critical | Default passwords are derived from student IDs | Prefer invitation/reset links or random one-time passwords; enforce change server-side |
| High | `public.is_admin()` is `SECURITY DEFINER` without a fixed `search_path` or execute revocation | Move to a hardened helper, set `search_path = ''`, fully qualify objects, and control execution |
| High | RSVP and attendance store `student_id text` without a foreign key to Auth | Add `user_id uuid references profiles(id)` and backfill deliberately |
| High | Attendance insert policy lets an admin submit any `student_id` and relies on client logic | Use an atomic QR-check-in RPC that validates the opaque token, active user, session window, and duplicate |
| High | Attendance codes are returned to the client with sessions | Move hashes into a private table and verify codes server-side |
| Medium | Required status/domain checks are missing | Add constraints for role, year, session status, attendance status/method/arrival, and note status |
| Medium | Capacity is enforced only in React | Lock the session and count RSVPs within a database transaction |
| Medium | Profile schema lacks fields already read by the frontend | Add `year_level` and the remaining profile fields |
| Medium | Existing table creation order can reference `profiles` before it exists | Use ordered, versioned migrations |

## Why direct `auth.users` inserts should stop

The Auth schema is managed by Supabase. Creating users through the supported Admin API runs the expected Auth behavior and must happen only on a trusted server because the secret/service-role key bypasses RLS. The browser must never receive that key. See [Supabase `auth.admin.createUser`](https://supabase.com/docs/reference/javascript/auth-admin-createuser) and [User management](https://supabase.com/docs/guides/auth/managing-user-data).

## Safer account provisioning

Recommended order:

1. Disable open sign-up if students are pre-provisioned.
2. Create accounts from the Supabase Dashboard for a small roster, or a protected Edge Function/batch script for bulk provisioning.
3. Create a `profiles` row from an Auth trigger. The trigger may copy student ID/name/year metadata, but it must always hard-code the initial role to `student`.
4. Assign admin roles in a separate audited server-side operation.
5. Send an invitation or password-reset link. If a temporary password is unavoidable, generate a random one and store `must_change_password = true` in the profile.

Never use `raw_user_meta_data` or client-supplied metadata for authorization. It is user-editable. Authorization data belongs in protected database rows or trusted app metadata, with RLS enforcing the outcome.

## Migration behavior

The included schema alignment adds `user_id` alongside the legacy text column, backfills UUIDs by matching either `profiles.id::text` or `profiles.student_id`, and stops if unresolved rows remain. It does not silently discard data.

Run [[Assets/SQL/00-preflight-audit.sql]] first and save its results with the release ticket.
