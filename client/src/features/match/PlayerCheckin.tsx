import { useEffect, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type CheckinStatus = 'checked_in' | 'pending';

interface CheckinPlayer {
  id: string;
  name: string;
  role: 'Captain' | 'Player';
  teamTag: string;
  status: CheckinStatus;
}

interface PlayerCheckinProps {
  tournamentName?: string;
  matchLabel?: string;
  onBack: () => void;
  onConfirm?: () => void;
}

// ── Demo data ──────────────────────────────────────────────────────────────────
const INITIAL_PLAYERS: CheckinPlayer[] = [
  { id: '1', name: 'Marcus Phoenix',   role: 'Captain', teamTag: '$team', status: 'checked_in' },
  { id: '2', name: 'Dominic Santiago', role: 'Player',  teamTag: '$team', status: 'checked_in' },
  { id: '3', name: 'Augustus Cole',    role: 'Player',  teamTag: '$team', status: 'pending'    },
  { id: '4', name: 'Damon Baird',      role: 'Player',  teamTag: '$team', status: 'pending'    },
  { id: '5', name: 'Marcus Fenix',     role: 'Player',  teamTag: '$team', status: 'pending'    },
  { id: '6', name: 'Cole Train',       role: 'Player',  teamTag: '$team', status: 'pending'    },
];

const TOTAL_REQUIRED = INITIAL_PLAYERS.length;

// ── Player row ─────────────────────────────────────────────────────────────────
function PlayerRow({ player, onCheckin }: { player: CheckinPlayer; onCheckin: () => void }) {
  const checked = player.status === 'checked_in';
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3.5 ring-1 transition ${
      checked ? 'bg-status-live/8 ring-status-live/20' : 'bg-bg-card ring-white/8'
    }`}>
      <div className={`h-10 w-1 flex-shrink-0 rounded-full ${checked ? 'bg-status-live' : 'bg-status-soon'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text-primary">{player.name}</p>
        <p className="flex items-center gap-1 text-xs text-text-muted">
          <Star size={10} className={player.role === 'Captain' ? 'text-status-gold' : 'text-transparent'} fill={player.role === 'Captain' ? 'currentColor' : 'none'} />
          {player.role} · {player.teamTag}
        </p>
      </div>
      {checked ? (
        <span className="flex items-center gap-1.5 rounded-full bg-status-live/20 px-3 py-1.5 text-xs font-bold text-status-live">
          <CheckCircle size={12} /> Checked In
        </span>
      ) : (
        <button
          onClick={onCheckin}
          className="rounded-full bg-brand-purple px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-brand-purple/30 transition hover:bg-brand-purple-dim"
        >
          Check In
        </button>
      )}
    </div>
  );
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function CountdownTimer({ seconds: init }: { seconds: number }) {
  const [secs, setSecs] = useState(init);
  useEffect(() => {
    if (init <= 0) return;
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return (
    <span className="flex items-center gap-1 rounded-full bg-bg-card-2 px-2.5 py-1 text-xs font-bold tabular-nums text-text-subtle ring-1 ring-white/10">
      <Clock size={11} /> {m}:{s}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PlayerCheckin({ tournamentName = 'Pro League Season 4', onBack, onConfirm }: Omit<PlayerCheckinProps, 'matchLabel'> & { matchLabel?: string }) {
  const [players, setPlayers] = useState<CheckinPlayer[]>(INITIAL_PLAYERS);
  const [query, setQuery] = useState('');

  const checkedCount = players.filter((p) => p.status === 'checked_in').length;
  const progress = (checkedCount / TOTAL_REQUIRED) * 100;
  const allReady = checkedCount === TOTAL_REQUIRED;
  const pendingCount = TOTAL_REQUIRED - checkedCount;

  const checkin = (id: string) =>
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, status: 'checked_in' as const } : p));

  const visible = players.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card ring-1 ring-white/8 text-text-muted">
          <ChevronLeft size={18} />
        </button>
        <span className="rounded-full bg-brand-purple/20 px-3 py-1 text-xs font-bold text-brand-purple">
          {tournamentName}
        </span>
        <div className="w-9" />
      </div>

      {/* Title */}
      <div className="px-5 pb-4">
        <h2 className="text-xl font-bold text-text-primary">Player Check-in</h2>
        <p className="text-xs text-text-muted">Confirm your presence for the upcoming match</p>
      </div>

      {/* Progress bar */}
      <div className="mx-5 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full border-2 ${allReady ? 'border-status-live' : 'border-brand-purple'} relative`}>
              {!allReady && (
                <div className="absolute inset-0.5 animate-ping rounded-full bg-brand-purple/50" />
              )}
            </div>
            <span className="text-sm font-bold text-text-primary">
              {checkedCount} / {TOTAL_REQUIRED} Players Ready
            </span>
          </div>
          <CountdownTimer seconds={4 * 60 + 52} />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allReady ? 'bg-status-live' : 'bg-brand-purple'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Search + filter */}
      <div className="mx-5 mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player or team…"
            className="w-full rounded-xl bg-bg-card py-2.5 pl-8 pr-3 text-sm text-text-primary ring-1 ring-white/8 placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-card ring-1 ring-white/8">
          <SlidersHorizontal size={15} className="text-text-muted" />
        </button>
      </div>

      {/* Team label */}
      <p className="mx-5 mt-4 mb-2 text-center text-xs font-bold uppercase tracking-widest text-text-muted">
        Team Alpha
      </p>

      {/* Player list */}
      <div className="mx-5 space-y-2">
        {visible.map((p) => (
          <PlayerRow key={p.id} player={p} onCheckin={() => checkin(p.id)} />
        ))}
      </div>

      {/* Pending warning */}
      {pendingCount > 0 && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-status-soon/10 p-3 ring-1 ring-status-soon/20">
          <AlertCircle size={14} className="text-status-soon flex-shrink-0" />
          <p className="text-xs text-status-soon font-medium">
            {pendingCount} player{pendingCount > 1 ? 's' : ''} still pending. Match starts soon.
          </p>
        </div>
      )}

      {/* Confirm button */}
      <div className="mx-5 mt-5">
        <button
          onClick={onConfirm}
          disabled={!allReady}
          className="w-full rounded-xl bg-brand-purple py-3.5 text-sm font-bold text-white shadow-md shadow-brand-purple/30 transition hover:bg-brand-purple-dim disabled:opacity-50"
        >
          {allReady ? 'Confirm Team Readiness' : `Waiting for ${pendingCount} more player${pendingCount > 1 ? 's' : ''}…`}
        </button>
      </div>
    </div>
  );
}
