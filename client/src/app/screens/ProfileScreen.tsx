import { Button, Card } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

/** Profile — account details + logout. (Career stats / ghost-claiming land later.) */
export function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Profile</h2>

      <Card className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan text-xl font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-neutral-light">{user.displayName}</p>
          <p className="truncate text-sm text-neutral-light/50">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-cyan/15 px-2 py-0.5 text-xs font-medium text-brand-cyan">
            {user.role}
          </span>
        </div>
      </Card>

      <Card className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-light/50">Player ID</span>
          <span className="font-mono text-xs text-neutral-light/70">{user.playerId.slice(0, 8)}…</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-light/50">Account ID</span>
          <span className="font-mono text-xs text-neutral-light/70">{user.id.slice(0, 8)}…</span>
        </div>
      </Card>

      <Button variant="danger" className="w-full" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
