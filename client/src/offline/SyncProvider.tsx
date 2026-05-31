import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { LocalStore } from './db';
import { SyncEngine, type SyncEngineOptions } from './syncEngine';
import { ApiSyncClient } from './apiClient';
import type { SyncApi, SyncOperation, SyncState } from './types';

interface SyncContextValue {
  state: SyncState;
  enqueue: (op: SyncOperation, optimistic?: { data: unknown; rowVersion: number }) => Promise<void>;
  flush: () => Promise<void>;
  engine: SyncEngine | null;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  children: ReactNode;
  /** API base URL for the real transport. Ignored when `api` is supplied (tests). */
  baseUrl?: string;
  getToken?: () => string | null;
  /** Inject a custom transport (used in tests). */
  api?: SyncApi;
  engineOptions?: SyncEngineOptions;
}

const initialState: SyncState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pending: 0,
  failed: 0,
};

/**
 * Provides a single, app-wide {@link SyncEngine}. Responsibilities:
 *   • lazily open IndexedDB and construct the engine once;
 *   • bridge browser connectivity (online/offline + tab-focus) into the engine;
 *   • expose engine state to React via context, kept fresh by subscription.
 */
export function SyncProvider({
  children,
  baseUrl = '',
  getToken,
  api,
  engineOptions,
}: SyncProviderProps) {
  const [state, setState] = useState<SyncState>(initialState);
  const engineRef = useRef<SyncEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const store = await LocalStore.open();
      const transport: SyncApi = api ?? new ApiSyncClient({ baseUrl, getToken });
      if (cancelled) return;

      const engine = new SyncEngine(store, transport, engineOptions);
      engineRef.current = engine;
      unsubscribe = engine.subscribe(setState);
      setReady(true);

      // Kick an initial drain in case the outbox has leftovers from last session.
      void engine.flush();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // Construct once for the provider's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bridge connectivity + visibility into the engine.
  useEffect(() => {
    const onOnline = () => engineRef.current?.setOnline(true);
    const onOffline = () => engineRef.current?.setOnline(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void engineRef.current?.flush();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ready]);

  const value = useMemo<SyncContextValue>(
    () => ({
      state,
      engine: engineRef.current,
      enqueue: async (op, optimistic) => {
        await engineRef.current?.enqueue(op, optimistic);
      },
      flush: async () => {
        await engineRef.current?.flush();
      },
    }),
    [state],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSyncContext must be used within a <SyncProvider>.');
  return ctx;
}
