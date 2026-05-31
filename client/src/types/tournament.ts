// Frontend draft model for the Tournament Creation Wizard. Mirrors the backend
// domain concepts (format, rule matrix, tie-breaker funnel, venues, seeding) but
// stays UI-local until submitted through the sync layer.

export type TournamentFormat =
  | 'SingleElimination'
  | 'DoubleElimination'
  | 'RoundRobin'
  | 'Swiss';

export type SeedingMethod = 'Manual' | 'Random';

/** RF4.3 / RF4.4 — point matrix + resolution toggles. */
export interface RuleMatrix {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  drawsAllowed: boolean;
  extraTime: boolean;
  penalties: boolean;
}

/** RF4.5 — one rung of the ordered tie-breaker funnel. */
export type TieBreakerType =
  | 'Points'
  | 'GoalDifference'
  | 'GoalsFor'
  | 'HeadToHead'
  | 'Wins'
  | 'FewestCards'
  | 'DrawOfLots';

export interface TieBreaker {
  id: string;
  type: TieBreakerType;
  direction: 'desc' | 'asc';
}

export interface VenueSlotDraft {
  id: string;
  start: string; // ISO / datetime-local value
  end: string;
}

export interface VenueDraft {
  id: string;
  name: string;
  capacity: number;
  slots: VenueSlotDraft[];
}

export interface EntrantDraft {
  id: string;
  name: string;
}

export interface TournamentDraft {
  name: string;
  description: string;
  format: TournamentFormat;
  maxParticipants: number;
  rules: RuleMatrix;
  tieBreakers: TieBreaker[];
  venues: VenueDraft[];
  seedingMethod: SeedingMethod;
  /** Ordered list = the seeding (index 0 is the top seed). */
  entrants: EntrantDraft[];
}

export const TIE_BREAKER_LABELS: Record<TieBreakerType, string> = {
  Points: 'Points',
  GoalDifference: 'Goal Difference',
  GoalsFor: 'Goals For',
  HeadToHead: 'Head-to-Head',
  Wins: 'Wins',
  FewestCards: 'Fewest Cards',
  DrawOfLots: 'Draw of Lots',
};

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  SingleElimination: 'Single Elimination',
  DoubleElimination: 'Double Elimination',
  RoundRobin: 'Round Robin',
  Swiss: 'Swiss',
};

/** A sensible starting draft for a new tournament. */
export function createEmptyDraft(): TournamentDraft {
  return {
    name: '',
    description: '',
    format: 'SingleElimination',
    maxParticipants: 8,
    rules: {
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      drawsAllowed: true,
      extraTime: false,
      penalties: false,
    },
    tieBreakers: [
      { id: crypto.randomUUID(), type: 'Points', direction: 'desc' },
      { id: crypto.randomUUID(), type: 'GoalDifference', direction: 'desc' },
      { id: crypto.randomUUID(), type: 'HeadToHead', direction: 'desc' },
    ],
    venues: [],
    seedingMethod: 'Manual',
    entrants: [],
  };
}
