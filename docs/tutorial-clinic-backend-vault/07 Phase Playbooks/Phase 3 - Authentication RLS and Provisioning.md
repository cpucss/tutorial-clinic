---
title: Phase 3 - Authentication RLS and Provisioning
status: blocked-by-phase-2
tags: [phase, auth, rls]
---

# Phase 3 — authentication, RLS, and provisioning

## Objective

Replace permissive access with least privilege and establish a supported account lifecycle.

## Tasks

- [ ] Adapt/apply [[Assets/SQL/02-security-and-rpc.sql]] in staging.
- [ ] Remove `FOR ALL USING (true)` policies.
- [ ] Reset grants per table.
- [ ] Enable RLS on every exposed application table.
- [ ] Create owner/admin/published-data policies.
- [ ] Harden every `SECURITY DEFINER` function.
- [ ] Add the Auth profile trigger; test failure behavior.
- [ ] Disable open sign-up if using pre-provisioned accounts.
- [ ] Stop direct `auth.users` inserts.
- [ ] Establish Dashboard or server-only Admin API provisioning.
- [ ] Replace predictable default passwords with invite/reset or random temporary credentials.
- [ ] Add pgTAP allow/deny tests for each table.

## Required identities

Run every policy test as:

- anonymous;
- Student A;
- Student B;
- inactive student;
- admin.

## Verification

- [ ] Student A cannot read Student B's profile, RSVP, attendance, points, drafts, files, preferences, or notifications.
- [ ] Admin-looking ID suffix does not grant admin behavior.
- [ ] Inactive users fail sensitive RPCs.
- [ ] Admin can perform only intended management actions.
- [ ] Anonymous access matches the approved event/points rules.
- [ ] Functions are not executable by `PUBLIC` unless deliberately granted.
- [ ] Database advisors show no unresolved critical security findings.

## Exit gate

The deny tests are as complete as the allow tests, and no real-data table relies on a permissive policy.

Next: [[07 Phase Playbooks/Phase 4 - Sessions RSVP and Attendance]].
