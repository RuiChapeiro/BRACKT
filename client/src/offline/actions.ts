import type { SyncOperation } from './types';
import { newId } from './uuid';

// ---------------------------------------------------------------------------
// Domain action builders
// ---------------------------------------------------------------------------
// Typed helpers that construct SyncOperations for the offline-capable actions
// called out in the requirements (match scoring, lobby check-in). Each returns a
// ready-to-enqueue operation with a fresh client GUID idempotency key.

export interface ScoreMatchPayload {
  matchId: string;
  /** Per-participant scores keyed by matchParticipantId. */
  scores: Record<string, number>;
  winnerRegistrationId?: string;
  isDraw: boolean;
}

/** RF — record/score a match result offline. */
export function scoreMatch(payload: ScoreMatchPayload, baseRowVersion?: number): SyncOperation<ScoreMatchPayload> {
  return {
    id: newId(),
    kind: 'match.score',
    method: 'POST',
    endpoint: `/api/matches/${payload.matchId}/result`,
    payload,
    entityType: 'match',
    entityId: payload.matchId,
    baseRowVersion,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  };
}

export interface CheckInPayload {
  matchId: string;
  matchParticipantId: string;
  subjectType: 'Player' | 'Team' | 'Captain';
  subjectId: string;
}

/** RF5.3 — digital lobby check-in offline. */
export function checkIn(payload: CheckInPayload): SyncOperation<CheckInPayload> {
  return {
    id: newId(),
    kind: 'checkin.create',
    method: 'POST',
    endpoint: `/api/matches/${payload.matchId}/check-ins`,
    payload,
    entityType: 'checkin',
    entityId: payload.matchParticipantId,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  };
}

export interface AnnouncementPayload {
  tournamentId: string;
  title: string;
  body: string;
  linkUrl?: string;
}

/** RF6.1 — post to the tournament wall offline. */
export function postAnnouncement(payload: AnnouncementPayload): SyncOperation<AnnouncementPayload> {
  const id = newId();
  return {
    id,
    kind: 'announcement.create',
    method: 'POST',
    endpoint: `/api/tournaments/${payload.tournamentId}/announcements`,
    payload,
    entityType: 'announcement',
    entityId: id,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  };
}
