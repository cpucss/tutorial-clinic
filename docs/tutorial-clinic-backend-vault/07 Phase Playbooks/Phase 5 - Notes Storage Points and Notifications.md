---
title: Phase 5 - Notes Storage Points and Notifications
status: blocked-by-phase-4
tags: [phase, notes, storage, points]
---

# Phase 5 — notes, Storage, points, and notifications

## Objective

Move content contribution and engagement features from local state to protected backend services.

## Tasks

- [ ] Create/configure the private `tutorial-notes` bucket.
- [ ] Set 25 MB and MIME allow-list rules.
- [ ] Implement draft → file upload → metadata → submit flow.
- [ ] Add owner/admin/approved-audience Storage policies.
- [ ] Implement `moderate_note`.
- [ ] Reconcile note points in the same transaction.
- [ ] Implement favourites.
- [ ] Read points from the append-only ledger.
- [ ] Implement sanitized `get_leaderboard`.
- [ ] Persist notifications, announcements/read receipts, saved sessions, and preferences.
- [ ] Add orphan-file cleanup procedure.

## Minimal frontend files likely touched

- existing note pages/editor/preview modal;
- new Supabase note/storage repository;
- points and leaderboard repositories;
- notification/announcement/preferences repositories.

The visual components stay intact; replace local actions with awaited mutations.

## Required tests

- [ ] Owner can view pending note; another student cannot.
- [ ] Admin can review every pending note.
- [ ] Approved note follows target year visibility.
- [ ] Disallowed file types and oversize files fail.
- [ ] Storage path cannot impersonate another user.
- [ ] Approval awards 60 once; rejection returns net to zero.
- [ ] Leaderboard exposes no student ID/email/private profile.
- [ ] Notifications/read state persist across devices.

## Exit gate

All shared content and points features persist across devices, with private files and tested audience rules.

Next: [[07 Phase Playbooks/Phase 6 - Minimal Frontend Wiring]].
