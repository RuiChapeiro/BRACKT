using Brackt.Domain.Common;

namespace Brackt.Domain.Logistics;

/// <summary>
/// RF5.2 — a detected scheduling clash surfaced to the organizer dashboard as a
/// warning alert. Persisted (rather than computed-only) so an organizer can
/// acknowledge/dismiss it and so it can be pushed live to the conflict feed.
///
/// Three detectable kinds (see <see cref="ScheduleConflictType"/>):
///   • the same venue booked beyond capacity at overlapping times,
///   • the same player scheduled in two matches at overlapping times,
///   • a match scheduled outside its venue's declared availability.
/// </summary>
public sealed class ScheduleConflict : AggregateRoot
{
    public Guid TournamentId { get; private set; }
    public ScheduleConflictType Type { get; private set; }
    public ConflictSeverity Severity { get; private set; }

    /// <summary>The two matches in conflict (the second is null for an availability breach).</summary>
    public Guid PrimaryMatchId { get; private set; }
    public Guid? SecondaryMatchId { get; private set; }

    /// <summary>The clashing resource: a VenueSlotId or a PlayerId, depending on Type.</summary>
    public Guid? ResourceId { get; private set; }

    public string Message { get; private set; } = null!;
    public bool IsResolved { get; private set; }
    public DateTime? ResolvedAtUtc { get; private set; }

    private ScheduleConflict() { } // EF

    public ScheduleConflict(Guid tournamentId, ScheduleConflictType type, ConflictSeverity severity,
                            Guid primaryMatchId, string message, Guid? secondaryMatchId = null, Guid? resourceId = null)
    {
        TournamentId = tournamentId;
        Type = type;
        Severity = severity;
        PrimaryMatchId = primaryMatchId;
        SecondaryMatchId = secondaryMatchId;
        ResourceId = resourceId;
        Message = message;
    }

    public void Resolve()
    {
        if (IsResolved) return;
        IsResolved = true;
        ResolvedAtUtc = DateTime.UtcNow;
        Touch();
    }
}
