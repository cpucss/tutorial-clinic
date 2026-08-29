---
title: Phase 8 - Release and Operations
status: blocked-by-phase-7
tags: [phase, release, operations]
---

# Phase 8 — release and operations

## Objective

Rehearse, launch, observe, and clean up safely.

## Tasks

- [ ] Complete a staging rehearsal from backup to finished verification.
- [ ] Follow [[05 Rollout and Testing/Execution Runbook]].
- [ ] Run [[05 Rollout and Testing/Test Matrix]].
- [ ] Review [[05 Rollout and Testing/Risk Register]].
- [ ] Coordinate database security cutover and compatible frontend deployment.
- [ ] Run student/admin smoke tests immediately after release.
- [ ] Monitor Auth, Data API, database, Function, Storage, and client sync errors.
- [ ] Record migration IDs, commit, deployment, and rollback point.
- [ ] Observe at least one stable release cycle.
- [ ] Generate a later cleanup migration for legacy columns/policies/code.
- [ ] Remove obsolete demo state and QR code only after evidence supports it.

## Production gate

- [ ] Staging rehearsal passed.
- [ ] Backup is recent and restorable.
- [ ] Rollback build is available.
- [ ] RLS deny tests pass.
- [ ] No secret exists in the frontend bundle.
- [ ] Core cross-device and concurrency tests pass.
- [ ] Responsible operators are available during the change window.

## Completion gate

Production remains stable through the observation period, monitoring is active, and the cleanup migration removes the temporary legacy compatibility layer without data loss.
