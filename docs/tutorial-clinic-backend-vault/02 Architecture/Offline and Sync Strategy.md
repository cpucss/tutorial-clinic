---
title: Offline and Sync Strategy
status: recommended
tags: [offline, indexeddb, sync]
---

# Offline and sync strategy

## Principle

Offline support improves availability; it does not move trust to the device. Every replayed mutation is authenticated and revalidated by RLS/RPC when connectivity returns.

## What may work offline

| Capability | Offline behavior |
|---|---|
| Browse recently loaded sessions/subjects | Read cached snapshot with a visible “may be outdated” state |
| View the most recently issued QR | Display until its server-provided expiry; scanning still requires the admin device to reach the backend |
| Save personal schedule/preferences | Apply locally and queue a deterministic upsert |
| RSVP | Queue “desired joined state”; mark as pending until server confirms capacity |
| Attendance code check-in | Prefer online only because code, time window, and duplicate checks are authoritative |
| Upload note files | Queue metadata locally; begin file upload only online |
| Admin moderation/QR check-in | Online only for Phase 1 |

## Fix the current outbox contract

Each mutation needs:

```text
mutationId
userId                 // Auth UUID
entityType
entityId
operation              // set/upsert/delete; never ambiguous toggle
payload
createdAt
retryCount
status
baseVersion (optional)
```

The server operation must be safe to replay. RSVP should send:

```json
{
  "sessionId": "uuid",
  "joined": true
}
```

It must not call a toggle. If the first response is lost, a retry produces the same final state.

## Reconciliation rules

1. Apply optimistic UI only for reversible, low-risk changes.
2. Label the item as pending.
3. Send the mutation.
4. Replace provisional data with the row/function result.
5. On a permanent conflict (full session, closed RSVP, forbidden user), roll back and explain the server decision.
6. On a network failure, keep the mutation queued with capped exponential backoff.
7. On sign-out, stop sync immediately and partition/clear account-specific queues.

## Conflict policy

- Server wins for capacity, status, role, points, attendance, note moderation, and session lifecycle.
- Latest accepted user intent wins for preferences and saved sessions.
- A note draft may use version numbers or `updated_at` optimistic concurrency to avoid overwriting edits from another device.

## Sync observability

Expose a compact status in the UI:

- Synced
- Pending changes
- Sync failed—tap to retry
- Needs attention (permanent conflict)

Do not silently leave mutations in `syncing` after a tab closes. On startup, reset stale syncing rows to pending after a timeout.
