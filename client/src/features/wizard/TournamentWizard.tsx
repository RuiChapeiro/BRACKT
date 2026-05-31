import { useMemo, useState } from 'react';
import { Button } from '../../components/ui';
import { createEmptyDraft, type TournamentDraft } from '../../types/tournament';
import { StepRules, StepSeeding, StepSetup, StepVenues, type StepProps } from './wizardSteps';

interface StepDef {
  key: string;
  title: string;
  render: (props: StepProps) => JSX.Element;
  /** Returns an error message if the step is incomplete, else null. */
  validate?: (draft: TournamentDraft) => string | null;
}

const STEPS: StepDef[] = [
  {
    key: 'setup',
    title: 'Setup',
    render: (p) => <StepSetup {...p} />,
    validate: (d) => (d.name.trim() ? null : 'Give your tournament a name to continue.'),
  },
  { key: 'rules', title: 'Rules', render: (p) => <StepRules {...p} /> },
  { key: 'venues', title: 'Venues', render: (p) => <StepVenues {...p} /> },
  {
    key: 'seeding',
    title: 'Seeding',
    render: (p) => <StepSeeding {...p} />,
    validate: (d) => (d.entrants.length >= 2 ? null : 'Add at least two entrants.'),
  },
];

interface WizardProps {
  onComplete: (draft: TournamentDraft) => void;
}

/** Step indicator: numbered pills with a connecting progress rail. */
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  active
                    ? 'bg-gradient-to-r from-brand-purple to-brand-cyan text-white'
                    : done
                      ? 'bg-brand-cyan/20 text-brand-cyan'
                      : 'bg-white/5 text-neutral-light/40'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] ${active ? 'text-neutral-light' : 'text-neutral-light/40'}`}>
                {step.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 mb-4 h-0.5 flex-1 rounded ${done ? 'bg-brand-cyan/40' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tournament Creation Wizard — Setup → Rules Matrix & Funnel → Venues → Seeding.
 * Holds the full draft in state; each step mutates it via a partial-merge updater.
 */
export function TournamentWizard({ onComplete }: WizardProps) {
  const [draft, setDraft] = useState<TournamentDraft>(createEmptyDraft);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<TournamentDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const stepProps = useMemo<StepProps>(() => ({ draft, update }), [draft]);

  const next = () => {
    const err = step.validate?.(draft) ?? null;
    if (err) {
      setError(err);
      return;
    }
    if (isLast) onComplete(draft);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col gap-5">
      <Stepper current={index} />

      <div className="min-h-[320px]">
        <h2 className="mb-4 text-lg font-bold text-neutral-light">{step.title}</h2>
        {step.render(stepProps)}
      </div>

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          ← Back
        </Button>
        <Button onClick={next} className="min-w-32">
          {isLast ? 'Create & Preview' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
