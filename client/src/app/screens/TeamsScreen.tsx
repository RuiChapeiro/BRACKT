import { Card } from '../../components/ui';

/** Teams — roster + invites. Placeholder until the teams endpoints are wired. */
export function TeamsScreen() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Teams</h2>
      <Card className="text-center text-sm text-neutral-light/40">
        Your rosters and invitations will appear here.
      </Card>
    </div>
  );
}
