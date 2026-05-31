using Brackt.Domain.Common;

namespace Brackt.Domain.Identity;

/// <summary>
/// RF1.1 — an authenticated account. Authentication concerns (password hashing,
/// external-provider tokens) live in Infrastructure; the domain only models the
/// account's identity and the external logins linked to it.
///
/// IMPORTANT: a <see cref="User"/> is an ACCOUNT, not a competitor. Competitive
/// identity (stats, match history, roster membership) hangs off <c>Player</c>.
/// Every real user owns exactly one native <c>Player</c>, and may additionally
/// absorb ghost players by claiming them (RF1.3). Keeping these separate is what
/// makes claiming a single re-link instead of a data migration.
/// </summary>
public sealed class User : AggregateRoot
{
    private readonly List<ExternalLogin> _externalLogins = new();

    public string Email { get; private set; } = null!;
    public string DisplayName { get; private set; } = null!;
    public string? PasswordHash { get; private set; }
    public SystemRole Role { get; private set; } = SystemRole.Player;
    public bool IsEmailConfirmed { get; private set; }

    /// <summary>The single competitive profile created with the account.</summary>
    public Guid PlayerId { get; private set; }

    public IReadOnlyCollection<ExternalLogin> ExternalLogins => _externalLogins.AsReadOnly();

    private User() { } // EF

    public User(string email, string displayName, Guid playerId, string? passwordHash = null)
    {
        Email = email.Trim().ToLowerInvariant();
        DisplayName = displayName.Trim();
        PlayerId = playerId;
        PasswordHash = passwordHash;
        Role = SystemRole.Player;
    }

    /// <summary>
    /// Link this account to its native competitive profile. Used during
    /// registration, where the User and Player are created together and must
    /// reference each other (avoids a construction-order chicken-and-egg).
    /// </summary>
    public void AssignPlayer(Guid playerId)
    {
        PlayerId = playerId;
        Touch();
    }

    public void PromoteTo(SystemRole role)
    {
        if (role == Role) return;
        Role = role;
        Touch();
    }

    public void ConfirmEmail()
    {
        if (IsEmailConfirmed) return;
        IsEmailConfirmed = true;
        Touch();
    }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
        Touch();
    }

    /// <summary>RF1.1 — link an external identity provider (Google, Discord, Apple…).</summary>
    public void LinkExternalLogin(string provider, string providerKey)
    {
        if (_externalLogins.Any(l => l.Provider == provider && l.ProviderKey == providerKey))
            return;
        _externalLogins.Add(new ExternalLogin(Id, provider, providerKey));
        Touch();
    }
}

/// <summary>A federated identity (provider + subject) bound to a <see cref="User"/>.</summary>
public sealed class ExternalLogin : Entity
{
    public Guid UserId { get; private set; }
    public string Provider { get; private set; } = null!;   // e.g. "Google", "Discord"
    public string ProviderKey { get; private set; } = null!; // provider's stable subject id

    private ExternalLogin() { } // EF

    public ExternalLogin(Guid userId, string provider, string providerKey)
    {
        UserId = userId;
        Provider = provider;
        ProviderKey = providerKey;
    }
}
