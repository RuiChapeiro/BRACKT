using Brackt.Domain.Common;

namespace Brackt.Domain.Tournaments.Events;

// These domain events are dispatched after a successful commit and are the
// bridge to the real-time layer (SignalR) and the push-notification dispatcher.

public sealed record TournamentStatusChanged(Guid TournamentId, TournamentStatus Status) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}

public sealed record TeamRegistered(Guid TournamentId, Guid RegistrationId, Guid TeamId) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}

/// <summary>RF2 / RF5.1 — schedule update; pushed live to participants' calendars.</summary>
public sealed record MatchScheduled(Guid MatchId, Guid StageId, DateTime StartUtc, Guid? VenueSlotId) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}

/// <summary>UC — "match start alert" push notification trigger.</summary>
public sealed record MatchStarted(Guid MatchId, Guid StageId, DateTime StartedAtUtc) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}

/// <summary>Drives advancement wiring, live standings recompute and result push.</summary>
public sealed record MatchResultRecorded(
    Guid MatchId, Guid StageId, Guid? WinnerRegistrationId, bool IsDraw, bool Walkover) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}
