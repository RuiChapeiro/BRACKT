import { useState } from 'react';
import { Trophy, Flame, Star, Shield, Award, CheckCircle, LogOut, Ghost, Search, X, Check } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

// ── Stats ──────────────────────────────────────────────────────────────────────
const STAT_ITEMS = [
  { label: 'K/D RATIO',    value: '2.48',  color: 'text-brand-purple' },
  { label: 'WIN RATE',     value: '68%',   color: 'text-status-live'  },
  { label: 'TOURNAMENTS',  value: '14',    color: 'text-brand-cyan'   },
  { label: 'RANK',         value: 'Gold I', color: 'text-status-gold' },
];

const ACHIEVEMENTS = [
  { Icon: Trophy, label: 'Champion', color: 'text-status-gold',   bg: 'bg-status-gold/15'   },
  { Icon: Star,   label: 'MVP',      color: 'text-brand-purple',  bg: 'bg-brand-purple/15'  },
  { Icon: Flame,  label: 'On Fire',  color: 'text-status-danger', bg: 'bg-status-danger/15' },
  { Icon: Shield, label: '1st Blood',color: 'text-brand-cyan',    bg: 'bg-brand-cyan/15'    },
];

const RECENT_MATCHES = [
  { name: 'Apex Legends Global Ser…', result: 'Victory · 12 Kills', rp: '+25 RP', time: '2h ago',  win: true  },
  { name: 'Valorant Champions Tour',  result: 'Defeat · 8 Kills',   rp: '-12 RP', time: '1d ago',  win: false },
];

// ── Demo unclaimed ghosts (RF1.3) ─────────────────────────────────────────────
const DEMO_GHOSTS = [
  { id: 'g1', name: 'Shadow Alex', tournament: 'Cyber Strike Invitational 2024' },
  { id: 'g2', name: 'AlexR#4521',  tournament: 'Pro League S3'                  },
];

// ── Claim Ghost Modal (RF1.3) ─────────────────────────────────────────────────
function ClaimGhostModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [claimed, setClaimed] = useState<string | null>(null);

  const filtered = DEMO_GHOSTS.filter(
    (g) => g.name.toLowerCase().includes(query.toLowerCase()) || g.tournament.toLowerCase().includes(query.toLowerCase())
  );

  if (claimed) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 pb-8 ring-1 ring-white/10 space-y-4 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-status-live/20">
            <Check size={28} className="text-status-live" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">Ghost Claimed!</h3>
          <p className="text-sm text-text-muted">
            The ghost player's match history has been merged into your profile.
          </p>
          <button onClick={onClose} className="rounded-xl bg-brand-purple px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-purple/30">
            View My Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 pb-8 ring-1 ring-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Claim Ghost Player</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card-2 text-text-muted">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Find a ghost player created by a tournament organiser and absorb their match history into your account.
        </p>
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or tournament…"
            autoFocus
            className="w-full rounded-xl bg-bg-card-2 py-2.5 pl-8 pr-4 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-xs text-text-muted py-3">No ghost players found.</p>
          )}
          {filtered.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl bg-bg-card-2 p-3 ring-1 ring-white/8">
              <Ghost size={18} className="text-brand-cyan flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary">{g.name}</p>
                <p className="truncate text-xs text-text-muted">{g.tournament}</p>
              </div>
              <button
                onClick={() => setClaimed(g.id)}
                className="rounded-lg bg-brand-purple/20 px-3 py-1.5 text-xs font-bold text-brand-purple hover:bg-brand-purple/30"
              >
                Claim
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showClaim, setShowClaim] = useState(false);

  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="pb-4">
      {/* Hero banner */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #8B5CF6 0%, transparent 60%)' }}
        />
      </div>

      {/* Avatar */}
      <div className="relative -mt-10 flex flex-col items-center px-5">
        <div className="h-20 w-20 rounded-full ring-4 ring-bg-base bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-2xl font-bold text-white shadow-xl">
          {initials}
        </div>
        <h2 className="mt-3 text-xl font-bold text-text-primary">{user.displayName}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-text-muted">@{user.email.split('@')[0]}</span>
          {(user.role === 'Organizer' || user.role === 'Moderator') && (
            <span className="rounded-full bg-brand-purple/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-purple">
              {user.role}
            </span>
          )}
        </div>
      </div>

      {/* Claim Ghost CTA (RF1.3) */}
      <div className="mt-5 mx-5">
        <button
          onClick={() => setShowClaim(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-brand-cyan/10 p-4 ring-1 ring-brand-cyan/20 transition hover:bg-brand-cyan/15"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-cyan/20">
            <Ghost size={18} className="text-brand-cyan" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-text-primary">Claim Ghost Player</p>
            <p className="text-xs text-text-muted">Absorb a ghost profile's match history into your account</p>
          </div>
          <span className="text-xs font-semibold text-brand-cyan">→</span>
        </button>
      </div>

      {/* Stats grid */}
      <div className="mt-5 grid grid-cols-2 gap-2 px-5">
        {STAT_ITEMS.map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl bg-bg-card p-3.5 ring-1 ring-white/8">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="mt-5 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Achievements</h3>
          <button className="text-xs font-semibold text-brand-purple hover:text-brand-purple/80">See All</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map(({ Icon, label, color, bg }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} ring-1 ring-white/8`}>
                <Icon size={20} className={color} />
              </div>
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div className="mt-5 px-5">
        <h3 className="mb-3 text-sm font-bold text-text-primary">Recent Matches</h3>
        <div className="space-y-2">
          {RECENT_MATCHES.map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-2xl bg-bg-card p-3.5 ring-1 ring-white/8">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${m.win ? 'bg-status-live/15' : 'bg-status-danger/15'}`}>
                {m.win ? <CheckCircle size={16} className="text-status-live" /> : <Award size={16} className="text-status-danger" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{m.name}</p>
                <p className="text-xs text-text-muted">{m.result}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${m.win ? 'text-status-live' : 'text-status-danger'}`}>{m.rp}</p>
                <p className="text-[10px] text-text-muted">{m.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="mt-5 mx-5">
        <div className="rounded-2xl bg-bg-card ring-1 ring-white/8 divide-y divide-white/6">
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-text-muted">Email</span>
            <span className="text-xs text-text-subtle">{user.email}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-text-muted">Player ID</span>
            <span className="font-mono text-xs text-text-subtle">{user.playerId.slice(0, 8)}…</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-text-muted">Role</span>
            <span className="text-xs font-semibold text-brand-purple capitalize">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-4 px-5">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-status-danger/10 py-3 text-sm font-semibold text-status-danger ring-1 ring-status-danger/20 transition hover:bg-status-danger/15"
        >
          <LogOut size={15} /> Log out
        </button>
      </div>

      {showClaim && <ClaimGhostModal onClose={() => setShowClaim(false)} />}
    </div>
  );
}
