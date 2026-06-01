import { useState } from 'react';
import { ChevronLeft, Settings, Minus, Plus, Check, Shield } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlayerStat {
  id: string;
  initials: string;
  name: string;
  role: string;
  goals: number;
  assists: number;
  color: string;
}

interface MatchScoreEntryProps {
  matchId?: string;
  tournamentName?: string;
  roundName?: string;
  teamA: string;
  teamB: string;
  onBack: () => void;
  onFinalize?: (scoreA: number, scoreB: number) => void;
}

type StatTab = 'stats' | 'timeline' | 'logistics';

const STAT_TABS: { key: StatTab; label: string }[] = [
  { key: 'stats',     label: 'Player Stats' },
  { key: 'timeline',  label: 'Timeline'     },
  { key: 'logistics', label: 'Logistics'    },
];

// ── Demo roster data ──────────────────────────────────────────────────────────
const DEMO_ROSTER_A: PlayerStat[] = [
  { id: 'a1', initials: 'EL', name: 'ElIGE',    role: 'Rifler',  goals: 12, assists: 4, color: 'bg-status-live/25 text-status-live'  },
  { id: 'a2', initials: 'NA', name: 'NAF',       role: 'Lurker',  goals: 8,  assists: 6, color: 'bg-brand-purple/25 text-brand-purple' },
  { id: 'a3', initials: 'TW', name: 'Twistzz',   role: 'Entry',   goals: 15, assists: 2, color: 'bg-brand-cyan/25 text-brand-cyan'     },
];

const DEMO_ROSTER_B: PlayerStat[] = [
  { id: 'b1', initials: 'DE', name: 'device',    role: 'AWPer',   goals: 18, assists: 1, color: 'bg-status-soon/25 text-status-soon'   },
  { id: 'b2', initials: 'DU', name: 'dupreeh',   role: 'Entry',   goals: 11, assists: 5, color: 'bg-status-live/25 text-status-live'   },
  { id: 'b3', initials: 'MG', name: 'Magisk',    role: 'Support', goals: 9,  assists: 8, color: 'bg-brand-purple/25 text-brand-purple'  },
];

// ── Score stepper ──────────────────────────────────────────────────────────────
function ScoreStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-card-2 ring-1 ring-white/10 transition hover:ring-brand-purple/40"
        >
          <Minus size={14} className="text-text-muted" />
        </button>
        <span className="w-8 text-center text-3xl font-bold text-text-primary tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-card-2 ring-1 ring-white/10 transition hover:ring-brand-purple/40"
        >
          <Plus size={14} className="text-brand-purple" />
        </button>
      </div>
    </div>
  );
}

// ── Player row ─────────────────────────────────────────────────────────────────
function PlayerRow({ player }: { player: PlayerStat }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold ${player.color}`}>
        {player.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{player.name}</p>
        <p className="text-xs text-text-muted">{player.role}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-text-primary tabular-nums">{player.goals}</p>
        <p className="text-[10px] text-text-muted">G</p>
      </div>
      <div className="w-px self-stretch bg-white/6" />
      <div className="text-right">
        <p className="text-xs font-bold text-text-subtle tabular-nums">{player.assists}</p>
        <p className="text-[10px] text-text-muted">A</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function MatchScoreEntry({ matchId = 'TRN-992', tournamentName = 'Tournament', roundName = 'Quarter Finals', teamA, teamB, onBack, onFinalize }: MatchScoreEntryProps) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [modMode, setModMode] = useState(true);
  const [tab, setTab] = useState<StatTab>('stats');
  const [finalized, setFinalized] = useState(false);

  const initialsA = teamA.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const initialsB = teamB.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleFinalize = () => {
    setFinalized(true);
    onFinalize?.(scoreA, scoreB);
  };

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card ring-1 ring-white/8 text-text-muted">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-text-muted">Match ID: #{matchId}</p>
          <p className="text-sm font-bold text-text-primary">{roundName}</p>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card ring-1 ring-white/8 text-text-muted">
          <Settings size={16} />
        </button>
      </div>

      {/* Live score card */}
      <div className="mx-5 rounded-2xl bg-bg-card p-5 ring-1 ring-white/8">
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/20 text-lg font-bold text-brand-purple">
              {initialsA}
            </div>
            <p className="text-center text-sm font-semibold text-text-primary">{teamA}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-3xl font-extrabold text-text-primary tabular-nums">
              {scoreA} – {scoreB}
            </p>
            <span className="rounded-full bg-status-live/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-live">
              Live
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/20 text-lg font-bold text-brand-cyan">
              {initialsB}
            </div>
            <p className="text-center text-sm font-semibold text-text-primary">{teamB}</p>
          </div>
        </div>
      </div>

      {/* Quick score entry */}
      <div className="mx-5 mt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-text-primary">Quick Score Entry</p>
          <button
            onClick={() => setModMode((m) => !m)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              modMode ? 'bg-status-live/15 text-status-live' : 'bg-bg-card text-text-muted ring-1 ring-white/8'
            }`}
          >
            {modMode && <Check size={11} strokeWidth={3} />}
            <Shield size={11} />
            Moderator Mode
          </button>
        </div>
        <div className="flex justify-around rounded-2xl bg-bg-card p-5 ring-1 ring-white/8">
          <ScoreStepper label={`${teamA} Goals`} value={scoreA} onChange={setScoreA} />
          <div className="w-px self-stretch bg-white/8" />
          <ScoreStepper label={`${teamB} Goals`} value={scoreB} onChange={setScoreB} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-5 mt-4">
        <div className="flex rounded-xl bg-bg-card p-1 ring-1 ring-white/8">
          {STAT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                tab === t.key ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple/30' : 'text-text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'stats' && (
          <div className="mt-3 space-y-1">
            <div className="mb-1 flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{teamA} Roster</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">G / A</p>
            </div>
            <div className="divide-y divide-white/6 rounded-2xl bg-bg-card px-4 ring-1 ring-white/8">
              {DEMO_ROSTER_A.map((p) => <PlayerRow key={p.id} player={p} />)}
            </div>
            <div className="mb-1 mt-3 flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{teamB} Roster</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">G / A</p>
            </div>
            <div className="divide-y divide-white/6 rounded-2xl bg-bg-card px-4 ring-1 ring-white/8">
              {DEMO_ROSTER_B.map((p) => <PlayerRow key={p.id} player={p} />)}
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div className="mt-3 rounded-2xl bg-bg-card p-5 text-center ring-1 ring-white/8">
            <p className="text-sm text-text-muted">Timeline events appear here as goals are entered.</p>
          </div>
        )}

        {tab === 'logistics' && (
          <div className="mt-3 rounded-2xl bg-bg-card p-5 ring-1 ring-white/8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Tournament</span>
              <span className="font-semibold text-text-primary">{tournamentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Round</span>
              <span className="font-semibold text-text-primary">{roundName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Venue</span>
              <span className="font-semibold text-text-primary">Court 1</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="mx-5 mt-5 flex gap-2">
        <button
          onClick={() => alert('Draft saved locally')}
          className="flex-1 rounded-xl bg-bg-card py-3.5 text-sm font-semibold text-text-subtle ring-1 ring-white/8 transition hover:ring-brand-purple/30"
        >
          Save Draft
        </button>
        <button
          onClick={handleFinalize}
          disabled={finalized}
          className="flex-1 rounded-xl bg-brand-purple py-3.5 text-sm font-bold text-white shadow-md shadow-brand-purple/30 transition hover:bg-brand-purple-dim disabled:opacity-60"
        >
          {finalized ? 'Result Saved' : 'Finalize Result'}
        </button>
      </div>
    </div>
  );
}
