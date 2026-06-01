import { useSync } from './useSync';

export function SyncStatusBadge() {
  const { online, isSyncing, pending, failed, flush } = useSync();

  const dotColor = !online
    ? 'bg-text-muted'
    : isSyncing
      ? 'bg-brand-cyan animate-pulse'
      : failed > 0
        ? 'bg-status-danger'
        : 'bg-status-live';

  const label = !online
    ? 'Offline'
    : isSyncing
      ? 'Syncing...'
      : pending > 0
        ? `${pending} queued`
        : failed > 0
          ? `${failed} failed`
          : 'Synced';

  return (
    <button
      type="button"
      onClick={() => void flush()}
      className="inline-flex items-center gap-1.5 rounded-full bg-bg-card px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-white/10 transition hover:ring-brand-purple/40 hover:text-text-subtle"
      title={online ? 'Tap to sync now' : 'Changes saved locally and will sync when back online'}
    >
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} aria-hidden />
      <span>{label}</span>
      {failed > 0 && (
        <span className="rounded-full bg-status-danger/20 px-1.5 text-[10px] text-status-danger">{failed}</span>
      )}
    </button>
  );
}
