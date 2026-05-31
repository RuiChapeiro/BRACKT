using Brackt.Domain.Common;
using Brackt.Domain.Players.Events;

namespace Brackt.Domain.Players;

/// <summary>
/// The competitive identity of a person. This is the single anchor that ALL
/// historical data points at — match participation, individual metric values,
/// roster membership and career stats reference <see cref="Player"/>, never
/// <c>User</c> directly.
///
/// RF1.2 Ghost Players: an organizer can create a Player with <see cref="UserId"/>
/// null. It accumulates real match history while detached from any account.
///
/// RF1.3 Legacy Claiming: when an authenticated user claims a ghost, we simply
/// MERGE the ghost's identity into the claimer's native player (see
/// <see cref="ClaimInto"/>). Because every fact references a PlayerId, the merge
/// is a pointer re-link of the ghost's rows onto the surviving player id — no
/// stat is copied or lost, and the operation is replay-safe for offline sync.
/// </summary>
public sealed class Player : AggregateRoot
{
    public string DisplayName { get; private set; } = null!;
    public string? Handle { get; private set; }        // optional unique gamertag / nickname
    public string? AvatarUrl { get; private set; }
    public string? CountryCode { get; private set; }

    /// <summary>Null while a ghost; set to the owning account once claimed.</summary>
    public Guid? UserId { get; private set; }

    public PlayerProfileState State { get; private set; } = PlayerProfileState.Ghost;

    /// <summary>Who created this ghost (an organizer). Null for native profiles.</summary>
    public Guid? CreatedByUserId { get; private set; }

    public DateTime? ClaimedAtUtc { get; private set; }

    /// <summary>
    /// When this ghost has been absorbed into another player, this points at the
    /// surviving player id. Such a record is kept as a redirect tombstone so any
    /// stale offline reference can be transparently forwarded.
    /// </summary>
    public Guid? MergedIntoPlayerId { get; private set; }
    public bool IsMerged => MergedIntoPlayerId.HasValue;

    private Player() { } // EF

    private Player(string displayName, Guid? userId, Guid? createdByUserId, PlayerProfileState state)
    {
        DisplayName = displayName.Trim();
        UserId = userId;
        CreatedByUserId = createdByUserId;
        State = state;
        if (state == PlayerProfileState.Claimed) ClaimedAtUtc = DateTime.UtcNow;
    }

    /// <summary>Native profile created together with a real account.</summary>
    public static Player CreateForUser(Guid userId, string displayName)
        => new(displayName, userId, createdByUserId: null, PlayerProfileState.Claimed);

    /// <summary>RF1.2 — organizer-created ghost not linked to any account.</summary>
    public static Player CreateGhost(string displayName, Guid createdByUserId)
        => new(displayName, userId: null, createdByUserId, PlayerProfileState.Ghost);

    public void UpdateProfile(string? displayName = null, string? handle = null,
                              string? avatarUrl = null, string? countryCode = null)
    {
        if (!string.IsNullOrWhiteSpace(displayName)) DisplayName = displayName.Trim();
        if (handle is not null) Handle = string.IsNullOrWhiteSpace(handle) ? null : handle.Trim();
        if (avatarUrl is not null) AvatarUrl = avatarUrl;
        if (countryCode is not null) CountryCode = countryCode;
        Touch();
    }

    /// <summary>
    /// RF1.3 — absorb this ghost into <paramref name="survivor"/> (the claimer's
    /// native player). The ghost becomes a redirect tombstone. The actual re-pointing
    /// of history rows (match participants, metric values, roster slots) is executed
    /// by the application service in the same transaction using
    /// <see cref="MergedIntoPlayerId"/> as the routing target — kept out of the
    /// aggregate so the domain stays persistence-agnostic.
    /// </summary>
    public void ClaimInto(Player survivor)
    {
        if (State != PlayerProfileState.Ghost)
            throw new InvalidOperationException("Only a ghost player can be claimed.");
        if (IsMerged)
            throw new InvalidOperationException("This ghost has already been claimed.");
        if (survivor.Id == Id)
            throw new InvalidOperationException("A player cannot claim itself.");
        if (survivor.State != PlayerProfileState.Claimed)
            throw new InvalidOperationException("The surviving profile must belong to a real account.");

        MergedIntoPlayerId = survivor.Id;
        ClaimedAtUtc = DateTime.UtcNow;
        Touch();

        Raise(new GhostPlayerClaimed(Id, survivor.Id, survivor.UserId!.Value, DateTime.UtcNow));
    }
}
