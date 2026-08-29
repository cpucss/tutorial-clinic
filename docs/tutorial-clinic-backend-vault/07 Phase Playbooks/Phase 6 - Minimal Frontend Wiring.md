---
title: Phase 6 - Minimal Frontend Wiring
status: developed-alongside-phases-3-to-5
tags: [phase, frontend, integration]
---

# Phase 6 — minimal frontend wiring

## Objective

Connect the finalized UI to the backend without redesigning it.

This work happens incrementally alongside Phases 3–5, then receives a final integration pass here.

## Required changes only

- [ ] Restore Auth/session on app startup.
- [ ] Subscribe to Auth changes and clear account caches on sign-out.
- [ ] Use profile/Auth UUID as the only user ID.
- [ ] Resolve role only from the protected profile.
- [ ] Make durable context actions asynchronous.
- [ ] Await server confirmation before durable success toasts.
- [ ] Replace direct sensitive table writes with RPC calls.
- [ ] Replace local server collections with repository data.
- [ ] Reconcile provisional/offline state with returned rows.
- [ ] Map backend errors to existing feedback components.
- [ ] Generate and use typed database definitions.

## Preserve

- page layouts;
- navigation;
- visual design/tokens;
- existing responsive behavior;
- accessibility behaviors;
- component names where practical;
- mobile audit routes.

## Verification

```powershell
npm run typecheck
npm test
npm run test:mobile
npm run build
```

Also verify:

- [ ] No UI success after a rejected backend write.
- [ ] Refresh restores the correct user.
- [ ] Two tabs agree after sign-out.
- [ ] Two devices show the same server state.
- [ ] No old demo seed data mixes with authenticated production data.

## Exit gate

The existing frontend operates against Supabase with no local source-of-truth conflicts and no visual regression.

Next: [[07 Phase Playbooks/Phase 7 - PWA and Offline Reliability]].
