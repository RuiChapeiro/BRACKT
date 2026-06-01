import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Users, Plus, ChevronLeft, Copy, CheckCheck, ClipboardList, UserCheck } from 'lucide-react';
import { tournamentsApi, type ApiTournament } from '../../api/endpoints';
import { ApiError } from '../../api/http';
import { TournamentWizard } from '../../features/wizard/TournamentWizard';
import { BracketVisualizer } from '../../features/bracket/BracketVisualizer';
import { buildSingleElimination, type BracketModel } from '../../lib/bracket';
import { MatchScoreEntry } from '../../features/match/MatchScoreEntry';
import { PlayerCheckin } from '../../features/match/PlayerCheckin';
import type { TournamentDraft } from '../../types/tournament';

type View = 'discover' | 'create' | 'bracket' | 'score_entry' | 'checkin';

const GAME_FILTERS = ['All', 'Valorant', 'Soccer', 'CS2', 'Basketball'];

const COVER_GRADIENTS = [
  'from-violet-900 via-purple-800 to-indigo-900',
  'from-cyan-900 via-blue-800 to-sky-900',
  'from-rose-900 via-pink-800 to-purple-900',
  'from-emerald-900 via-teal-800 to-cyan-900',
  'from-amber-900 via-orange-800 to-red-900',
];

// ── Registration Link card ────────────────────────────────────────────────────
function RegistrationLinkCard({ token, name }: { token: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/join/${token}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl bg-brand-purple/10 p-4 ring-1 ring-brand-purple/30 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-purple">Registration Link</p>
      <p className="text-xs text-text-muted">Share this link so players can register for <span className="text-text-subtle">{name}</span></p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-bg-card-2 px-3 py-2 text-xs text-text-subtle ring-1 ring-white/8">
          /join/{token.slice(0, 16)}…
        </code>
        <button
          onClick={copy}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${
            copied ? 'bg-status-live/20 text-status-live' : 'bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30'
          }`}
        >
          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Tournament discover card ──────────────────────────────────────────────────
function TournamentDiscoverCard({ t, idx, onScoreEntry, onCheckin }: {
  t: ApiTournament; idx: number;
  onScoreEntry: () => void;
  onCheckin: () => void;
}) {
  const grad = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];
  const isLive = t.status === 'Active';
  return (
    <div className="overflow-hidden rounded-2xl bg-bg-card ring-1 ring-white/8">
      <div className={`relative h-36 bg-gradient-to-br ${grad}`}>
        {isLive && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-status-live/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
        )}
        {t.maxParticipants && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/80">
            <Users size={10} /> {t.maxParticipants}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-text-primary">{t.name}</h3>
          {t.description && <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{t.description}</p>}
        </div>
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLive ? 'bg-status-live/15 text-status-live' : 'bg-brand-purple/15 text-brand-purple'
          }`}>
            {t.status}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={onCheckin}
              className="flex items-center gap-1 rounded-xl bg-bg-card-2 px-2.5 py-1.5 text-xs font-semibold text-text-muted ring-1 ring-white/8 transition hover:text-brand-purple hover:ring-brand-purple/30"
            >
              <UserCheck size={12} /> Check-in
            </button>
            <button
              onClick={onScoreEntry}
              className="flex items-center gap-1 rounded-xl bg-bg-card-2 px-2.5 py-1.5 text-xs font-semibold text-text-muted ring-1 ring-white/8 transition hover:text-brand-cyan hover:ring-brand-cyan/30"
            >
              <ClipboardList size={12} /> Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TournamentsScreen() {
  const [view, setView] = useState<View>('discover');
  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bracket, setBracket] = useState<BracketModel>({ rounds: [] });
  const [lastDraft, setLastDraft] = useState<TournamentDraft | null>(null);
  const [createdTournament, setCreatedTournament] = useState<ApiTournament | null>(null);
  const [query, setQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [activeTournament, setActiveTournament] = useState<ApiTournament | null>(null);

  const refresh = () => {
    setLoading(true);
    tournamentsApi
      .list()
      .then(setTournaments)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load tournaments.'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleComplete = async (draft: TournamentDraft) => {
    setError(null);
    try {
      const created = await tournamentsApi.create({
        name: draft.name,
        description: draft.description || undefined,
        maxParticipants: draft.maxParticipants,
      });
      setCreatedTournament(created);
      setLastDraft(draft);
      setBracket(buildSingleElimination(draft.entrants));
      setView('bracket');
      refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create tournament.');
      setView('create');
    }
  };

  // ── Score entry sub-view ──────────────────────────────────────────────────
  if (view === 'score_entry') {
    return (
      <MatchScoreEntry
        teamA={activeTournament?.name ?? 'Team A'}
        teamB="Team B"
        tournamentName={activeTournament?.name}
        onBack={() => setView('discover')}
      />
    );
  }

  // ── Check-in sub-view ─────────────────────────────────────────────────────
  if (view === 'checkin') {
    return (
      <PlayerCheckin
        tournamentName={activeTournament?.name}
        onBack={() => setView('discover')}
        onConfirm={() => setView('discover')}
      />
    );
  }

  // ── Create wizard ──────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="px-5 pt-5 pb-4 space-y-4">
        <TournamentWizard
          onComplete={handleComplete}
          onCancel={() => setView('discover')}
        />
        {error && <p className="text-sm text-status-danger">{error}</p>}
      </div>
    );
  }

  // ── Bracket preview ────────────────────────────────────────────────────────
  if (view === 'bracket') {
    return (
      <div className="px-5 pt-5 pb-4 space-y-4">
        <button onClick={() => setView('discover')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
          <ChevronLeft size={16} /> Discover
        </button>
        {createdTournament && (
          <RegistrationLinkCard
            token={createdTournament.publicRegistrationToken}
            name={createdTournament.name}
          />
        )}
        {lastDraft && (
          <div>
            <h2 className="text-lg font-bold text-text-primary">{lastDraft.name}</h2>
            <p className="text-sm text-status-live">Created · {lastDraft.entrants.length} entrants</p>
          </div>
        )}
        <BracketVisualizer
          model={bracket}
          tournamentName={lastDraft?.name}
          format={lastDraft?.format}
          teamCount={lastDraft?.entrants.length}
        />
      </div>
    );
  }

  // ── Discover ──────────────────────────────────────────────────────────────
  const visible = tournaments.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-5 pt-5 pb-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Discover</h2>
        <p className="text-sm text-text-muted">Find your next challenge</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tournaments, games…"
            className="w-full rounded-xl bg-bg-card py-2.5 pl-9 pr-4 text-sm text-text-primary ring-1 ring-white/8 placeholder:text-text-muted focus:outline-none focus:ring-brand-purple/50"
          />
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-card ring-1 ring-white/8">
          <SlidersHorizontal size={16} className="text-text-muted" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GAME_FILTERS.map((g) => (
          <button
            key={g}
            onClick={() => setGameFilter(g)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              gameFilter === g
                ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/30'
                : 'bg-bg-card text-text-muted ring-1 ring-white/8 hover:text-text-subtle'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Active Now</h3>
          <button className="text-xs font-semibold text-brand-purple">See All</button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-bg-card" />)}
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-status-danger/10 p-4 text-sm text-status-danger ring-1 ring-status-danger/20">{error}</div>
        )}
        {!loading && visible.length === 0 && !error && (
          <div className="rounded-2xl bg-bg-card p-8 text-center ring-1 ring-white/8">
            <p className="text-sm text-text-muted">No tournaments found.</p>
            <p className="mt-1 text-xs text-text-muted/60">Tap <span className="text-brand-purple">+ Create Tournament</span> to start one.</p>
          </div>
        )}
        <div className="space-y-3">
          {visible.map((t, i) => (
            <TournamentDiscoverCard
              key={t.id}
              t={t}
              idx={i}
              onScoreEntry={() => { setActiveTournament(t); setView('score_entry'); }}
              onCheckin={() => { setActiveTournament(t); setView('checkin'); }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setView('create')}
        className="fixed bottom-20 right-1/2 flex translate-x-1/2 items-center gap-2 rounded-full bg-brand-purple px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-purple/40 transition hover:bg-brand-purple-dim active:scale-95"
        style={{ maxWidth: 'calc(100% - 2.5rem)' }}
      >
        <Plus size={16} /> Create Tournament
      </button>
    </div>
  );
}
