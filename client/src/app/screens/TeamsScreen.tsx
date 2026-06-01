import { useState } from 'react';
import { Plus, Users, Ghost, Mail, Pencil, ChevronRight, UserPlus, X, Check, Crown } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type TeamLevel = 'Basic' | 'Intermediate' | 'Advanced';

interface GhostPlayer {
  id: string;
  name: string;
  claimed: boolean;
}

interface RealPlayer {
  id: string;
  name: string;
  email: string;
  isCaptain: boolean;
}

interface Team {
  id: string;
  initials: string;
  name: string;
  level: TeamLevel;
  ghosts: GhostPlayer[];
  players: RealPlayer[];
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_TEAMS: Team[] = [
  {
    id: '1', initials: 'NS', name: 'North Star Gaming', level: 'Advanced',
    ghosts: [],
    players: [
      { id: 'p1', name: 'You',          email: 'you@example.com',    isCaptain: true  },
      { id: 'p2', name: 'Alex Rivera',  email: 'alex@example.com',   isCaptain: false },
      { id: 'p3', name: 'Blake Turner', email: 'blake@example.com',  isCaptain: false },
    ],
  },
  {
    id: '2', initials: 'FB', name: 'Fire Breathers', level: 'Intermediate',
    ghosts: [
      { id: 'g1', name: 'Player Ghost 1', claimed: false },
      { id: 'g2', name: 'Player Ghost 2', claimed: true  },
      { id: 'g3', name: 'Player Ghost 3', claimed: false },
      { id: 'g4', name: 'Player Ghost 4', claimed: false },
    ],
    players: [],
  },
  {
    id: '3', initials: 'SR', name: 'Shadow Runners', level: 'Basic',
    ghosts: [], players: [{ id: 'p4', name: 'You', email: 'you@example.com', isCaptain: true }],
  },
];

const LEVEL_COLORS: Record<TeamLevel, string> = {
  Basic:        'bg-text-muted/10 text-text-muted',
  Intermediate: 'bg-brand-cyan/15 text-brand-cyan',
  Advanced:     'bg-brand-purple/15 text-brand-purple',
};

const INITIALS_COLORS = [
  'bg-brand-purple/25 text-brand-purple',
  'bg-brand-cyan/25 text-brand-cyan',
  'bg-status-soon/25 text-status-soon',
  'bg-status-live/25 text-status-live',
];

// ── Ghost Player row ──────────────────────────────────────────────────────────
function GhostRow({ ghost }: { ghost: GhostPlayer }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Ghost size={13} className={ghost.claimed ? 'text-status-live' : 'text-text-muted/50'} />
      <span className={`flex-1 text-xs ${ghost.claimed ? 'text-text-subtle line-through' : 'text-text-muted'}`}>
        {ghost.name}
      </span>
      <span className={`text-[10px] font-semibold ${ghost.claimed ? 'text-status-live' : 'text-text-muted/40'}`}>
        {ghost.claimed ? 'Claimed' : 'Unclaimed'}
      </span>
    </div>
  );
}

// ── Create Ghost modal ────────────────────────────────────────────────────────
function CreateGhostModal({ teamName, onClose, onAdd }: { teamName: string; onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 pb-8 ring-1 ring-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Add Ghost Player</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card-2 text-text-muted">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Ghost players are placeholder slots in <span className="text-text-subtle">{teamName}</span>.
          A real player can claim the ghost later from their Profile.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name or nickname"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose(); }}}
          className="w-full rounded-xl bg-bg-card-2 px-4 py-3 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-brand-purple/50"
        />
        <button
          onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); }}}
          disabled={!name.trim()}
          className="w-full rounded-xl bg-brand-purple py-3 text-sm font-bold text-white shadow-md shadow-brand-purple/30 disabled:opacity-40"
        >
          Create Ghost Player
        </button>
      </div>
    </div>
  );
}

// ── Invite Player modal ────────────────────────────────────────────────────────
function InviteModal({ teamName, onClose }: { teamName: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 pb-8 ring-1 ring-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Invite to {teamName}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card-2 text-text-muted">
            <X size={14} />
          </button>
        </div>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-live/20">
              <Check size={20} className="text-status-live" />
            </div>
            <p className="text-sm font-semibold text-text-primary">Invite sent!</p>
            <p className="text-xs text-text-muted text-center">The player will receive an invite email to join {teamName}.</p>
            <button onClick={onClose} className="mt-2 rounded-xl bg-bg-card-2 px-4 py-2 text-sm text-text-subtle ring-1 ring-white/8">Done</button>
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@email.com"
              autoFocus
              className="w-full rounded-xl bg-bg-card-2 px-4 py-3 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-brand-purple/50"
            />
            <button
              onClick={() => { if (email.includes('@')) setSent(true); }}
              disabled={!email.includes('@')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple py-3 text-sm font-bold text-white shadow-md shadow-brand-purple/30 disabled:opacity-40"
            >
              <Mail size={14} /> Send Invite
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Create Team modal ─────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, level: TeamLevel) => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<TeamLevel>('Basic');

  const LEVELS: { value: TeamLevel; label: string; description: string }[] = [
    { value: 'Basic',        label: 'Basic',        description: 'Name only — perfect for quick brackets' },
    { value: 'Intermediate', label: 'Intermediate', description: 'Add ghost players to fill roster slots'   },
    { value: 'Advanced',     label: 'Advanced',     description: 'Invite real registered players'           },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 pb-8 ring-1 ring-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Create Team</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card-2 text-text-muted">
            <X size={14} />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          autoFocus
          className="w-full rounded-xl bg-bg-card-2 px-4 py-3 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-brand-purple/50"
        />
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted">Team Level (RF2.1)</p>
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                level === l.value ? 'bg-brand-purple/15 ring-1 ring-brand-purple' : 'bg-bg-card-2 ring-1 ring-white/8'
              }`}
            >
              <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                level === l.value ? 'border-brand-purple bg-brand-purple' : 'border-white/20'
              }`}>
                {level === l.value && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>
              <div>
                <p className={`text-sm font-bold ${level === l.value ? 'text-text-primary' : 'text-text-subtle'}`}>{l.label}</p>
                <p className="text-xs text-text-muted">{l.description}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => { if (name.trim()) { onAdd(name.trim(), level); onClose(); }}}
          disabled={!name.trim()}
          className="w-full rounded-xl bg-brand-purple py-3 text-sm font-bold text-white shadow-md shadow-brand-purple/30 disabled:opacity-40"
        >
          Create Team
        </button>
      </div>
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────
function TeamCard({ team, idx, onInvite, onAddGhost }: {
  team: Team; idx: number;
  onInvite: () => void; onAddGhost: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = INITIALS_COLORS[idx % INITIALS_COLORS.length];
  const totalMembers = team.players.length + team.ghosts.length;

  return (
    <div className="rounded-2xl bg-bg-card ring-1 ring-white/8">
      <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setExpanded((e) => !e)}>
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color}`}>
          {team.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-text-primary">{team.name}</p>
          <p className="text-xs text-text-muted">
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold mr-1.5 ${LEVEL_COLORS[team.level]}`}>{team.level}</span>
            {team.players.length > 0 && `${team.players.length} Members`}
            {team.ghosts.length > 0 && ` · ${team.ghosts.length} Ghosts`}
            {totalMembers === 0 && 'Name only'}
          </p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-card-2">
          <Pencil size={13} />
        </button>
      </button>

      {expanded && (
        <div className="border-t border-white/6 px-4 pb-3 pt-2 space-y-1.5">
          {team.players.map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-1">
              {p.isCaptain && <Crown size={11} className="text-status-gold flex-shrink-0" />}
              <span className="text-xs text-text-subtle">{p.name}</span>
              {p.isCaptain && <span className="text-[10px] text-text-muted">Captain</span>}
            </div>
          ))}
          {team.ghosts.map((g) => <GhostRow key={g.id} ghost={g} />)}
          {team.level === 'Intermediate' && (
            <button onClick={onAddGhost} className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-brand-cyan hover:underline">
              <Ghost size={11} /> Add Ghost Player
            </button>
          )}
        </div>
      )}

      <div className="mx-4 border-t border-white/6" />
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-medium text-text-muted">Roster</span>
        {team.level === 'Advanced' ? (
          <button onClick={onInvite} className="text-xs font-semibold text-brand-purple hover:text-brand-purple/80">
            Invite Users
          </button>
        ) : team.level === 'Intermediate' ? (
          <button onClick={onAddGhost} className="text-xs font-semibold text-brand-cyan hover:text-brand-cyan/80">
            Manage Ghosts
          </button>
        ) : (
          <button className="text-xs font-semibold text-text-muted hover:text-brand-purple">
            Upgrade Team
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>(DEMO_TEAMS);
  const [inviteTeam, setInviteTeam] = useState<Team | null>(null);
  const [ghostTeam, setGhostTeam] = useState<Team | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const addGhostPlayer = (teamId: string, name: string) => {
    setTeams((prev) => prev.map((t) =>
      t.id === teamId
        ? { ...t, ghosts: [...t.ghosts, { id: crypto.randomUUID(), name, claimed: false }] }
        : t
    ));
  };

  const addTeam = (name: string, level: TeamLevel) => {
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    setTeams((prev) => [...prev, { id: crypto.randomUUID(), initials, name, level, ghosts: [], players: [] }]);
  };

  const totalGhosts = teams.reduce((s, t) => s + t.ghosts.length, 0);
  const pendingInvites = 3;

  return (
    <div className="px-5 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Team Management</h2>
          <p className="mt-0.5 text-xs text-text-muted">Organise rosters, ghost players and invites.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-purple/20 text-brand-purple">
          <Plus size={18} />
        </button>
      </div>

      {/* Stats chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-subtle ring-1 ring-white/8">
          <Users size={12} className="text-brand-purple" /> {teams.length} Active Teams
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-subtle ring-1 ring-white/8">
          <Ghost size={12} className="text-brand-cyan" /> {totalGhosts} Ghost Players
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-subtle ring-1 ring-white/8">
          <Mail size={12} className="text-status-soon" /> {pendingInvites} Pending
        </div>
      </div>

      {/* Teams list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Your Teams</h3>
          <button className="flex items-center gap-0.5 text-xs font-semibold text-brand-purple hover:text-brand-purple/80">
            See All <ChevronRight size={13} />
          </button>
        </div>
        <div className="space-y-3">
          {teams.map((team, i) => (
            <TeamCard
              key={team.id}
              team={team}
              idx={i}
              onInvite={() => setInviteTeam(team)}
              onAddGhost={() => setGhostTeam(team)}
            />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-text-primary">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-2 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8 transition hover:ring-brand-purple/30">
            <UserPlus size={20} className="text-brand-purple" />
            <span className="text-xs font-semibold text-text-subtle">New Team</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8 transition hover:ring-brand-cyan/30">
            <Ghost size={20} className="text-brand-cyan" />
            <span className="text-xs font-semibold text-text-subtle">Create Ghost</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8 transition hover:ring-status-soon/30">
            <Users size={20} className="text-status-soon" />
            <span className="text-xs font-semibold text-text-subtle">Manage Roster</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8 transition hover:ring-status-live/30">
            <Mail size={20} className="text-status-live" />
            <span className="text-xs font-semibold text-text-subtle">Invitations</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {inviteTeam && <InviteModal teamName={inviteTeam.name} onClose={() => setInviteTeam(null)} />}
      {ghostTeam && (
        <CreateGhostModal
          teamName={ghostTeam.name}
          onClose={() => setGhostTeam(null)}
          onAdd={(name) => addGhostPlayer(ghostTeam.id, name)}
        />
      )}
      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} onAdd={addTeam} />}
    </div>
  );
}
