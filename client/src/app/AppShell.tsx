import { useState } from 'react';
import { SyncStatusBadge } from '../offline';
import { FeedScreen } from './screens/FeedScreen';
import { TournamentsScreen } from './screens/TournamentsScreen';
import { TeamsScreen } from './screens/TeamsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

type Tab = 'feed' | 'tournaments' | 'teams' | 'profile';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'feed', label: 'Feed', icon: '🏠' },
  { key: 'tournaments', label: 'Tournaments', icon: '🏆' },
  { key: 'teams', label: 'Teams', icon: '👥' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

/** Authenticated app shell: header + screen + the bottom navigation (RF nav structure). */
export function AppShell() {
  const [tab, setTab] = useState<Tab>('feed');

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-deep/80 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold tracking-tight">
          BR<span className="text-brand-cyan">A</span>CK<span className="text-brand-purple">T</span>
        </h1>
        <SyncStatusBadge />
      </header>

      <main className="flex-1 p-4 pb-24">
        {tab === 'feed' && <FeedScreen />}
        {tab === 'tournaments' && <TournamentsScreen />}
        {tab === 'teams' && <TeamsScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-white/10 bg-slate-deep/90 backdrop-blur">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                tab === t.key ? 'text-brand-cyan' : 'text-neutral-light/45 hover:text-neutral-light/70'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
