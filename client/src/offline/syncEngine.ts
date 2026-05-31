import type { LocalStore } from './db';
import type {
  SyncApi,
  SyncOperation,
  SyncState,
  SendResult,
} from './types';

export interface SyncEngineOptions {
  /** Initial connectivity (defaults to navigator.onLine when available). */
  online?: boolean;
  /** Automatically drain the outbox on enqueue/reconnect (default true). Disable for deterministic tests. */
  autoFlush?: boolean;
  /** Base delay (ms) for exponential retry backoff. */
  retryBaseMs?: number;
  /** Upper bound (ms) for retry backoff. */
  retryMaxMs?: number;
  /** Schedule a callback after `ms` — injectable for deterministic tests. */
  scheduleRetry?: (fn: () => void, ms: number) => void;
  /**
   * Conflict resolver. Default strategy is "server wins": the server's current
   * entity is adopted into the cache and the local op is discarded (recorded as
   * a ConflictRecord for the UI). Return false to keep the op for manual review.
   */
  onConflict?: (op: SyncOperation, server: { data: unknown; rowVersion: number }) => boolean;
}

type Listener = (state: SyncState) => void;

/**
 * The offline-first synchronisation engine.
 *
 * Write path:  enqueue() → optimistic cache update + durable outbox → flush().
 * Flush path:  drains the outbox FIFO, ONE op at a time (sequential), so
 *              dependent actions (score → advance) replay in the order captured.
 *
 * Failure handling per op:
 *   • applied      → update cache with server version, drop the op.
 *   • conflict     → resolve (default server-wins), record it, drop the op.
 *   • rejected     → mark 'failed' (poison) and SKIP henceforth; keep draining.
 *   • unavailable  → revert to 'pending', STOP draining (preserve order), retry
 *                    later with exponential backoff.
 */
export class SyncEngine {
  private readonly listeners = new Set<Listener>();
  private flushing = false;
  /** The in-flight drain, if any. Coalesces concurrent flush() callers onto one drain. */
  private flushPromise: Promise<void> | null = null;
  private readonly autoFlush: boolean;
  private online: boolean;
  private lastSyncAt?: number;
  private lastError?: string;
  private cachedPending = 0;
  private cachedFailed = 0;

  private readonly retryBaseMs: number;
  private readonly retryMaxMs: number;
  private readonly schedule: (fn: () => void, ms: number) => void;
  private readonly resolveConflict: NonNullable<SyncEngineOptions['onConflict']>;

  constructor(
    private readonly store: LocalStore,
    private readonly api: SyncApi,
    options: SyncEngineOptions = {},
  ) {
    this.online =
      options.online ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
    this.autoFlush = options.autoFlush ?? true;
    this.retryBaseMs = options.retryBaseMs ?? 2000;
    this.retryMaxMs = options.retryMaxMs ?? 60_000;
    this.schedule = options.scheduleRetry ?? ((fn, ms) => setTimeout(fn, ms));
    this.resolveConflict =
      options.onConflict ??
      (() => true); // default: server wins, discard local op
  }

  // ----- public API --------------------------------------------------------

  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    void this.refreshCounts().then(() => listener(this.snapshot()));
    return () => this.listeners.delete(listener);
  }

  snapshot(): SyncState {
    return {
      online: this.online,
      isSyncing: this.flushing,
      pending: this.cachedPending,
      failed: this.cachedFailed,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  /**
   * Queue a mutation. Writes the operation durably and, when an optimistic
   * snapshot is supplied, immediately updates the local cache so the UI reflects
   * the change before the server confirms it. Triggers a flush if online.
   */
  async enqueue(
    op: SyncOperation,
    optimistic?: { data: unknown; rowVersion: number },
  ): Promise<void> {
    await this.store.putOperation(op);
    if (optimistic) {
      await this.store.upsertEntity(
        op.entityType,
        op.entityId,
        optimistic.data,
        optimistic.rowVersion,
        /* dirty */ true,
      );
    }
    await this.refreshCounts();
    this.emit();
    if (this.online && this.autoFlush) void this.flush();
  }

  /** Inform the engine of a connectivity change (wired to window events). */
  setOnline(online: boolean): void {
    const was = this.online;
    this.online = online;
    this.emit();
    if (online && !was && this.autoFlush) void this.flush(); // came back online → drain
  }

  /**
   * Drain the outbox sequentially. Concurrent callers are coalesced onto a single
   * in-flight drain (so awaiting flush() always awaits the actual completion),
   * and only one drain ever runs at a time.
   */
  flush(): Promise<void> {
    if (!this.online) return Promise.resolve();
    if (this.flushPromise) return this.flushPromise;
    this.flushPromise = this.drain().finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  private async drain(): Promise<void> {
    this.flushing = true;
    this.lastError = undefined;
    this.emit();

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!this.online) break;

        const queue = await this.store.outboxFifo();
        // First operation that is not poisoned (failed ops are skipped but kept).
        const op = queue.find((o) => o.status !== 'failed');
        if (!op) break;

        op.status = 'inflight';
        op.attempts += 1;
        await this.store.putOperation(op);
        this.emit();

        let result: SendResult;
        try {
          result = await this.api.send(op);
        } catch (err) {
          // Treat an unexpected throw like a transient transport failure.
          result = { outcome: 'unavailable', error: (err as Error)?.message ?? 'network error' };
        }

        const stop = await this.applyResult(op, result);
        await this.refreshCounts();
        this.emit();
        if (stop) break;
      }
      this.lastSyncAt = Date.now();
    } finally {
      this.flushing = false;
      this.emit();
    }
  }

  // ----- internals ---------------------------------------------------------

  /** Apply a send result. Returns true if the drain loop should stop. */
  private async applyResult(op: SyncOperation, result: SendResult): Promise<boolean> {
    switch (result.outcome) {
      case 'applied': {
        if (result.rowVersion != null) {
          await this.store.upsertEntity(
            op.entityType,
            op.entityId,
            result.data ?? op.payload,
            result.rowVersion,
            /* dirty */ false,
          );
        }
        await this.store.deleteOperation(op.id);
        return false;
      }

      case 'conflict': {
        const server = result.serverEntity ?? { data: undefined, rowVersion: op.baseRowVersion ?? 0 };
        const discard = this.resolveConflict(op, server);
        await this.store.recordConflict({
          id: op.id,
          entityType: op.entityType,
          entityId: op.entityId,
          kind: op.kind,
          attemptedPayload: op.payload,
          serverData: server.data,
          serverRowVersion: server.rowVersion,
          resolvedAt: Date.now(),
        });
        if (discard) {
          // Adopt server state and drop the local op.
          await this.store.upsertEntity(
            op.entityType,
            op.entityId,
            server.data,
            server.rowVersion,
            /* dirty */ false,
          );
          await this.store.deleteOperation(op.id);
        } else {
          op.status = 'failed';
          op.lastError = 'version conflict — manual resolution required';
          await this.store.putOperation(op);
        }
        return false; // a conflict on one op doesn't block the rest
      }

      case 'rejected': {
        // Validation/auth failure: this op will never succeed unchanged. Mark it
        // poisoned so it is surfaced and skipped, but keep draining the rest.
        op.status = 'failed';
        op.lastError = result.error ?? 'rejected by server';
        await this.store.putOperation(op);
        this.lastError = op.lastError;
        return false;
      }

      case 'unavailable':
      default: {
        // Transient: put it back to pending, stop, and retry with backoff so we
        // never reorder the queue.
        op.status = 'pending';
        op.lastError = result.error ?? 'service unavailable';
        await this.store.putOperation(op);
        this.lastError = op.lastError;
        this.scheduleRetry(op.attempts);
        return true;
      }
    }
  }

  private scheduleRetry(attempts: number): void {
    const delay = Math.min(this.retryBaseMs * 2 ** Math.max(0, attempts - 1), this.retryMaxMs);
    this.schedule(() => {
      if (this.online) void this.flush();
    }, delay);
  }

  private async refreshCounts(): Promise<void> {
    const { pending, failed } = await this.store.countByStatus();
    this.cachedPending = pending;
    this.cachedFailed = failed;
  }

  private emit(): void {
    const state = this.snapshot();
    for (const listener of this.listeners) listener(state);
  }
}
