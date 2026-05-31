import type { BracketMatch, BracketModel, BracketSlot } from '../../lib/bracket';

// ---------------------------------------------------------------------------
// Match Bracket Visualizer
// ---------------------------------------------------------------------------
// Mobile-first, horizontally scrollable single-elimination tree. Rounds are
// equal-height flex columns; CSS borders (see index.css .bk-* rules) draw the
// connectors. Palette: deep-slate canvas, cyan seed chips, a purple→cyan gradient
// highlight for winners.

const MATCH_HEIGHT = 64; // px — drives the column height calc

function SeedChip({ seed }: { seed: number }) {
  return (
    <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md
                     bg-brand-cyan/15 text-[10px] font-bold text-brand-cyan">
      {seed}
    </span>
  );
}

function SlotRow({ slot }: { slot: BracketSlot }) {
  const { entrant, isBye, isWinner } = slot;
  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 text-sm ${
        isWinner ? 'font-semibold text-neutral-light' : 'text-neutral-light/75'
      }`}
    >
      <span className="flex min-w-0 items-center">
        {entrant ? <SeedChip seed={entrant.seed} /> : null}
        <span className="truncate">
          {entrant ? entrant.name : isBye ? <span className="italic text-neutral-light/30">Bye</span> : 'TBD'}
        </span>
      </span>
      {slot.score != null && (
        <span className={`ml-2 tabular-nums ${isWinner ? 'text-brand-cyan' : 'text-neutral-light/40'}`}>
          {slot.score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match, isFinal }: { match: BracketMatch; isFinal: boolean }) {
  // Parity decides which way this match's connector bends toward its pair.
  const parityClass = match.matchNumber % 2 === 1 ? 'bk-top' : 'bk-bottom';
  const hasWinner = match.slots.some((s) => s.isWinner);
  return (
    <div className="flex flex-1 items-center">
      <div
        className={`bk-match ${isFinal ? 'bk-final' : parityClass} w-44 shrink-0`}
        style={{ minHeight: MATCH_HEIGHT }}
      >
        <div
          className={`overflow-hidden rounded-xl bg-white/[0.04] ring-1 ${
            hasWinner ? 'ring-brand-purple/40' : 'ring-white/10'
          } divide-y divide-white/5`}
        >
          <SlotRow slot={match.slots[0]} />
          <SlotRow slot={match.slots[1]} />
        </div>
      </div>
    </div>
  );
}

export function BracketVisualizer({ model }: { model: BracketModel }) {
  if (model.rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-neutral-light/40">
        Add at least two entrants to preview the bracket.
      </div>
    );
  }

  // All columns share the height of the first (largest) round so feeders align.
  const firstRoundCount = model.rounds[0].matches.length;
  const columnHeight = firstRoundCount * MATCH_HEIGHT * 1.6;

  return (
    <div className="bk-line overflow-x-auto pb-4">
      <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
        {model.rounds.map((round, i) => (
          <div key={round.round} className="bk-col flex flex-col">
            <div className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-brand-purple">
              {round.name}
            </div>
            <div
              className="flex flex-col justify-around"
              style={{ height: columnHeight }}
            >
              {round.matches.map((match) => (
                <MatchCard key={match.id} match={match} isFinal={i === model.rounds.length - 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
