// Outbox repository — manages the queue of offline changes waiting to sync.
// Implements the "save locally first, sync later" pattern.

import {
  getOfflineDatabase,
  getDeviceId,
  type EntityType,
  type MutationOperation,
  type OutboxMutation,
  type LocalEntity,
} from "./database";

// Saves a record and queues a sync mutation in one atomic IndexedDB transaction
export async function saveOfflineFirst(
  entity: LocalEntity,
  mutation: Omit<OutboxMutation, "mutationId" | "deviceId" | "createdAt" | "retryCount" | "status">
): Promise<string> {
  const db = await getOfflineDatabase();
  const deviceId = await getDeviceId();
  const mutationId = crypto.randomUUID();

  const fullMutation: OutboxMutation = {
    ...mutation,
    mutationId,
    deviceId,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
  };

  const tx = db.transaction(["entities", "outbox"], "readwrite");
  await tx.objectStore("entities").put(entity);
  await tx.objectStore("outbox").put(fullMutation);
  await tx.done;

  return mutationId;
}

// Returns mutations ready to sync (pending, or failed with retry time passed)
export async function getReadyMutations(userId: string): Promise<OutboxMutation[]> {
  const db = await getOfflineDatabase();
  const all = await db.getAllFromIndex("outbox", "by-user", userId);
  const now = new Date().toISOString();

  return all.filter((m) => {
    if (m.status === "pending") return true;
    if (m.status === "failed" && m.nextRetryAt && m.nextRetryAt <= now) return true;
    return false;
  });
}

// Returns count of pending mutations for UI display
export async function getPendingCount(userId: string): Promise<number> {
  const db = await getOfflineDatabase();
  const all = await db.getAllFromIndex("outbox", "by-user", userId);
  return all.filter((m) => m.status !== "conflict").length;
}

// Marks a mutation as currently in-flight to Supabase
export async function markSyncing(mutationId: string): Promise<void> {
  const db = await getOfflineDatabase();
  const mutation = await db.get("outbox", mutationId);
  if (!mutation) return;

  mutation.status = "syncing";
  await db.put("outbox", mutation);
}

// Removes a successfully synced mutation from the outbox
export async function removeMutation(mutationId: string): Promise<void> {
  const db = await getOfflineDatabase();
  await db.delete("outbox", mutationId);
}

// Marks a mutation as failed with exponential backoff (2s, 5s, 15s, 60s, 300s)
export async function markFailed(mutationId: string, error: string): Promise<void> {
  const db = await getOfflineDatabase();
  const mutation = await db.get("outbox", mutationId);
  if (!mutation) return;

  mutation.status = "failed";
  mutation.lastError = error;
  mutation.retryCount += 1;

  const baseDelays = [2000, 5000, 15000, 60000, 300000];
  const delayIndex = Math.min(mutation.retryCount - 1, baseDelays.length - 1);
  const delay = baseDelays[delayIndex] + Math.random() * 1000;
  mutation.nextRetryAt = new Date(Date.now() + delay).toISOString();

  await db.put("outbox", mutation);
}

// Marks a mutation as a conflict requiring manual resolution
export async function markConflict(mutationId: string, error: string): Promise<void> {
  const db = await getOfflineDatabase();
  const mutation = await db.get("outbox", mutationId);
  if (!mutation) return;

  mutation.status = "conflict";
  mutation.lastError = error;
  await db.put("outbox", mutation);
}

// Convenience helper to queue a simple mutation
export async function queueMutation(
  userId: string,
  entityType: EntityType,
  entityId: string,
  operation: MutationOperation,
  payload: unknown
): Promise<string> {
  const entity: LocalEntity = {
    key: `${userId}:${entityType}:${entityId}`,
    userId,
    entityType,
    entityId,
    data: payload,
    updatedAt: new Date().toISOString(),
  };

  return saveOfflineFirst(entity, {
    userId,
    entityType,
    entityId,
    operation,
    payload,
  });
}
