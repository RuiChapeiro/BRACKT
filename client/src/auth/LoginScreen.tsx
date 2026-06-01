import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { ApiError } from '../api/http';
import { useAuth } from './AuthContext';
import logo from '../../assets/images/logo.png';

export function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-bg-base px-6 py-12">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center">
        <img src={logo} alt="BRACKT" className="mb-2 h-16 w-auto object-contain" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm space-y-5">
        {mode === 'register' && (
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Display Name</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                <Mail size={16} />
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-xl bg-bg-card-2 py-3 pl-10 pr-4 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-purple/60"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-text-primary">Email Address</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
              <Mail size={16} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-xl bg-bg-card-2 py-3 pl-10 pr-4 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-purple/60"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-text-primary">Password</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
              <Lock size={16} />
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl bg-bg-card-2 py-3 pl-10 pr-10 text-sm text-text-primary ring-1 ring-white/10 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-purple/60"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-subtle"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mode === 'login' && (
            <div className="text-right">
              <button type="button" className="text-xs font-medium text-brand-purple hover:text-brand-purple/80">
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-status-danger/10 px-3 py-2.5 text-sm text-status-danger ring-1 ring-status-danger/30">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-purple py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-purple/30 transition hover:bg-brand-purple-dim disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-text-muted">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <p className="text-center text-sm text-text-muted">
          {mode === 'login' ? (
            <>
              New to BRACKT?{' '}
              <button type="button" onClick={() => switchMode('register')} className="font-semibold text-brand-purple hover:underline">
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} className="font-semibold text-brand-purple hover:underline">
                Sign In
              </button>
            </>
          )}
        </p>

        <p className="text-center text-[11px] text-text-muted/60">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  );
}
