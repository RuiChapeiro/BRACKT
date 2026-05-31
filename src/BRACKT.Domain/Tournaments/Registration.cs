using Brackt.Domain.Common;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// An entrant: a team's enrolment in a tournament. The unit competing in a match
/// is a registration, not a raw team — this decouples match history from later
/// roster changes and lets the same team enter multiple tournaments cleanly.
/// </summary>
public sealed class Registration : Entity
{
    public Guid TournamentId { get; private set; }
    public Guid TeamId { get; private set; }

    /// <summary>Display label / short name used on brackets and standings.</summary>
    public string SeedLabel { get; private set; } = null!;

    public DateTime RegisteredAtUtc { get; private set; } = DateTime.UtcNow;
    public bool IsConfirmed { get; private set; }
    public bool IsWithdrawn { get; private set; }

    private Registration() { } // EF

    internal Registration(Guid tournamentId, Guid teamId, string seedLabel)
    {
        TournamentId = tournamentId;
        TeamId = teamId;
        SeedLabel = seedLabel.Trim();
    }

    public void Confirm() => IsConfirmed = true;
    public void Withdraw() => IsWithdrawn = true;
}
