using Microsoft.AspNetCore.SignalR;

namespace Brackt.Api.Realtime;

/// <summary>
/// Real-time channel for live updates and push (RF6.2 megaphone, match-start
/// alerts, schedule changes, lobby check-ins). Clients subscribe to a tournament
/// group to receive only that tournament's events.
/// </summary>
public sealed class NotificationsHub : Hub
{
    public Task JoinTournament(string tournamentId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, GroupFor(tournamentId));

    public Task LeaveTournament(string tournamentId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupFor(tournamentId));

    public static string GroupFor(string tournamentId) => $"tournament:{tournamentId}";
}
