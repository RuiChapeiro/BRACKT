using Brackt.Domain.Common;

namespace Brackt.Domain.Teams;

/// <summary>A roster slot linking a <c>Player</c> (ghost or real) to a <c>Team</c>.</summary>
public sealed class TeamMember : Entity
{
    public Guid TeamId { get; private set; }
    public Guid PlayerId { get; private set; }
    public bool IsCaptain { get; private set; }
    public DateTime JoinedAtUtc { get; private set; } = DateTime.UtcNow;
    public string? JerseyNumber { get; private set; }
    public string? Position { get; private set; }   // free-text, sport-agnostic

    private TeamMember() { } // EF

    internal TeamMember(Guid teamId, Guid playerId, bool isCaptain)
    {
        TeamId = teamId;
        PlayerId = playerId;
        IsCaptain = isCaptain;
    }

    internal void SetCaptain(bool value) => IsCaptain = value;

    public void SetRosterInfo(string? jerseyNumber, string? position)
    {
        JerseyNumber = jerseyNumber;
        Position = position;
    }
}
