import { useEffect, useState } from 'react';
import { Bell, Users, ChevronRight, Clock, Megaphone, Trophy, Calendar } from 'lucide-react';
import { tournamentsApi, type ApiTournament } from '../../api/endpoints';
import { useFeed } from '../../realtime/FeedContext';

// ── Live event icons ─────────────────────────────────────────────────────────
const EVENT_META: Record<string, { Icon: typeof Bell; color: string; label: string }> = {
  TournamentStatusChanged: { Icon: Trophy,    color: 'text-brand-purple', label: 'Tournament status changed' },
  TeamRegistered:          { Icon: Users,     color: 'text-status-live',  label: 'A team registered'        },
  MatchScheduled:          { Icon: Calendar,  color: 'text-brand-cyan',   label: 'Match scheduled'          },
  MatchStarted:            { Icon: Clock,     color: 'text-status-danger',label: 'Match has started'        },
  MatchResultRecorded:     { Icon: Trophy,    color: 'text-status-live',  label: 'Result recorded'          },
  AnnouncementPublished:   { Icon: Megaphone, color: 'text-status-soon',  label: 'New announcement'        },
};

// ── Placeholder tournament card images (gradient covers) ────────────────────
const COVER_GRADIENTS = [
  'from-violet-900 via-purple-800 to-indigo-900',
  'from-cyan-900 via-blue-800 to-indigo-900',
  'from-rose-900 via-pink-800 to-purple-900',
  'from-emerald-900 via-teal-800 to-cyan-900',
];

function TournamentCoverCard({ t, idx }: { t: ApiTournament; idx: number }) {
  const grad = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];
  return (
    <div className={`relative h-36 w-44 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${grad}`}>
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <span
          className={`mb-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            t.status === 'Active' ? 'bg-status-live/20 text-status-live' : 'bg-white/15 text-white/70'
          }`}
        >
          {t.status}
        </span>
        <p className="line-clamp-2 text-xs font-bold leading-tight text-white">{t.name}</p>
        {t.maxParticipants && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-white/60">
            <Users size={10} />
            {t.maxParticipants} Players
          </p>
        )}
      </div>
    </div>
  );
}

// ── Upcoming match card (mocked — real data wired when matches endpoint lands) ─
function UpcomingMatchCard({ tournamentName, teamA, teamB, timeLabel, urgent }: {
  tournamentName: string;
  teamA: string;
  teamB: string;
  timeLabel: string;
  urgent?: boolean;
}) {
  const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="rounded-2xl bg-bg-card ring-1 ring-white/8 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{tournamentName}</span>
        <span className={`text-xs font-semibold ${urgent ? 'text-status-danger' : 'text-status-soon'}`}>
          {timeLabel}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/20 text-sm font-bold text-brand-purple">
            {initials(teamA)}
          </div>
          <span className="text-xs font-medium text-text-primary">{teamA}</span>
        </div>
        <span className="text-xs font-semibold text-text-muted">VS</span>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/20 text-sm font-bold text-brand-cyan">
            {initials(teamB)}
          </div>
          <span className="text-xs font-medium text-text-primary">{teamB}</span>
        </div>
      </div>
      <button className="w-full rounded-xl bg-bg-card-2 py-2.5 text-xs font-semibold text-text-subtle ring-1 ring-white/8 transition hover:ring-brand-purple/40 hover:text-text-primary">
        View Details
      </button>
    </div>
  );
}

export function FeedScreen() {
  const { connected, events } = useFeed();
  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);

  useEffect(() => {
    tournamentsApi.list().then(setTournaments).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 px-5 pt-5 pb-4">
      {/* Active Tournaments */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Active Tournaments</h2>
          <button className="flex items-center gap-0.5 text-xs font-semibold text-brand-purple hover:text-brand-purple/80">
            See All <ChevronRight size={13} />
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {/* skeleton placeholders */}
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 w-44 flex-shrink-0 animate-pulse rounded-2xl bg-bg-card" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tournaments.map((t, i) => (
              <TournamentCoverCard key={t.id} t={t} idx={i} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Matches */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Your Upcoming Matches</h2>
        </div>
        <div className="space-y-3">
          <UpcomingMatchCard
            tournamentName="Cyber Strike Invitational"
            teamA="Shadow Walkers"
            teamB="Neon Knights"
            timeLabel="Starts in 15m"
            urgent
          />
          <UpcomingMatchCard
            tournamentName="Global Elite Masters"
            teamA="Team Liquid"
            teamB="Cloud9"
            timeLabel="Today, 4:30 PM"
          />
        </div>
      </section>

      {/* Live Events Feed */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Tournament Wall</h2>
          <span className={`flex items-center gap-1.5 text-[11px] font-medium ${connected ? 'text-status-live' : 'text-text-muted'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-status-live animate-pulse' : 'bg-text-muted'}`} />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl bg-bg-card p-5 text-center ring-1 ring-white/8">
            <Megaphone size={28} className="mx-auto mb-2 text-text-muted/40" />
            <p className="text-sm text-text-muted">No activity yet.</p>
            <p className="mt-0.5 text-xs text-text-muted/60">Results, announcements and check-ins appear here live.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => {
              const meta = EVENT_META[e.type] ?? { Icon: Bell, color: 'text-text-muted', label: e.type };
              const { Icon, color, label } = meta;
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-bg-card p-3.5 ring-1 ring-white/8">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-muted">{new Date(e.occurredAtUtc).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
