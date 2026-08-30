// IndexedDB local database for offline-first data persistence.
// Stores cached Supabase records and a sync outbox using the `idb` wrapper.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// Supported entity types for local caching
export type EntityType =
  | "profile"
  | "event"
  | "rsvp"
  | "schedule"
  | "attendance"
  | "note"
  | "favourite"
  | "notification"
  | "announcement";

export type MutationOperation = "upsert" | "delete" | "set" | "update" | "upload-file";
export type MutationStatus = "pending" | "syncing" | "failed" | "conflict";

// A cached record stored in IndexedDB
export interface LocalEntity {
  key: string; // composite: `${userId}:${entityType}:${entityId}`
  userId: string;
  entityType: EntityType;
  entityId: string;
  data: unknown;
  updatedAt: string;
  version?: number;
}

// A queued mutation waiting to sync to Supabase
export interface OutboxMutation {
  mutationId: string; // UUID, also used for idempotency on the server
  userId: string;
  deviceId: string;
  entityType: EntityType;
  entityId: string;
  operation: MutationOperation;
  payload: unknown;
  baseVersion?: number;
  dependsOn?: string[];
  createdAt: string;
  retryCount: number;
  nextRetryAt?: string;
  status: MutationStatus;
  lastError?: string;
}

export interface SyncMeta {
  key: string;
  value: string;
}

// IndexedDB schema definition
interface TutorialClinicDB extends DBSchema {
  entities: {
    key: string;
    value: LocalEntity;
    indexes: { "by-user-type": [string, string] };
  };
  outbox: {
    key: string;
    value: OutboxMutation;
    indexes: { "by-status": string; "by-user": string };
  };
  files: {
    key: string;
    value: {
      fileId: string;
      blob: Blob;
      fileName: string;
      mimeType: string;
      createdAt: string;
    };
  };
  syncMeta: {
    key: string;
    value: SyncMeta;
  };
}

const DB_NAME = "tutorial-clinic-offline";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<TutorialClinicDB> | null = null;

// Returns the IndexedDB connection, creating it on first call
export async function getOfflineDatabase(): Promise<IDBPDatabase<TutorialClinicDB> | null> {
  if (typeof indexedDB === "undefined") return null;
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<TutorialClinicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("entities")) {
          const entityStore = db.createObjectStore("entities", { keyPath: "key" });
          entityStore.createIndex("by-user-type", ["userId", "entityType"]);
        }

        if (!db.objectStoreNames.contains("outbox")) {
          const outboxStore = db.createObjectStore("outbox", { keyPath: "mutationId" });
          outboxStore.createIndex("by-status", "status");
          outboxStore.createIndex("by-user", "userId");
        }

        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "fileId" });
        }

        if (!db.objectStoreNames.contains("syncMeta")) {
          db.createObjectStore("syncMeta", { keyPath: "key" });
        }
      },
    });

    return dbInstance;
  } catch (e) {
    console.warn("Could not open IndexedDB:", e);
    return null;
  }
}

// Clears user-partitioned offline cache on sign out
export async function clearUserOfflineCache(userId: string): Promise<void> {
  try {
    const db = await getOfflineDatabase();
    if (!db) return;
    const tx = db.transaction(["entities", "outbox"], "readwrite");
    const entities = await tx.objectStore("entities").getAll();
    for (const ent of entities) {
      if (ent.userId === userId) {
        await tx.objectStore("entities").delete(ent.key);
      }
    }
    await tx.done;
  } catch (e) {
    console.warn("Could not clear offline cache:", e);
  }
}

// Returns a persistent device ID, generating one on first call
export async function getDeviceId(): Promise<string> {
  const db = await getOfflineDatabase();
  if (!db) return crypto.randomUUID();

  try {
    const existing = await db.get("syncMeta", "deviceId");
    if (existing) return existing.value;

    const newId = crypto.randomUUID();
    await db.put("syncMeta", { key: "deviceId", value: newId });
    return newId;
  } catch {
    return crypto.randomUUID();
  }
}
