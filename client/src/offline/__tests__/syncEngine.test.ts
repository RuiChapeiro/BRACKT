import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { LocalStore } from '../db';
import { SyncEngine } from '../syncEngine';
import { scoreMatch, checkIn } from '../actions';
import type { SendResult, SyncApi, SyncOperation } from '../types';

/**
 * A scriptable fake transport. By default every send "applies"; individual tests
 * override `handler` to simulate offline failures, conflicts and rejections. It
 * records the order operations were sent in, which is how we assert sequential,
 * in-order replay.
 */
class FakeApi implements SyncApi {
  readonly sent: SyncOperation[] = [];
  handler: (op: SyncOperation, callIndex: number) => SendResult = () => ({
    outcome: 'applied',
    rowVersion: 1,
  });

  async send(op: SyncOperation): Promise<SendResult> {
    const index = this.sent.length;
    this.sent.push({ ...op });
    return this.handler(op, index);
  }
}

// A no-op retry scheduler keeps tests deterministic (no real timers).
const noSchedule = () => {};

async function freshStore(): Promise<LocalStore> {
  // Reset IndexedDB between tests for isolation.
  globalThis.indexedDB = new IDBFactory();
  return LocalStore.open();
}

describe('SyncEngine — offline-first outbox', () => {
  let store: LocalStore;
  let api: FakeApi;

  beforeEach(async () => {
    store = await freshStore();
    api = new FakeApi();
  });

  afterEach(() => vi.restoreAllMocks());

  it('queues actions locally while offline and sends nothing', async () => {
    const engine = new SyncEngine(store, api, { online: false, autoFlush: false, scheduleRetry: noSchedule });

    await engine.enqueue(checkIn({ matchId: 'm1', matchParticipantId: 'p1', subjectType: 'Player', subjectId: 'pl1' }));
    await engine.enqueue(scoreMatch({ matchId: 'm1', scores: { p1: 2, p2: 1 }, isDraw: false }, 0));

    expect(api.sent).toHaveLength(0); // nothing left the device
    expect(engine.snapshot().pending).toBe(2);
    expect(engine.snapshot().online).toBe(false);
  });

  it('flushes the queue sequentially and in capture order once online', async () => {
    const engine = new SyncEngine(store, api, { online: false, autoFlush: false, scheduleRetry: noSchedule });

    const a = checkIn({ matchId: 'm1', matchParticipantId: 'p1', subjectType: 'Player', subjectId: 'pl1' });
    const b = scoreMatch({ matchId: 'm1', scores: { p1: 2, p2: 1 }, isDraw: false }, 0);
    await engine.enqueue(a);
    await engine.enqueue(b);

    engine.setOnline(true); // reconnect → triggers drain
    await engine.flush();

    expect(api.sent.map((o) => o.id)).toEqual([a.id, b.id]); // FIFO preserved
    expect(engine.snapshot().pending).toBe(0); // outbox drained
  });

  it('stops on a transient failure and preserves order, then resumes', async () => {
    const engine = new SyncEngine(store, api, { online: true, autoFlush: false, scheduleRetry: noSchedule });

    const a = scoreMatch({ matchId: 'm1', scores: { p1: 1, p2: 0 }, isDraw: false }, 0);
    const b = scoreMatch({ matchId: 'm2', scores: { p1: 0, p2: 0 }, isDraw: true }, 0);

    // First op fails as "unavailable" on its first attempt, succeeds afterwards.
    let firstTrySeen = false;
    api.handler = (op) => {
      if (op.id === a.id && !firstTrySeen) {
        firstTrySeen = true;
        return { outcome: 'unavailable', error: 'offline' };
      }
      return { outcome: 'applied', rowVersion: 1 };
    };

    await engine.enqueue(a);
    await engine.enqueue(b);

    // First drain: a fails transiently → drain stops before b (order preserved).
    await engine.flush();
    expect(api.sent.map((o) => o.id)).toEqual([a.id]);
    expect(engine.snapshot().pending).toBe(2); // both still queued, order intact

    // Connectivity restored / retry fires → drains the rest in order.
    await engine.flush();
    expect(api.sent.map((o) => o.id)).toEqual([a.id, a.id, b.id]); // a retried, then b
    expect(engine.snapshot().pending).toBe(0);
  });

  it('adopts server state on conflict (server-wins) and records it', async () => {
    const engine = new SyncEngine(store, api, { online: true, autoFlush: false, scheduleRetry: noSchedule });

    const op = scoreMatch({ matchId: 'm9', scores: { p1: 3, p2: 3 }, isDraw: true }, /* base */ 1);
    api.handler = () => ({
      outcome: 'conflict',
      serverEntity: { data: { matchId: 'm9', winner: 'p1' }, rowVersion: 7 },
    });

    await engine.enqueue(op, { data: { matchId: 'm9', draft: true }, rowVersion: 1 });
    await engine.flush();

    // Op removed, cache holds the server's authoritative version.
    expect(engine.snapshot().pending).toBe(0);
    const cached = await store.getEntity<{ winner: string }>('match', 'm9');
    expect(cached?.rowVersion).toBe(7);
    expect(cached?.data.winner).toBe('p1');
    expect(cached?.dirty).toBe(false);

    const conflicts = await store.allConflicts();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].serverRowVersion).toBe(7);
  });

  it('poisons a rejected op but keeps draining the rest', async () => {
    const engine = new SyncEngine(store, api, { online: true, autoFlush: false, scheduleRetry: noSchedule });

    const bad = scoreMatch({ matchId: 'mX', scores: {}, isDraw: false }, 0);
    const good = checkIn({ matchId: 'mY', matchParticipantId: 'pY', subjectType: 'Team', subjectId: 't1' });

    api.handler = (op) =>
      op.id === bad.id
        ? { outcome: 'rejected', error: 'invalid score' }
        : { outcome: 'applied', rowVersion: 1 };

    await engine.enqueue(bad);
    await engine.enqueue(good);
    await engine.flush();

    const snap = engine.snapshot();
    expect(snap.failed).toBe(1); // bad op poisoned
    expect(snap.pending).toBe(0); // good op went through
    expect(api.sent.some((o) => o.id === good.id)).toBe(true);
  });

  it('persists the outbox across engine restarts (durability)', async () => {
    const engine1 = new SyncEngine(store, api, { online: false, autoFlush: false, scheduleRetry: noSchedule });
    await engine1.enqueue(checkIn({ matchId: 'm1', matchParticipantId: 'p1', subjectType: 'Captain', subjectId: 'c1' }));

    // Simulate app restart: brand-new engine over the SAME IndexedDB.
    const reopened = await LocalStore.open();
    const engine2 = new SyncEngine(reopened, api, { online: true, autoFlush: false, scheduleRetry: noSchedule });
    await engine2.flush();

    expect(api.sent).toHaveLength(1); // the queued op survived and was sent
  });
});
