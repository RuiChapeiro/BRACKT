import { useState } from 'react';
import { Share2, MoreVertical } from 'lucide-react';
import type { BracketMatch, BracketModel, BracketSlot } from '../../lib/bracket';

type BracketTab = 'upper' | 'lower' | 'finals';

const MATCH_HEIGHT = 68;

function SeedChip({ seed }: { seed: number }) {
  return (
    <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg-card-2 text-[10px] font-bold text-text-subtle">
      {seed}
    </span>
  );
}

function SlotRow({ slot }: { slot: BracketSlot }) {
  const { entrant, isBye, isWinner } = slot;
  return (
    <div className={`flex items-center justify-between px-3 py-2 text-sm ${isWinner ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
      <span className="flex min-w-0 items-center">
        {entrant ? <SeedChip seed={entrant.seed} /> : null}
        <span className="truncate">
          {entrant ? entrant.name : isBye ? <span className="italic text-text-muted/40">Bye</span> : 'TBD'}
        </span>
      </span>
      {slot.score != null && (
        <span className={`ml-2 tabular-nums text-xs font-semibold ${isWinner ? 'text-brand-purple' : 'text-text-muted/40'}`}>
          {slot.score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match, isFinal }: { match: BracketMatch; isFinal: boolean }) {
  const parityClass = match.matchNumber % 2 === 1 ? 'bk-top' : 'bk-bottom';
  const hasWinner = match.slots.some((s) => s.isWinner);
  return (
    <div className="flex flex-1 items-center">
      <div
        className={`bk-match ${isFinal ? 'bk-final' : parityClass} w-48 shrink-0`}
        style={{ minHeight: MATCH_HEIGHT }}
      >
        <div
          className={`overflow-hidden rounded-xl bg-bg-card ring-1 divide-y divide-white/6 ${
            hasWinner ? 'ring-brand-purple/40' : 'ring-white/8'
          }`}
        >
          <SlotRow slot={match.slots[0]} />
          <SlotRow slot={match.slots[1]} />
          {!hasWinner && (
            <div className="px-3 py-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted/40">TBD</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BracketVisualizer({ model, tournamentName = 'Tournament', format = 'Single Elimination', teamCount }: {
  model: BracketModel;
  tournamentName?: string;
  format?: string;
  teamCount?: number;
}) {
  const [activeTab, setActiveTab] = useState<BracketTab>('upper');

  if (model.rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-text-muted/40">
        Add at least two entrants to preview the bracket.
      </div>
    );
  }

  const firstRoundCount = model.rounds[0].matches.length;
  const columnHeight = firstRoundCount * MATCH_HEIGHT * 1.6;

  const TABS: { key: BracketTab; label: string }[] = [
    { key: 'upper',  label: 'Upper Bracket' },
    { key: 'lower',  label: 'Lower Bracket' },
    { key: 'finals', label: 'Finals' },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-1 pb-3">
        <div>
          <h3 className="font-bold text-text-primary">{tournamentName}</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            {format}{teamCount ? ` · ${teamCount} Teams` : ''}
          </p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-card-2">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex items-center gap-1 rounded-xl bg-bg-card p-1 ring-1 ring-white/8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              activeTab === tab.key
                ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/30'
                : 'text-text-muted hover:text-text-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bracket canvas */}
      {activeTab === 'upper' ? (
        <div className="bk-line overflow-x-auto rounded-2xl bg-bg-card p-4 ring-1 ring-white/8">
          <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
            {model.rounds.map((round, i) => (
              <div key={round.round} className="bk-col flex flex-col">
                <div className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-brand-purple">
                  {round.name}
                </div>
                <div className="flex flex-col justify-around" style={{ height: columnHeight }}>
                  {round.matches.map((match) => (
                    <MatchCard key={match.id} match={match} isFinal={i === model.rounds.length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-bg-card p-8 text-center ring-1 ring-white/8">
          <p className="text-sm text-text-muted">
            {activeTab === 'lower' ? 'Lower bracket' : 'Finals'} available after upper bracket completes.
          </p>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-xl bg-bg-card py-3 text-sm font-semibold text-text-subtle ring-1 ring-white/8 transition hover:ring-brand-purple/30 hover:text-text-primary">
          Enter Match Results
        </button>
        <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white shadow-md shadow-brand-purple/30 transition hover:bg-brand-purple-dim">
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
}
