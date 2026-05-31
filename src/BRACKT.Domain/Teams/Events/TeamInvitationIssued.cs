using Brackt.Domain.Common;

namespace Brackt.Domain.Teams.Events;

/// <summary>RF2.2 — drives the deep-link push notification / email dispatch.</summary>
public sealed record TeamInvitationIssued(
    Guid TeamId,
    Guid InvitationId,
    string InviteeEmail,
    string Token,
    DateTime ExpiresAtUtc) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}
