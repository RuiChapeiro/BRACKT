import { useState } from 'react';
import {
  FORMAT_LABELS,
  TIE_BREAKER_LABELS,
  type TieBreakerType,
  type TournamentDraft,
  type TournamentFormat,
} from '../../types/tournament';
import { Button, Card, IconButton, Label, NumberInput, Segmented, TextInput, Toggle } from '../../components/ui';

// Each step receives the draft and a partial-merge updater.
export interface StepProps {
  draft: TournamentDraft;
  update: (patch: Partial<TournamentDraft>) => void;
}

const uid = () => crypto.randomUUID();

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// ---------------------------------------------------------------------------
// Step 1 — Initial Setup
// ---------------------------------------------------------------------------
export function StepSetup({ draft, update }: StepProps) {
  const formatOptions = (Object.keys(FORMAT_LABELS) as TournamentFormat[]).map((f) => ({
    value: f,
    label: FORMAT_LABELS[f],
  }));

  return (
    <div className="space-y-5">
      <div>
        <Label>Tournament name</Label>
        <TextInput
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Spring Invitational 2026"
        />
      </div>
      <div>
        <Label>Description</Label>
        <TextInput
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Optional summary shown on the registration page"
        />
      </div>
      <div>
        <Label>Format</Label>
        <Segmented
          options={formatOptions}
          value={draft.format}
          onChange={(format) => update({ format })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Max participants</Label>
        <NumberInput
          value={draft.maxParticipants}
          min={2}
          max={256}
          onChange={(maxParticipants) => update({ maxParticipants })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Rules Matrix & Tie-Breaker Funnel
// ---------------------------------------------------------------------------
export function StepRules({ draft, update }: StepProps) {
  const { rules, tieBreakers } = draft;
  const setRule = (patch: Partial<typeof rules>) => update({ rules: { ...rules, ...patch } });

  const usedTypes = new Set(tieBreakers.map((t) => t.type));
  const available = (Object.keys(TIE_BREAKER_LABELS) as TieBreakerType[]).filter((t) => !usedTypes.has(t));

  const addCriterion = (type: TieBreakerType) =>
    update({
      tieBreakers: [
        ...tieBreakers,
        { id: uid(), type, direction: type === 'FewestCards' ? 'asc' : 'desc' },
      ],
    });

  return (
    <div className="space-y-6">
      <div>
        <Label>Points matrix</Label>
        <div className="grid grid-cols-3 gap-3">
          {(['Win', 'Draw', 'Loss'] as const).map((k) => {
            const key = `points${k}` as const;
            return (
              <Card key={k} className="flex flex-col items-center gap-2 !p-3">
                <span className="text-xs text-neutral-light/50">{k}</span>
                <NumberInput
                  value={rules[key]}
                  min={0}
                  onChange={(v) => setRule({ [key]: v } as Partial<typeof rules>)}
                />
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Resolution</Label>
        <Toggle label="Allow draws" checked={rules.drawsAllowed} onChange={(v) => setRule({ drawsAllowed: v })} />
        <Toggle label="Extra time" checked={rules.extraTime} onChange={(v) => setRule({ extraTime: v })} />
        <Toggle label="Penalty shootout" checked={rules.penalties} onChange={(v) => setRule({ penalties: v })} />
      </div>

      <div>
        <Label>Tie-breaker funnel (top priority first)</Label>
        <div className="space-y-2">
          {tieBreakers.map((tb, i) => (
            <div
              key={tb.id}
              className="flex items-center gap-2 rounded-xl bg-slate-deep/40 p-2 pl-3 ring-1 ring-white/10"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-purple/20 text-xs font-bold text-brand-purple">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-neutral-light/90">{TIE_BREAKER_LABELS[tb.type]}</span>
              <button
                type="button"
                onClick={() =>
                  update({
                    tieBreakers: tieBreakers.map((x) =>
                      x.id === tb.id ? { ...x, direction: x.direction === 'desc' ? 'asc' : 'desc' } : x,
                    ),
                  })
                }
                className="rounded-md px-2 py-1 text-xs font-semibold text-brand-cyan hover:bg-white/5"
                title="Toggle sort direction"
              >
                {tb.direction === 'desc' ? 'High → Low' : 'Low → High'}
              </button>
              <IconButton onClick={() => update({ tieBreakers: moveItem(tieBreakers, i, i - 1) })} disabled={i === 0}>
                ↑
              </IconButton>
              <IconButton
                onClick={() => update({ tieBreakers: moveItem(tieBreakers, i, i + 1) })}
                disabled={i === tieBreakers.length - 1}
              >
                ↓
              </IconButton>
              <IconButton
                onClick={() => update({ tieBreakers: tieBreakers.filter((x) => x.id !== tb.id) })}
                className="!text-rose-300"
              >
                ×
              </IconButton>
            </div>
          ))}
        </div>

        {available.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {available.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addCriterion(t)}
                className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-light/70
                           ring-1 ring-white/10 transition hover:text-neutral-light hover:ring-brand-cyan/50"
              >
                + {TIE_BREAKER_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Venues & Availability
// ---------------------------------------------------------------------------
export function StepVenues({ draft, update }: StepProps) {
  const { venues } = draft;

  const addVenue = () =>
    update({ venues: [...venues, { id: uid(), name: '', capacity: 1, slots: [] }] });

  const patchVenue = (id: string, patch: Partial<(typeof venues)[number]>) =>
    update({ venues: venues.map((v) => (v.id === id ? { ...v, ...patch } : v)) });

  return (
    <div className="space-y-4">
      {venues.length === 0 && (
        <p className="text-sm text-neutral-light/40">
          No venues yet. Add rooms/pitches and their availability windows — the scheduler uses these to detect
          conflicts.
        </p>
      )}

      {venues.map((venue) => (
        <Card key={venue.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <TextInput
              value={venue.name}
              placeholder="Venue name"
              onChange={(e) => patchVenue(venue.id, { name: e.target.value })}
            />
            <IconButton
              onClick={() => update({ venues: venues.filter((v) => v.id !== venue.id) })}
              className="!text-rose-300"
            >
              ×
            </IconButton>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-light/50">Concurrent capacity</span>
            <NumberInput
              value={venue.capacity}
              min={1}
              onChange={(capacity) => patchVenue(venue.id, { capacity })}
            />
          </div>

          <div className="space-y-2">
            {venue.slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={slot.start}
                  onChange={(e) =>
                    patchVenue(venue.id, {
                      slots: venue.slots.map((s) => (s.id === slot.id ? { ...s, start: e.target.value } : s)),
                    })
                  }
                  className="flex-1 rounded-lg bg-slate-deep/60 px-2 py-1.5 text-xs text-neutral-light ring-1 ring-white/10"
                />
                <span className="text-neutral-light/30">→</span>
                <input
                  type="datetime-local"
                  value={slot.end}
                  onChange={(e) =>
                    patchVenue(venue.id, {
                      slots: venue.slots.map((s) => (s.id === slot.id ? { ...s, end: e.target.value } : s)),
                    })
                  }
                  className="flex-1 rounded-lg bg-slate-deep/60 px-2 py-1.5 text-xs text-neutral-light ring-1 ring-white/10"
                />
                <IconButton
                  onClick={() =>
                    patchVenue(venue.id, { slots: venue.slots.filter((s) => s.id !== slot.id) })
                  }
                  className="!text-rose-300"
                >
                  ×
                </IconButton>
              </div>
            ))}
            <Button
              variant="ghost"
              className="!px-2 !py-1 text-xs"
              onClick={() =>
                patchVenue(venue.id, { slots: [...venue.slots, { id: uid(), start: '', end: '' }] })
              }
            >
              + Availability slot
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="secondary" className="w-full" onClick={addVenue}>
        + Add venue
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Seeding
// ---------------------------------------------------------------------------
export function StepSeeding({ draft, update }: StepProps) {
  const { entrants, seedingMethod } = draft;

  const addEntrant = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    update({ entrants: [...entrants, { id: uid(), name: trimmed }] });
  };

  const shuffle = () => {
    const copy = [...entrants];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    update({ entrants: copy });
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>Seeding method</Label>
        <Segmented
          options={[
            { value: 'Manual', label: 'Manual' },
            { value: 'Random', label: 'Random' },
          ]}
          value={seedingMethod}
          onChange={(seedingMethod) => update({ seedingMethod })}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Entrants ({entrants.length})</Label>
          {seedingMethod === 'Random' && entrants.length > 1 && (
            <button
              type="button"
              onClick={shuffle}
              className="text-xs font-semibold text-brand-cyan hover:underline"
            >
              ⤮ Shuffle seeds
            </button>
          )}
        </div>

        <div className="space-y-2">
          {entrants.map((e, i) => (
            <div
              key={e.id}
              className="flex items-center gap-2 rounded-xl bg-slate-deep/40 p-2 pl-3 ring-1 ring-white/10"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-cyan/15 text-xs font-bold text-brand-cyan">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-sm text-neutral-light/90">{e.name}</span>
              {seedingMethod === 'Manual' && (
                <>
                  <IconButton onClick={() => update({ entrants: moveItem(entrants, i, i - 1) })} disabled={i === 0}>
                    ↑
                  </IconButton>
                  <IconButton
                    onClick={() => update({ entrants: moveItem(entrants, i, i + 1) })}
                    disabled={i === entrants.length - 1}
                  >
                    ↓
                  </IconButton>
                </>
              )}
              <IconButton
                onClick={() => update({ entrants: entrants.filter((x) => x.id !== e.id) })}
                className="!text-rose-300"
              >
                ×
              </IconButton>
            </div>
          ))}
        </div>

        <EntrantAdder onAdd={addEntrant} />
      </div>
    </div>
  );
}

// Small controlled input + Enter-to-add for entrants.
function EntrantAdder({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const commit = () => {
    onAdd(name);
    setName('');
  };
  return (
    <div className="mt-3 flex gap-2">
      <TextInput
        value={name}
        placeholder="Add team / player name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
      />
      <Button onClick={commit} disabled={!name.trim()}>
        Add
      </Button>
    </div>
  );
}
