import { useState } from 'react';
import { Plus, Megaphone, Calendar, BarChart2, AlertTriangle, ChevronRight, X, Users, Trophy, Send } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────
interface Conflict {
  id: string;
  type: 'venue' | 'player';
  title: string;
  description: string;
}

interface ActiveTournament {
  id: string;
  name: string;
  sport: string;
  format: string;
  status: 'Live' | 'Upcoming' | 'Registration';
  participantCount: number;
}

// ── Demo data — replaced when API endpoints land ────────────────────────────
const DEMO_CONFLICTS: Conflict[] = [
  { id: '1', type: 'venue',  title: 'Venue Overlap',   description: 'Court 1: Match #42 vs Match #43 at 14:00' },
  { id: '2', type: 'player', title: 'Late Check-in',   description: "Team 'Shadow Realm' has 2 players missing" },
];

const DEMO_TOURNAMENTS: ActiveTournament[] = [
  { id: '1', name: 'Cyber Strike Invitational', sport: 'eSports', format: 'Swiss System',          status: 'Live',         participantCount: 64 },
  { id: '2', name: 'Pro League Season 4',        sport: 'Soccer',  format: 'Single Elimination',   status: 'Upcoming',     participantCount: 16 },
  { id: '3', name: 'Regional Cup',               sport: 'CS2',     format: 'Double Elimination',   status: 'Registration', participantCount: 12 },
];

// ── Announcement compose ─────────────────────────────────────────────────────
function AnnouncementModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    alert('Announcement sent to all participants! (Backend endpoint pending)');
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 pb-8 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-text-primary">New Announcement</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card-2 text-text-muted">
            <X size={14} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your announcement to all tournament participants…"
          rows={4}
          className="w-full resize-none rounded-xl bg-bg-card-2 px-4 py-3 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-brand-purple/50"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple py-3 text-sm font-bold text-white shadow-md shadow-brand-purple/30 disabled:opacity-40"
        >
          <Send size={14} /> Send to All Participants
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function OrganizerHub() {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<Conflict[]>(DEMO_CONFLICTS);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const resolveConflict = (id: string) => setConflicts((c) => c.filter((x) => x.id !== id));

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="px-5 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-primary">Organizer Hub</h2>
        <p className="text-xs text-text-muted">{today}</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-bg-card p-4 ring-1 ring-white/8">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Active Events</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-bold text-brand-purple">
            <Trophy size={18} />
            {DEMO_TOURNAMENTS.filter((t) => t.status === 'Live').length}
          </p>
        </div>
        <div className="rounded-2xl bg-bg-card p-4 ring-1 ring-white/8">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Total Players</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-bold text-brand-cyan">
            <Users size={18} />
            {DEMO_TOURNAMENTS.reduce((s, t) => s + t.participantCount, 0)}
          </p>
        </div>
      </div>

      {/* Critical Conflicts */}
      {conflicts.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-bold text-status-danger">Critical Conflicts</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-status-danger text-[10px] font-bold text-white">
              {conflicts.length}
            </span>
          </div>
          <div className="space-y-2">
            {conflicts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-status-danger/10 p-3.5 ring-1 ring-status-danger/20">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-status-danger/20">
                  <AlertTriangle size={16} className="text-status-danger" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary">{c.title}</p>
                  <p className="truncate text-xs text-text-muted">{c.description}</p>
                </div>
                <button
                  onClick={() => resolveConflict(c.id)}
                  className="flex-shrink-0 rounded-lg bg-status-danger px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-text-primary">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { Icon: Plus,      label: 'New Event',  color: 'text-text-primary', bg: 'bg-bg-card-2'        },
            { Icon: Megaphone, label: 'Megaphone',  color: 'text-status-danger', bg: 'bg-status-danger/10', onClick: () => setShowAnnouncement(true) },
            { Icon: Calendar,  label: 'Schedule',   color: 'text-brand-purple',  bg: 'bg-brand-purple/10'  },
            { Icon: BarChart2, label: 'Reports',    color: 'text-status-live',   bg: 'bg-status-live/10'   },
          ].map(({ Icon, label, color, bg, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8 transition hover:ring-white/20"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <span className="text-xs font-semibold text-text-subtle">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Active Tournaments */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Active Tournaments</h3>
          <button className="flex items-center gap-0.5 text-xs font-semibold text-brand-purple">
            See All <ChevronRight size={13} />
          </button>
        </div>
        <div className="space-y-2">
          {DEMO_TOURNAMENTS.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-bg-card p-4 ring-1 ring-white/8">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-text-primary">{t.name}</p>
                <p className="text-xs text-text-muted">{t.sport} · {t.format}</p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                t.status === 'Live'
                  ? 'bg-status-live/15 text-status-live'
                  : t.status === 'Upcoming'
                    ? 'bg-status-soon/15 text-status-soon'
                    : 'bg-brand-purple/15 text-brand-purple'
              }`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Organizer name reminder */}
      <p className="text-center text-xs text-text-muted/40">
        Logged in as <span className="text-text-muted">{user?.displayName}</span> · Organizer
      </p>

      {showAnnouncement && <AnnouncementModal onClose={() => setShowAnnouncement(false)} />}
    </div>
  );
}
