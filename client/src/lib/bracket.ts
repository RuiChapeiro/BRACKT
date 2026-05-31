import type { EntrantDraft } from '../types/tournament';

// ---------------------------------------------------------------------------
// Client-side single-elimination preview builder
// ---------------------------------------------------------------------------
// A faithful TypeScript port of the backend SeedingHelper so the wizard can show
// an accurate bracket preview before the server generates the authoritative one.
// (The server remains the source of truth; this is purely for visualization.)

export interface BracketEntrant {
  id: string;
  name: string;
  seed: number;
}

export interface BracketSlot {
  entrant: BracketEntrant | null; // null = TBD (awaiting a feeder result)
  isBye: boolean;
  isWinner: boolean;
  score?: number;
}

export interface BracketMatch {
  id: string;
  round: number; // 1-based
  matchNumber: number;
  slots: [BracketSlot, BracketSlot];
}

export interface BracketRound {
  round: number;
  name: string;
  matches: BracketMatch[];
}

export interface BracketModel {
  rounds: BracketRound[];
}

export function nextPowerOfTwo(n: number): number {
  if (n < 2) return 2;
  let size = 1;
  while (size < n) size <<= 1;
  return size;
}

/** Standard bracket seed placement — identical recurrence to the backend. */
export function standardBracketSeedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const sum = order.length * 2 + 1;
    const next: number[] = [];
    for (const s of order) {
      next.push(s, sum - s);
    }
    order = next;
  }
  return order;
}

function roundName(round: number, totalRounds: number, size: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return 'Quarterfinals';
  return `Round of ${size >> (round - 1)}`;
}

const emptySlot = (): BracketSlot => ({ entrant: null, isBye: false, isWinner: false });

/**
 * Build a single-elimination bracket model from a seeded entrant list (index 0 =
 * top seed). First-round byes are auto-advanced so the preview matches what the
 * engine produces.
 */
export function buildSingleElimination(entrants: EntrantDraft[]): BracketModel {
  const n = entrants.length;
  if (n < 2) return { rounds: [] };

  const size = nextPowerOfTwo(n);
  const totalRounds = Math.log2(size);
  const slotSeeds = standardBracketSeedOrder(size);

  const seeded: BracketEntrant[] = entrants.map((e, i) => ({ id: e.id, name: e.name, seed: i + 1 }));
  const forSeed = (seedNo: number): BracketEntrant | null => (seedNo <= n ? seeded[seedNo - 1] : null);

  // Materialise every round; later rounds start as TBD slots.
  const rounds: BracketRound[] = [];
  for (let round = 1; round <= totalRounds; round++) {
    const count = size >> round;
    const matches: BracketMatch[] = [];
    for (let k = 0; k < count; k++) {
      const slots: [BracketSlot, BracketSlot] = [emptySlot(), emptySlot()];
      if (round === 1) {
        const a = forSeed(slotSeeds[2 * k]);
        const b = forSeed(slotSeeds[2 * k + 1]);
        slots[0] = { entrant: a, isBye: a === null, isWinner: false };
        slots[1] = { entrant: b, isBye: b === null, isWinner: false };
      }
      matches.push({ id: `r${round}m${k + 1}`, round, matchNumber: k + 1, slots });
    }
    rounds.push({ round, name: roundName(round, totalRounds, size), matches });
  }

  // Auto-advance first-round byes into round 2.
  if (rounds.length > 1) {
    rounds[0].matches.forEach((match, k) => {
      const present = match.slots.filter((s) => s.entrant !== null);
      if (present.length === 1) {
        present[0].isWinner = true;
        const nextMatch = rounds[1].matches[Math.floor(k / 2)];
        nextMatch.slots[k % 2] = { entrant: present[0].entrant, isBye: false, isWinner: false };
      }
    });
  }

  return { rounds };
}
