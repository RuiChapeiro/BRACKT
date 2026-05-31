using Brackt.Domain.Common;

namespace Brackt.Domain.Communication.Events;

/// <summary>RF6.2 — fans out into per-recipient notifications + a real-time wall push.</summary>
public sealed record AnnouncementPublished(
    Guid AnnouncementId,
    Guid TournamentId,
    string Title,
    bool DispatchPush) : IDomainEvent
{
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}
