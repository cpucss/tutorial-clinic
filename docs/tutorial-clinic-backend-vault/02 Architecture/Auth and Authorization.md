---
title: Auth and Authorization
status: recommended
tags: [auth, rls, security]
---

# Auth and authorization

## Authentication flow

1. Normalize the entered student ID and convert it to the internal email address.
2. Call `signInWithPassword`.
3. Fetch exactly one `profiles` row where `id = auth user id`.
4. Reject the application session if the profile is missing or inactive.
5. Build the domain user with `id = profile.id`. Do not create a second local identity.
6. Restore this flow on application start and subscribe to Auth state changes.
7. Clear account-scoped caches on sign-out.

## Role rule

The database profile is the source of the application role. Never grant admin behavior because:

- a student ID ends in `-ADMIN`;
- a route is hidden or visible;
- a client state value says `admin`;
- user-editable Auth metadata says `admin`.

RLS and hardened RPC functions must independently verify the current Auth UUID and protected profile role.

## Active-account rule

Every sensitive policy/function should require `profiles.active = true`. Marking a profile inactive does not instantly invalidate a JWT already issued. For an immediate lockout, revoke/delete Auth sessions or the Auth user through an admin operation and keep access-token expiry appropriately short for the risk. See [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data).

## RLS standards

For each exposed table:

1. Enable RLS.
2. Revoke inherited/default access.
3. Grant only the operations the client needs.
4. Create one policy per operation and name its target role with `TO`.
5. Pair ownership with `(select auth.uid()) = user_id`.
6. Give updates both `USING` and `WITH CHECK`.
7. Test successful and forbidden actions for anonymous, student A, student B, inactive student, and admin.

`TO authenticated` proves authentication, not authorization. It must be combined with ownership or a protected admin check.

## `SECURITY DEFINER` rules

Use the default `SECURITY INVOKER` unless a function intentionally needs to cross RLS for an atomic workflow. For every definer function:

- set `search_path = ''`;
- fully qualify every relation/function;
- validate `auth.uid()` inside the function;
- keep private helpers in a non-exposed schema;
- revoke execute from `PUBLIC`, `anon`, and `authenticated` first;
- grant execute back only to the required role;
- return the minimum safe data;
- add allow/deny tests.

See [Supabase database functions](https://supabase.com/docs/guides/database/functions).

## Browser keys

A Supabase publishable key is designed for the frontend when paired with RLS and minimum grants. A secret/service-role key bypasses RLS and must only exist in trusted server/Edge Function secrets. Do not prefix a secret key with `VITE_`.

## Account provisioning recommendation

For the existing pre-provisioned model, use Dashboard account creation initially. For bulk operations, add one JWT-protected admin Edge Function that:

- verifies the caller is an active admin;
- validates student ID/name/year;
- calls `auth.admin.createUser` with a server-only secret client;
- never accepts a requested role from the browser;
- writes an audit record;
- sends an invite/reset path rather than exposing a predictable password.

Self-registration should remain disabled until student eligibility and duplicate identity rules are formally decided.
