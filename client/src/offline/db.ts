import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { CacheEntry, ConflictRecord, SyncOperation } from './types';

// ---------------------------------------------------------------------------
// IndexedDB schema + a small typed store wrapper
// ---------------------------------------------------------------------------
// Four object stores:
//   outbox    — the durable, ordered queue of un-synced mutations
//   cache     — last-known server entities (read path while offline)
//   conflicts — recorded version conflicts for surfacing/auditing
//   meta      — misc cursors (e.g. last delta-pull timestamp)

interface BracktDB extends DBSchema {
  outbox: {
    key: string;
    value: SyncOperation;
    indexes: { 'by-seq': number };
  };
  cache: { key: string; value: CacheEntry };
  conflicts: { key: string; value: ConflictRecord };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'brackt';
const DB_VERSION = 1;

export const cacheKey = (entityType: string, entityId: string): string =>
  `${entityType}:${entityId}`;

/**
 * Thin, promise-based wrapper over the IndexedDB stores. All sync state lives
 * here so it survives app restarts and offline periods.
 */
export class LocalStore {
  private constructor(private readonly db: IDBPDatabase<BracktDB>) {}

  static async open(): Promise<LocalStore> {
    const db = await openDB<BracktDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('outbox')) {
          const outbox = database.createObjectStore('outbox', { keyPath: 'id' });
          outbox.createIndex('by-seq', 'seq');
        }
        if (!database.objectStoreNames.contains('cache')) {
          database.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains('conflicts')) {
          database.createObjectStore('conflicts', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('meta')) {
          database.createObjectStore('meta');
        }
      },
    });
    return new LocalStore(db);
  }

  // ----- outbox ------------------------------------------------------------

  /** All queued operations in capture order (FIFO) — the replay order. */
  async outboxFifo(): Promise<SyncOperation[]> {
    return this.db.getAllFromIndex('outbox', 'by-seq');
  }

  async putOperation(op: SyncOperation): Promise<void> {
    // Assign the monotonic sequence on first insert; updates keep their order.
    if (op.seq == null) op.seq = await this.nextSeq();
    await this.db.put('outbox', op);
  }

  /** Atomically read-increment a persisted counter so FIFO order survives restarts. */
  private async nextSeq(): Promise<number> {
    const tx = this.db.transaction('meta', 'readwrite');
    const current = ((await tx.store.get('outboxSeq')) as number | undefined) ?? 0;
    const next = current + 1;
    await tx.store.put(next, 'outboxSeq');
    await tx.done;
    return next;
  }

  async deleteOperation(id: string): Promise<void> {
    await this.db.delete('outbox', id);
  }

  async countByStatus(): Promise<{ pending: number; failed: number }> {
    const all = await this.db.getAll('outbox');
    let pending = 0;
    let failed = 0;
    for (const op of all) {
      if (op.status === 'failed') failed++;
      else pending++; // pending + inflight both count as "not done"
    }
    return { pending, failed };
  }

  // ----- cache -------------------------------------------------------------

  async getEntity<T>(entityType: string, entityId: string): Promise<CacheEntry<T> | undefined> {
    return (await this.db.get('cache', cacheKey(entityType, entityId))) as CacheEntry<T> | undefined;
  }

  async upsertEntity<T>(
    entityType: string,
    entityId: string,
    data: T,
    rowVersion: number,
    dirty: boolean,
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key: cacheKey(entityType, entityId),
      entityType,
      entityId,
      data,
      rowVersion,
      dirty,
      updatedAt: Date.now(),
    };
    await this.db.put('cache', entry);
  }

  // ----- conflicts ---------------------------------------------------------

  async recordConflict(record: ConflictRecord): Promise<void> {
    await this.db.put('conflicts', record);
  }

  async allConflicts(): Promise<ConflictRecord[]> {
    return this.db.getAll('conflicts');
  }

  // ----- meta --------------------------------------------------------------

  async getMeta<T>(key: string): Promise<T | undefined> {
    return (await this.db.get('meta', key)) as T | undefined;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.db.put('meta', value, key);
  }
}
