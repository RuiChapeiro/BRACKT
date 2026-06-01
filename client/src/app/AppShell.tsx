import { useState } from 'react';
import { Home, Compass, Users, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { SyncStatusBadge } from '../offline';
import { FeedScreen } from './screens/FeedScreen';
import { OrganizerHub } from './screens/OrganizerHub';
import { TournamentsScreen } from './screens/TournamentsScreen';
import { TeamsScreen } from './screens/TeamsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import icon from '../../assets/images/icon.png';

type Tab = 'home' | 'discover' | 'teams' | 'profile';

type NavDef = { key: Tab; label: string; Icon: typeof Home };

const PLAYER_TABS: NavDef[] = [
  { key: 'home',     label: 'Home',     Icon: Home    },
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'teams',    label: 'Teams',    Icon: Users   },
  { key: 'profile',  label: 'Profile',  Icon: User    },
];

const ORGANIZER_TABS: NavDef[] = [
  { key: 'home',     label: 'Hub',      Icon: LayoutDashboard },
  { key: 'discover', label: 'Events',   Icon: Compass         },
  { key: 'teams',    label: 'Teams',    Icon: Users           },
  { key: 'profile',  label: 'Profile',  Icon: User            },
];

const isOrganizer = (role?: string) => role === 'Organizer' || role === 'Moderator';

export function AppShell() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('home');

  const organizer = isOrganizer(user?.role);
  const tabs = organizer ? ORGANIZER_TABS : PLAYER_TABS;
  const firstName = user?.displayName?.split(' ')[0] ?? 'Player';

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-bg-base">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-bg-nav/90 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-xs text-text-muted">Welcome back,</p>
          <h1 className="text-lg font-bold leading-tight text-text-primary">{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatusBadge />
          {organizer && (
            <span className="rounded-full bg-brand-purple/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-purple">
              {user?.role}
            </span>
          )}
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card ring-1 ring-white/10">
            <img src={icon} alt="BRACKT" className="h-5 w-5 object-contain" />
          </button>
        </div>
      </header>

      {/* Screen content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'home'     && (organizer ? <OrganizerHub /> : <FeedScreen />)}
        {tab === 'discover' && <TournamentsScreen />}
        {tab === 'teams'    && <TeamsScreen />}
        {tab === 'profile'  && <ProfileScreen />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-white/10 bg-bg-nav/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {tabs.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition ${
                  active ? 'text-brand-purple' : 'text-text-muted hover:text-text-subtle'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]' : ''}
                />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
