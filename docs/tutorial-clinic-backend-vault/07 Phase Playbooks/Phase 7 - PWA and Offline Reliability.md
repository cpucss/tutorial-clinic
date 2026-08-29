---
title: Phase 7 - PWA and Offline Reliability
status: blocked-by-phase-6
tags: [phase, pwa, offline]
---

# Phase 7 — PWA and offline reliability

## Objective

Complete installability and offline behavior after backend contracts are stable.

## Tasks

- [ ] Follow [[03 Implementation/PWA Implementation]].
- [ ] Add real favicon, Apple touch icon, standard, and maskable icons.
- [ ] Align manifest/scope/theme/start URLs with deployment.
- [ ] Add prompted service-worker updates.
- [ ] Add Settings/Help install action and iOS guidance.
- [ ] Use one connectivity/sync status component.
- [ ] Partition/clear IndexedDB by Auth UUID.
- [ ] Keep private Supabase/API responses out of Workbox caches.
- [ ] Keep sensitive admin/file/attendance actions online-only.
- [ ] Test the production build and installed app.

## Exit gate

The installed app opens its shell and labeled cached data offline, never reports an unconfirmed change as durable, and applies updates only with user consent.

Next: [[07 Phase Playbooks/Phase 8 - Release and Operations]].
