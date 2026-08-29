---
title: Phase 0 - Baseline and Decisions
status: not-started
tags: [phase, audit, decisions]
---

# Phase 0 — baseline and decisions

## Objective

Create a safe, agreed baseline before changing schema, Auth, or policies.

## Prerequisites

- Access to the Supabase Dashboard.
- Permission to create a staging project or restore a backup.
- A maintainer who can approve product rules.

## Tasks

- [ ] Read [[01 Current System/Current State Audit]].
- [ ] Read [[01 Current System/Existing SQL Security Review]].
- [ ] Fill in [[06 Decisions/Open Decisions]].
- [ ] Decide staging versus local Supabase testing.
- [ ] Export/backup the current database.
- [ ] Run [[Assets/SQL/00-preflight-audit.sql]].
- [ ] Save the output with the implementation ticket.
- [ ] List unresolved profile, RSVP, attendance, duplicate, and subject mappings.
- [ ] Confirm current production users and whether known default passwords still exist.
- [ ] Freeze unrelated schema changes until Phase 3 is complete.

## Do not do yet

- Do not drop policies.
- Do not clear legacy IDs.
- Do not insert more users directly into `auth.users`.
- Do not migrate note files.

## Deliverables

- Approved decisions.
- Restorable backup.
- Preflight report.
- Data-cleanup list with an owner for every anomaly.

## Exit gate

- [ ] Backup restoration method is understood.
- [ ] Every preflight anomaly has an explicit resolution.
- [ ] Point values and attendance/RSVP rules are approved.
- [ ] Account provisioning method is approved.

Next: [[07 Phase Playbooks/Phase 1 - Supabase Development Setup]].
