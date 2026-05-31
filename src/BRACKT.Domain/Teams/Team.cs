using Brackt.Domain.Common;
using Brackt.Domain.Teams.Events;

namespace Brackt.Domain.Teams;

/// <summary>
/// RF2.1 — a roster of competitors. The <see cref="Tier"/> is a behavioural gate,
/// not a label: it constrains what kinds of members the roster may hold.
///   • Basic        → name only, empty roster.
///   • Intermediate → ghost players only.
///   • Advanced     → invited real users (their native players).
/// A team is sport-agnostic; what it competes in is decided per registration.
/// </summary>
public sealed class Team : AggregateRoot
{
    private readonly List<TeamMember> _members = new();
    private readonly List<TeamInvitation> _invitations = new();

    public string Name { get; private set; } = null!;
    public string? Tag { get; private set; }          // short clan tag, e.g. "NV"
    public string? LogoUrl { get; private set; }
    public TeamTier Tier { get; private set; }

    /// <summary>The player acting as captain (RF2.2 — captains issue invites).</summary>
    public Guid CaptainPlayerId { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    public IReadOnlyCollection<TeamMember> Members => _members.AsReadOnly();
    public IReadOnlyCollection<TeamInvitation> Invitations => _invitations.AsReadOnly();

    private Team() { } // EF

    public Team(string name, TeamTier tier, Guid captainPlayerId, Guid createdByUserId, string? tag = null)
    {
        Name = name.Trim();
        Tier = tier;
        CaptainPlayerId = captainPlayerId;
        CreatedByUserId = createdByUserId;
        Tag = tag?.Trim();

        // The captain is always a member (except a Basic team which has no roster at all).
        if (tier != TeamTier.Basic)
            _members.Add(new TeamMember(Id, captainPlayerId, isCaptain: true));
    }

    public void Rename(string name) { Name = name.Trim(); Touch(); }
    public void SetLogo(string? url) { LogoUrl = url; Touch(); }

    /// <summary>
    /// Add a member directly. Legal only for Intermediate (ghost) and Advanced
    /// (real, already-accepted) rosters. Advanced members normally arrive via an
    /// accepted <see cref="TeamInvitation"/>; this is the post-acceptance commit.
    /// </summary>
    public TeamMember AddMember(Guid playerId, bool isCaptain = false)
    {
        if (Tier == TeamTier.Basic)
            throw new InvalidOperationException("A Basic team has no roster.");
        if (_members.Any(m => m.PlayerId == playerId))
            throw new InvalidOperationException("Player is already on the roster.");

        var member = new TeamMember(Id, playerId, isCaptain);
        _members.Add(member);
        Touch();
        return member;
    }

    public void RemoveMember(Guid playerId)
    {
        var member = _members.SingleOrDefault(m => m.PlayerId == playerId)
            ?? throw new InvalidOperationException("Player is not on the roster.");
        if (member.PlayerId == CaptainPlayerId)
            throw new InvalidOperationException("Reassign the captaincy before removing the captain.");
        _members.Remove(member);
        Touch();
    }

    public void TransferCaptaincy(Guid newCaptainPlayerId)
    {
        var member = _members.SingleOrDefault(m => m.PlayerId == newCaptainPlayerId)
            ?? throw new InvalidOperationException("New captain must already be a member.");
        foreach (var m in _members) m.SetCaptain(m.PlayerId == newCaptainPlayerId);
        CaptainPlayerId = member.PlayerId;
        Touch();
    }

    /// <summary>
    /// RF2.2 — captain invites a real user to an Advanced roster. Returns the
    /// invitation carrying a unique token used to build the deep link.
    /// </summary>
    public TeamInvitation InviteUser(string inviteeEmail, Guid invitedByUserId, TimeSpan validFor)
    {
        if (Tier != TeamTier.Advanced)
            throw new InvalidOperationException("Only Advanced teams invite real users.");

        var invite = new TeamInvitation(Id, inviteeEmail, invitedByUserId, DateTime.UtcNow.Add(validFor));
        _invitations.Add(invite);
        Touch();
        Raise(new TeamInvitationIssued(Id, invite.Id, inviteeEmail, invite.Token, invite.ExpiresAtUtc));
        return invite;
    }

    /// <summary>Accept a pending invite and add the now-known player to the roster.</summary>
    public TeamMember AcceptInvitation(Guid invitationId, Guid acceptingPlayerId)
    {
        var invite = _invitations.SingleOrDefault(i => i.Id == invitationId)
            ?? throw new InvalidOperationException("Invitation not found.");
        invite.Accept(acceptingPlayerId);
        var member = AddMember(acceptingPlayerId);
        Touch();
        return member;
    }
}
