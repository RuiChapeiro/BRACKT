using Brackt.Domain.Common;
using Brackt.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;

namespace Brackt.Api.Realtime;

/// <summary>
/// Bridges committed domain events to connected clients over SignalR — the
/// concrete implementation of the <see cref="IDomainEventDispatcher"/> the
/// DbContext invokes after a successful save. Each event is broadcast as a
/// "DomainEvent" message carrying its type name + payload, which the client maps
/// to feed updates / push notifications.
/// </summary>
public sealed class SignalRDomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IHubContext<NotificationsHub> _hub;

    public SignalRDomainEventDispatcher(IHubContext<NotificationsHub> hub) => _hub = hub;

    public async Task DispatchAsync(IReadOnlyCollection<IDomainEvent> events, CancellationToken ct = default)
    {
        foreach (var @event in events)
        {
            var envelope = new
            {
                type = @event.GetType().Name,
                occurredAtUtc = @event.OccurredAtUtc,
                payload = @event,
            };
            await _hub.Clients.All.SendAsync("DomainEvent", envelope, ct);
        }
    }
}
