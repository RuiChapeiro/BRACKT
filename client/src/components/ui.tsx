import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Small, palette-driven UI primitives shared across BRACKT screens.
//   slate-deep   #0F172A  background
//   brand-purple #8B5CF6  accent 1
//   brand-cyan   #06B6D4  accent 2
//   neutral-light#F8FAFC  text
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-purple/20 ' +
    'hover:brightness-110 active:brightness-95',
  secondary: 'bg-white/5 text-neutral-light ring-1 ring-white/10 hover:bg-white/10',
  ghost: 'text-neutral-light/70 hover:text-neutral-light hover:bg-white/5',
  danger: 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm
                  font-semibold transition disabled:cursor-not-allowed disabled:opacity-40
                  ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-light/70
                  ring-1 ring-white/10 transition hover:bg-white/10 hover:text-neutral-light
                  disabled:opacity-30 ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-light/50">
      {children}
    </label>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl bg-slate-deep/60 px-3.5 py-2.5 text-sm text-neutral-light
                  ring-1 ring-white/10 transition placeholder:text-neutral-light/30
                  focus:outline-none focus:ring-2 focus:ring-brand-cyan/60 ${className}`}
      {...props}
    />
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function NumberInput({ value, onChange, min, max, className = '' }: NumberInputProps) {
  const clamp = (n: number) => {
    let v = Number.isNaN(n) ? 0 : n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    return v;
  };
  return (
    <div className={`inline-flex items-center rounded-xl bg-slate-deep/60 ring-1 ring-white/10 ${className}`}>
      <button
        type="button"
        className="px-3 py-2 text-neutral-light/60 hover:text-brand-cyan"
        onClick={() => onChange(clamp(value - 1))}
        aria-label="decrease"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        className="w-12 bg-transparent text-center text-sm font-semibold text-neutral-light focus:outline-none
                   [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        className="px-3 py-2 text-neutral-light/60 hover:text-brand-cyan"
        onClick={() => onChange(clamp(value + 1))}
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl bg-slate-deep/40 px-3.5 py-3
                 ring-1 ring-white/10 transition hover:ring-white/20"
    >
      <span className="text-sm text-neutral-light/90">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? 'bg-brand-cyan' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-deep/60 p-1 ring-1 ring-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
            value === o.value
              ? 'bg-gradient-to-r from-brand-purple to-brand-cyan text-white shadow'
              : 'text-neutral-light/60 hover:text-neutral-light'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
