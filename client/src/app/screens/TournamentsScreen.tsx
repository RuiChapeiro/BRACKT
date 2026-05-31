import { useEffect, useState } from 'react';
import { Button, Card } from '../../components/ui';
import { tournamentsApi, type ApiTournament } from '../../api/endpoints';
import { ApiError } from '../../api/http';
import { TournamentWizard } from '../../features/wizard/TournamentWizard';
import { BracketVisualizer } from '../../features/bracket/BracketVisualizer';
import { buildSingleElimination, type BracketModel } from '../../lib/bracket';
import type { TournamentDraft } from '../../types/tournament';

type View = 'list' | 'create' | 'bracket';

/**
 * Tournaments tab. Lists tournaments from the API, launches the creation wizard,
 * and on completion POSTs the basics to the API (name/description/cap) before
 * showing a live single-elimination bracket preview built from the seeded entrants.
 */
export function TournamentsScreen() {
  const [view, setView] = useState<View>('list');
  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bracket, setBracket] = useState<BracketModel>({ rounds: [] });
  const [lastDraft, setLastDraft] = useState<TournamentDraft | null>(null);

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
      await tournamentsApi.create({
        name: draft.name,
        description: draft.description || undefined,
        maxParticipants: draft.maxParticipants,
      });
      setLastDraft(draft);
      setBracket(buildSingleElimination(draft.entrants));
      setView('bracket');
      refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create tournament.');
      setView('create');
    }
  };

  if (view === 'create') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('list')} className="text-sm text-neutral-light/50 hover:text-neutral-light">
          ← Tournaments
        </button>
        <TournamentWizard onComplete={handleComplete} />
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>
    );
  }

  if (view === 'bracket') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('list')} className="text-sm text-neutral-light/50 hover:text-neutral-light">
          ← Tournaments
        </button>
        {lastDraft && (
          <div>
            <h2 className="text-lg font-bold">{lastDraft.name}</h2>
            <p className="text-sm text-brand-cyan">Created · {lastDraft.entrants.length} entrants</p>
          </div>
        )}
        <BracketVisualizer model={bracket} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Tournaments</h2>
        <Button className="!px-3 !py-1.5 text-xs" onClick={() => setView('create')}>
          + New
        </Button>
      </div>

      {loading && <p className="text-sm text-neutral-light/40">Loading…</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}

      {!loading && tournaments.length === 0 && (
        <Card className="text-center text-sm text-neutral-light/40">
          No tournaments yet. Tap <span className="text-brand-cyan">+ New</span> to create one.
        </Card>
      )}

      <div className="space-y-2">
        {tournaments.map((t) => (
          <Card key={t.id} className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold text-neutral-light">{t.name}</p>
              <p className="text-xs text-neutral-light/40">
                {t.status}
                {t.maxParticipants ? ` · up to ${t.maxParticipants}` : ''}
              </p>
            </div>
            <span className="rounded-full bg-brand-purple/15 px-2.5 py-1 text-xs font-medium text-brand-purple">
              {t.status}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
