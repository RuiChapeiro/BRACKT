using Brackt.Domain.Common;

namespace Brackt.Domain.Players.Events;

/// <summary>
/// RF1.3 — raised when a ghost is absorbed into a real player. Drives the
/// history re-link side effect and a real-time notification to interested feeds.
/// </summary>
public sealed record GhostPlayerClaimed(
    Guid GhostPlayerId,
    Guid SurvivingPlayerId,
    Guid ClaimedByUserId,
    DateTime OccurredAtUtc) : IDomainEvent;
