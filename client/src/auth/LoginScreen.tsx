import { useState } from 'react';
import { Button, Label, TextInput } from '../components/ui';
import { ApiError } from '../api/http';
import { useAuth } from './AuthContext';

/**
 * Combined Login / Register screen (RF1.1). Toggles between modes; on success the
 * AuthProvider stores the JWT and the app shell takes over.
 */
export function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, displayName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Is the API running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          BR<span className="text-brand-cyan">A</span>CK<span className="text-brand-purple">T</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-light/50">Tournament management, offline-first.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-deep/60 p-1 ring-1 ring-white/10">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); }}
            className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
              mode === m ? 'bg-gradient-to-r from-brand-purple to-brand-cyan text-white' : 'text-neutral-light/60'
            }`}
          >
            {m === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <Label>Display name</Label>
            <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required />
          </div>
        )}
        <div>
          <Label>Email</Label>
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <Label>Password</Label>
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/30">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
