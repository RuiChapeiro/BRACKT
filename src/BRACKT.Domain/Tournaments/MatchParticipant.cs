using Brackt.Domain.Common;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// One side of a match: a registration occupying a slot, plus its outcome. This
/// is the entity that recorded <c>MetricValue</c>s point at, so a team's per-match
/// stats are always anchored to a concrete contest and slot.
/// </summary>
public sealed class MatchParticipant : Entity
{
    public Guid MatchId { get; private set; }
    public int Slot { get; private set; }   // 0 or 1

    /// <summary>Null while the bracket slot is still awaiting a feeder result (a "bye"/TBD).</summary>
    public Guid? RegistrationId { get; private set; }

    public MatchOutcome Outcome { get; private set; } = MatchOutcome.Undecided;

    /// <summary>Quick-access aggregate score (e.g. goals) for display; detail lives in MetricValues.</summary>
    public decimal? Score { get; private set; }

    public bool IsCheckedIn { get; private set; }

    private MatchParticipant() { } // EF

    internal MatchParticipant(Guid matchId, int slot, Guid? registrationId)
    {
        MatchId = matchId;
        Slot = slot;
        RegistrationId = registrationId;
    }

    internal void AssignRegistration(Guid? registrationId) => RegistrationId = registrationId;
    internal void SetOutcome(MatchOutcome outcome) => Outcome = outcome;
    public void SetScore(decimal score) => Score = score;
    public void CheckIn() => IsCheckedIn = true;
}
