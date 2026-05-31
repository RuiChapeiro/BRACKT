import { useSync } from './useSync';

/**
 * A compact connectivity/sync indicator using the BRACKT palette. Drop it in the
 * app header: it shows online/offline, the number of un-synced actions, any
 * poisoned operations, and offers a manual retry.
 */
export function SyncStatusBadge() {
  const { online, isSyncing, pending, failed, flush } = useSync();

  const dotColor = !online
    ? 'bg-slate-400'
    : isSyncing
      ? 'bg-brand-cyan animate-pulse'
      : failed > 0
        ? 'bg-rose-500'
        : 'bg-brand-purple';

  const label = !online
    ? 'Offline'
    : isSyncing
      ? 'Syncing…'
      : pending > 0
        ? `${pending} queued`
        : failed > 0
          ? `${failed} failed`
          : 'Up to date';

  return (
    <button
      type="button"
      onClick={() => void flush()}
      className="inline-flex items-center gap-2 rounded-full bg-slate-deep/60 px-3 py-1.5
                 text-sm font-medium text-neutral-light ring-1 ring-white/10
                 transition hover:ring-brand-cyan/50"
      title={online ? 'Tap to sync now' : 'Changes are saved locally and will sync when you’re back online'}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} aria-hidden />
      <span>{label}</span>
      {failed > 0 && (
        <span className="rounded-full bg-rose-500/20 px-1.5 text-xs text-rose-300">{failed}</span>
      )}
    </button>
  );
}
