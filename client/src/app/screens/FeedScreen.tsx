import { Card } from '../../components/ui';
import { useFeed } from '../../realtime/FeedContext';

// Maps raw domain-event type names to friendly feed copy.
const EVENT_COPY: Record<string, { icon: string; label: string }> = {
  TournamentStatusChanged: { icon: '🏆', label: 'Tournament status changed' },
  TeamRegistered: { icon: '✅', label: 'A team registered' },
  MatchScheduled: { icon: '📅', label: 'A match was scheduled' },
  MatchStarted: { icon: '🔴', label: 'A match has started' },
  MatchResultRecorded: { icon: '🥅', label: 'A result was recorded' },
  AnnouncementPublished: { icon: '📣', label: 'New announcement' },
  GhostPlayerClaimed: { icon: '👤', label: 'A ghost player was claimed' },
  TeamInvitationIssued: { icon: '✉️', label: 'A team invite was sent' },
};

/** Home / Feed — the Megaphone wall + live alerts streamed over SignalR (RF6). */
export function FeedScreen() {
  const { connected, events } = useFeed();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Feed</h2>
        <span className={`inline-flex items-center gap-1.5 text-xs ${connected ? 'text-brand-cyan' : 'text-neutral-light/40'}`}>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-brand-cyan' : 'bg-neutral-light/30'}`} />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      {events.length === 0 ? (
        <Card className="text-center text-sm text-neutral-light/40">
          No activity yet. Live events (results, announcements, check-ins) appear here in real time.
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const copy = EVENT_COPY[e.type] ?? { icon: '•', label: e.type };
            return (
              <Card key={e.id} className="flex items-center gap-3 !p-3">
                <span className="text-xl">{copy.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-light">{copy.label}</p>
                  <p className="text-xs text-neutral-light/40">{new Date(e.occurredAtUtc).toLocaleTimeString()}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
