import { useCallback, useMemo, useState } from 'react';
import { X, Calendar, Clock, GitBranch, Layers, RefreshCw, Check, ChevronLeft } from 'lucide-react';
import { createEmptyDraft, FORMAT_LABELS, type TournamentDraft, type TournamentFormat } from '../../types/tournament';
import { StepSeeding, type StepProps } from './wizardSteps';
import { BracketVisualizer } from '../bracket/BracketVisualizer';
import { buildSingleElimination } from '../../lib/bracket';

interface WizardProps {
  onComplete: (draft: TournamentDraft) => void;
  onCancel?: () => void;
}

// ── Format selection card ────────────────────────────────────────────────────
const FORMAT_CARDS: { value: TournamentFormat; label: string; description: string; Icon: typeof GitBranch }[] = [
  {
    value: 'SingleElimination',
    label: 'Single Elimination',
    description: 'Standard knockout bracket. Lose once and you\'re out.',
    Icon: GitBranch,
  },
  {
    value: 'DoubleElimination',
    label: 'Double Elimination',
    description: 'Players have a second chance in a lower bracket.',
    Icon: Layers,
  },
  {
    value: 'RoundRobin',
    label: 'Round Robin',
    description: 'Everyone plays everyone. Most points wins.',
    Icon: RefreshCw,
  },
];

function FormatCard({
  label, description, Icon, selected, onSelect,
}: {
  value: TournamentFormat; label: string; description: string;
  Icon: typeof GitBranch; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${
        selected
          ? 'bg-brand-purple/15 ring-2 ring-brand-purple'
          : 'bg-bg-card ring-1 ring-white/8 hover:ring-white/20'
      }`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
        selected ? 'bg-brand-purple/30' : 'bg-bg-card-2'
      }`}>
        <Icon size={18} className={selected ? 'text-brand-purple' : 'text-text-muted'} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${selected ? 'text-text-primary' : 'text-text-subtle'}`}>{label}</p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{description}</p>
      </div>
      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? 'border-brand-purple bg-brand-purple' : 'border-white/20'
      }`}>
        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ── Step 1 — Rules (name, date, format) ────────────────────────────────────
function StepBasicRules({ draft, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-text-primary">Tournament Name</p>
        <input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Summer Smash 2026"
          className="w-full rounded-xl bg-bg-card-2 px-4 py-3 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-purple/60"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-text-primary">Start Date</p>
          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-muted" />
            <input
              type="date"
              className="w-full rounded-xl bg-bg-card-2 py-3 pl-9 pr-2 text-sm text-text-primary ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/60 [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-text-primary">Start Time</p>
          <div className="relative">
            <Clock size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-muted" />
            <input
              type="time"
              className="w-full rounded-xl bg-bg-card-2 py-3 pl-9 pr-2 text-sm text-text-primary ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/60 [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text-primary">Tournament Format</p>
        <div className="space-y-2">
          {FORMAT_CARDS.map((card) => (
            <FormatCard
              key={card.value}
              {...card}
              selected={draft.format === card.value}
              onSelect={() => update({ format: card.value })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Brackets preview ────────────────────────────────────────────────
function StepBrackets({ draft }: StepProps) {
  const bracket = useMemo(() => buildSingleElimination(draft.entrants), [draft.entrants]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Bracket preview based on {draft.entrants.length} entrants with {FORMAT_LABELS[draft.format]} format.
      </p>
      <BracketVisualizer
        model={bracket}
        tournamentName={draft.name || 'New Tournament'}
        format={FORMAT_LABELS[draft.format]}
        teamCount={draft.entrants.length}
      />
    </div>
  );
}

// ── Step definitions ─────────────────────────────────────────────────────────
interface StepDef {
  key: string;
  label: string;
  render: (props: StepProps) => JSX.Element;
  validate?: (draft: TournamentDraft) => string | null;
}

const STEPS: StepDef[] = [
  {
    key: 'rules',
    label: 'Rules',
    render: (p) => <StepBasicRules {...p} />,
    validate: (d) => (d.name.trim() ? null : 'Give your tournament a name to continue.'),
  },
  {
    key: 'teams',
    label: 'Teams',
    render: (p) => <StepSeeding {...p} />,
    validate: (d) => (d.entrants.length >= 2 ? null : 'Add at least two entrants.'),
  },
  {
    key: 'brackets',
    label: 'Brackets',
    render: (p) => <StepBrackets {...p} />,
  },
];

// ── Stepper pill indicator ───────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  active
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/40'
                    : done
                      ? 'bg-brand-purple/30 text-brand-purple'
                      : 'bg-bg-card-2 text-text-muted'
                }`}
              >
                {done ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-text-primary' : 'text-text-muted'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mb-3.5 h-px w-12 rounded transition ${done ? 'bg-brand-purple/50' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Wizard shell ─────────────────────────────────────────────────────────────
export function TournamentWizard({ onComplete, onCancel }: WizardProps) {
  const [draft, setDraft]   = useState<TournamentDraft>(createEmptyDraft);
  const [index, setIndex]   = useState(0);
  const [error, setError]   = useState<string | null>(null);

  const update = useCallback((patch: Partial<TournamentDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  }, []);

  const step   = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const stepProps = useMemo<StepProps>(() => ({ draft, update }), [draft, update]);

  const next = () => {
    const err = step.validate?.(draft) ?? null;
    if (err) { setError(err); return; }
    if (isLast) onComplete(draft);
    else setIndex((i) => i + 1);
  };

  const back = () => {
    setError(null);
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel ?? back}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card ring-1 ring-white/8 text-text-muted hover:text-text-subtle"
        >
          <X size={16} />
        </button>
        <h2 className="text-base font-bold text-text-primary">Tournament Wizard</h2>
        <button type="button" className="text-sm font-semibold text-brand-purple hover:text-brand-purple/80">
          Save
        </button>
      </div>

      {/* Stepper */}
      <Stepper current={index} />

      {/* Step content */}
      <div className="min-h-[300px]">
        {step.render(stepProps)}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl bg-status-danger/10 px-3 py-2.5 text-sm text-status-danger ring-1 ring-status-danger/20">
          {error}
        </p>
      )}

      {/* Footer buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          disabled={index === 0}
          className="flex-1 rounded-xl bg-bg-card py-3.5 text-sm font-semibold text-text-subtle ring-1 ring-white/8 transition hover:ring-white/20 disabled:opacity-40"
        >
          {index === 0 ? 'Cancel' : (
            <span className="flex items-center justify-center gap-1.5">
              <ChevronLeft size={14} /> Back
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={next}
          className="flex-1 rounded-xl bg-brand-purple py-3.5 text-sm font-bold text-white shadow-md shadow-brand-purple/30 transition hover:bg-brand-purple-dim"
        >
          {isLast ? 'Create Tournament' : 'Next Step'}
        </button>
      </div>
    </div>
  );
}
