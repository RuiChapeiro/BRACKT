using Brackt.Domain.Common;

namespace Brackt.Domain.Logistics;

/// <summary>
/// RF5.3 / UC12 / UC14 — a digital check-in record for the real-time virtual
/// lobby. A player, team or captain confirms presence ahead of a match; the hub
/// broadcasts lobby state live. Recorded as its own entity so check-ins survive
/// offline capture and replay (the subject checks in on their device, the op
/// syncs later carrying its original timestamp).
/// </summary>
public sealed class CheckIn : Entity
{
    public Guid MatchId { get; private set; }
    public CheckInSubjectType SubjectType { get; private set; }

    /// <summary>PlayerId, TeamId or captain's PlayerId depending on SubjectType.</summary>
    public Guid SubjectId { get; private set; }

    /// <summary>Which side of the match this check-in belongs to.</summary>
    public Guid MatchParticipantId { get; private set; }

    public DateTime CheckedInAtUtc { get; private set; }
    public Guid CheckedInByUserId { get; private set; }

    private CheckIn() { } // EF

    public CheckIn(Guid matchId, Guid matchParticipantId, CheckInSubjectType subjectType,
                   Guid subjectId, Guid checkedInByUserId, DateTime? capturedAtUtc = null)
    {
        MatchId = matchId;
        MatchParticipantId = matchParticipantId;
        SubjectType = subjectType;
        SubjectId = subjectId;
        CheckedInByUserId = checkedInByUserId;
        // Preserve the moment of capture for offline-recorded check-ins.
        CheckedInAtUtc = capturedAtUtc ?? DateTime.UtcNow;
    }
}
