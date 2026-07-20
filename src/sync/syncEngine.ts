// Sync engine — pushes queued offline mutations to Supabase when connection is available.
// Triggers on: app startup, browser online event, tab visibility change, and a 30s interval.

import { getReadyMutations, markSyncing, removeMutation, markFailed, markConflict } from "../offline/outboxRepository";
import type { OutboxMutation } from "../offline/database";
import { submitAttendance } from "../services/supabase/attendanceRepository";
import { toggleRsvp } from "../services/supabase/sessionRepository";

let isSyncing = false;

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("fetch")) return true;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return false;
}

function isPermanentError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    return status === 403 || status === 409 || status === 422;
  }
  return false;
}

// Processes the outbox queue. The applyMutation callback handles actual Supabase calls.
export async function synchronize(
  userId: string,
  applyMutation: (mutation: OutboxMutation) => Promise<unknown> = defaultApplyMutation
): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  let synced = 0;
  let failed = 0;

  try {
    const mutations = await getReadyMutations(userId);

    for (const mutation of mutations) {
      try {
        await markSyncing(mutation.mutationId);
        await applyMutation(mutation);
        await removeMutation(mutation.mutationId);
        synced++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (isPermanentError(error)) {
          await markConflict(mutation.mutationId, errorMessage);
        } else {
          await markFailed(mutation.mutationId, errorMessage);
        }

        failed++;
        if (isNetworkError(error)) break;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

// Registers automatic sync triggers. Returns a cleanup function.
export function setupAutoSync(
  userId: string,
  applyMutation: (mutation: OutboxMutation) => Promise<unknown> = defaultApplyMutation
): () => void {
  const runSync = () => synchronize(userId, applyMutation);

  window.addEventListener("online", runSync);

  const handleVisibility = () => {
    if (document.visibilityState === "visible") runSync();
  };
  document.addEventListener("visibilitychange", handleVisibility);

  const intervalId = setInterval(runSync, 30000);

  runSync();

  return () => {
    window.removeEventListener("online", runSync);
    document.removeEventListener("visibilitychange", handleVisibility);
    clearInterval(intervalId);
  };
}

// Routes outbox items to the correct Supabase API based on their entityType
async function defaultApplyMutation(mutation: OutboxMutation): Promise<unknown> {
  const { entityType, payload } = mutation;
  const p = payload as any; // Cast for dynamic property access

  switch (entityType) {
    case "attendance":
      // Calls our Supabase API
      return await submitAttendance(p.sessionId, p.studentId);
    
    case "rsvp":
      // Calls our Supabase API
      return await toggleRsvp(p.sessionId, p.studentId);
    
    default:
      console.warn(`Unsupported mutation type: ${entityType}`);
      return null;
  }
}
