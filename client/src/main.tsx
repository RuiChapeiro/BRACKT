import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SyncProvider, SyncStatusBadge } from './offline';
import { TournamentWizard } from './features/wizard/TournamentWizard';
import { BracketVisualizer } from './features/bracket/BracketVisualizer';
import { buildSingleElimination, type BracketModel } from './lib/bracket';
import { FORMAT_LABELS, type TournamentDraft } from './types/tournament';
import './index.css';

type Tab = 'create' | 'bracket';

/**
 * Demo shell for Step 4: the Tournament Creation Wizard and the Bracket
 * Visualizer. Completing the wizard builds a live single-elimination preview
 * from the seeded entrants and switches to the bracket view. Everything mounts
 * inside the offline-first SyncProvider from Step 3.
 */
function App() {
  const [tab, setTab] = useState<Tab>('create');
  const [draft, setDraft] = useState<TournamentDraft | null>(null);

  const bracket = useMemo<BracketModel>(
    () => (draft ? buildSingleElimination(draft.entrants) : { rounds: [] }),
    [draft],
  );

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-deep/80 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold tracking-tight">
          BR<span className="text-brand-cyan">A</span>CK<span className="text-brand-purple">T</span>
        </h1>
        <SyncStatusBadge />
      </header>

      <nav className="flex gap-1 px-4 pt-3">
        {(['create', 'bracket'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              tab === t ? 'bg-white/10 text-neutral-light' : 'text-neutral-light/50 hover:text-neutral-light'
            }`}
          >
            {t === 'create' ? 'Create' : 'Bracket'}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4">
        {tab === 'create' ? (
          <TournamentWizard
            onComplete={(d) => {
              setDraft(d);
              setTab('bracket');
            }}
          />
        ) : (
          <div className="space-y-4">
            {draft && (
              <div>
                <h2 className="text-lg font-bold text-neutral-light">{draft.name || 'Untitled tournament'}</h2>
                <p className="text-sm text-neutral-light/50">
                  {FORMAT_LABELS[draft.format]} · {draft.entrants.length} entrants
                </p>
              </div>
            )}
            <BracketVisualizer model={bracket} />
          </div>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SyncProvider baseUrl={import.meta.env.VITE_API_BASE_URL ?? ''}>
      <App />
    </SyncProvider>
  </StrictMode>,
);
