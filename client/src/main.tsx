import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SyncProvider, SyncStatusBadge } from './offline';
import './index.css';

// Minimal shell for now — the bottom navigation, tournament wizard and bracket
// visualizer (Step 4) mount inside this SyncProvider so every screen shares one
// offline-first sync engine.
function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight">
          BR<span className="text-brand-cyan">A</span>CK<span className="text-brand-purple">T</span>
        </h1>
        <SyncStatusBadge />
      </header>
      <main className="flex-1 px-4">
        <p className="mt-10 text-center text-neutral-light/60">
          Offline-first sync is live. UI screens land in Step 4.
        </p>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SyncProvider baseUrl={import.meta.env.VITE_API_BASE_URL ?? ''}>
      <App />
    </SyncProvider>
  </StrictMode>,
);
