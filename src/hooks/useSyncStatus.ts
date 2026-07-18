// Tracks how many offline mutations are queued for sync.
// Polls every 5 seconds so the UI stays updated.

import { useState, useEffect, useCallback } from "react";
import { getPendingCount } from "../offline/outboxRepository";

export interface SyncStatus {
  pendingCount: number;
  refresh: () => Promise<void>;
}

export function useSyncStatus(userId: string | null): SyncStatus {
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setPendingCount(0);
      return;
    }

    try {
      const count = await getPendingCount(userId);
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { pendingCount, refresh };
}
