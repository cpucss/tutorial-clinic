---
title: Phase 1 - Supabase Development Setup
status: blocked-by-phase-0
tags: [phase, setup, migrations]
---

# Phase 1 — Supabase development setup

## Objective

Make every backend change reproducible, reviewable, and testable outside production.

## Tasks

- [ ] Install the Supabase CLI as a pinned development tool or use the supported package runner.
- [ ] Run `supabase --help` and each needed subcommand's `--help`.
- [ ] Initialize/link the repository to the staging project without committing secrets.
- [ ] Confirm `.gitignore` excludes local secrets and generated temporary data.
- [ ] Pull or capture the current remote schema as the baseline.
- [ ] Create migrations through the CLI, not invented filenames.
- [ ] Add a `supabase/tests` structure for pgTAP RLS tests.
- [ ] Add staging-only synthetic accounts: Student A, Student B, inactive student, and admin.
- [ ] Document the local/staging reset workflow.

## Repository outputs

```text
supabase/
  config.toml
  migrations/
  tests/
    database/
```

Never commit access tokens, database passwords, service-role keys, or a populated `.env`.

## Verification

- [ ] A fresh checkout can reproduce the staging/local schema from migrations.
- [ ] The migration list matches the expected baseline.
- [ ] Test identities can sign in without using real student accounts.
- [ ] The frontend can point to staging through local environment values.

## Exit gate

One reviewed, non-production environment can be reset and rebuilt without manual undocumented SQL.

Next: [[07 Phase Playbooks/Phase 2 - Schema and Data Alignment]].
