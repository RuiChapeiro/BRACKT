import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SyncProvider } from './offline';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginScreen } from './auth/LoginScreen';
import { FeedProvider } from './realtime/FeedContext';
import { AppShell } from './app/AppShell';
import { API_BASE_URL, getToken } from './config';
import './index.css';

/**
 * Auth gate. While validating a stored token we show a splash; unauthenticated
 * users get the login screen; authenticated users get the full app, wrapped in
 * the offline-first SyncProvider (pointed at the live API + JWT) and the SignalR
 * FeedProvider for real-time updates.
 */
function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span className="animate-pulse text-2xl font-bold tracking-tight">
          BR<span className="text-brand-cyan">A</span>CK<span className="text-brand-purple">T</span>
        </span>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <SyncProvider baseUrl={API_BASE_URL} getToken={getToken}>
      <FeedProvider>
        <AppShell />
      </FeedProvider>
    </SyncProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);
