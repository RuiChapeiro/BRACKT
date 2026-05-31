// ---------------------------------------------------------------------------
// Offline-first sync — core types
// ---------------------------------------------------------------------------
// The client writes every mutation LOCALLY first (optimistic cache + durable
// outbox), then a sync engine replays the outbox to the ASP.NET Core backend in
// order when connectivity allows. These types are the shared vocabulary.

/** HTTP verb a queued operation will replay against the API. */
export type SyncMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type SyncOperationStatus =
  | 'pending' // waiting to be sent (or to be retried)
  | 'inflight' // currently being sent
  | 'failed'; // permanently rejected by the server (poisoned) — surfaced to the user

/**
 * A single durable, replayable mutation. `id` is a client-generated GUID that
 * doubles as the idempotency key: because our domain entities also use
 * client-assigned GUIDs, replaying an op after an ambiguous failure is safe — the
 * server recognises the operation id and will not apply it twice.
 */
export interface SyncOperation<TPayload = unknown> {
  id: string;
  kind: string; // semantic label, e.g. 'match.score', 'checkin.create'
  method: SyncMethod;
  endpoint: string; // API path relative to the base URL
  payload: TPayload;
  entityType: string; // for optimistic cache routing, e.g. 'match'
  entityId: string;
  /** Last server RowVersion the client based this change on (optimistic concurrency). */
  baseRowVersion?: number;
  createdAt: number; // epoch ms — informational (may collide within a tick)
  /** Monotonic enqueue sequence assigned by the store; the authoritative FIFO order. */
  seq?: number;
  attempts: number;
  status: SyncOperationStatus;
  lastError?: string;
}

/** A cached server entity plus the version we hold, for delta sync + conflict checks. */
export interface CacheEntry<T = unknown> {
  key: string; // `${entityType}:${entityId}`
  entityType: string;
  entityId: string;
  data: T;
  rowVersion: number;
  /** True while a local op for this entity is still un-synced (optimistic). */
  dirty: boolean;
  updatedAt: number;
}

/** A recorded conflict (server RowVersion moved on) for surfacing / auditing. */
export interface ConflictRecord {
  id: string; // = the operation id that conflicted
  entityType: string;
  entityId: string;
  kind: string;
  attemptedPayload: unknown;
  serverData: unknown;
  serverRowVersion: number;
  resolvedAt: number;
}

/**
 * Result of attempting to send one operation, normalised away from raw HTTP so
 * the engine's control flow is transport-agnostic and easy to test.
 */
export type SendOutcome =
  | 'applied' // 2xx — server accepted the change
  | 'conflict' // 409 — stale base version; needs resolution
  | 'rejected' // 4xx (validation/auth) — op is poisoned, will never succeed as-is
  | 'unavailable'; // network error / 5xx — try again later, keep order

export interface SendResult {
  outcome: SendOutcome;
  data?: unknown; // server's canonical entity (on applied)
  rowVersion?: number; // server's new version (on applied)
  serverEntity?: { data: unknown; rowVersion: number }; // on conflict
  error?: string;
}

/** The transport the engine depends on. The real implementation wraps `fetch`. */
export interface SyncApi {
  send(op: SyncOperation): Promise<SendResult>;
}

/** Snapshot of the engine's state, surfaced to React via the hook. */
export interface SyncState {
  online: boolean;
  isSyncing: boolean;
  pending: number;
  failed: number;
  lastSyncAt?: number;
  lastError?: string;
}
