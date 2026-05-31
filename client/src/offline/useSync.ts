import { useCallback } from 'react';
import { useSyncContext } from './SyncProvider';
import type { SyncOperation, SyncState } from './types';

export interface UseSyncResult extends SyncState {
  /** Queue a mutation locally (optionally applying an optimistic cache update). */
  enqueue: (op: SyncOperation, optimistic?: { data: unknown; rowVersion: number }) => Promise<void>;
  /** Force a flush attempt now (e.g. a manual "retry" button). */
  flush: () => Promise<void>;
}

/**
 * Primary hook for components: read live sync status and enqueue offline-capable
 * actions. Example:
 *   const { online, pending, enqueue } = useSync();
 *   await enqueue(scoreMatch({ matchId, scores, isDraw: false }), { data, rowVersion });
 */
export function useSync(): UseSyncResult {
  const { state, enqueue, flush } = useSyncContext();

  const stableEnqueue = useCallback(enqueue, [enqueue]);
  const stableFlush = useCallback(flush, [flush]);

  return { ...state, enqueue: stableEnqueue, flush: stableFlush };
}
