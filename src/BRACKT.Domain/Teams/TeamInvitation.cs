using System.Security.Cryptography;
using Brackt.Domain.Common;

namespace Brackt.Domain.Teams;

/// <summary>
/// RF2.2 — a pending invitation for a real user to join an Advanced roster.
/// The <see cref="Token"/> is a high-entropy, URL-safe string embedded in the
/// deep link / push notification (e.g. brackt://invite/{token}).
/// </summary>
public sealed class TeamInvitation : Entity
{
    public Guid TeamId { get; private set; }
    public string InviteeEmail { get; private set; } = null!;
    public Guid InvitedByUserId { get; private set; }
    public string Token { get; private set; } = null!;
    public InvitationStatus Status { get; private set; } = InvitationStatus.Pending;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime? RespondedAtUtc { get; private set; }
    public Guid? AcceptedByPlayerId { get; private set; }

    private TeamInvitation() { } // EF

    internal TeamInvitation(Guid teamId, string inviteeEmail, Guid invitedByUserId, DateTime expiresAtUtc)
    {
        TeamId = teamId;
        InviteeEmail = inviteeEmail.Trim().ToLowerInvariant();
        InvitedByUserId = invitedByUserId;
        ExpiresAtUtc = expiresAtUtc;
        Token = GenerateToken();
    }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;

    internal void Accept(Guid acceptingPlayerId)
    {
        EnsureActionable();
        Status = InvitationStatus.Accepted;
        AcceptedByPlayerId = acceptingPlayerId;
        RespondedAtUtc = DateTime.UtcNow;
    }

    public void Decline()
    {
        EnsureActionable();
        Status = InvitationStatus.Declined;
        RespondedAtUtc = DateTime.UtcNow;
    }

    public void Revoke()
    {
        if (Status == InvitationStatus.Pending) Status = InvitationStatus.Revoked;
    }

    private void EnsureActionable()
    {
        if (Status != InvitationStatus.Pending)
            throw new InvalidOperationException($"Invitation is not pending (current: {Status}).");
        if (IsExpired)
        {
            Status = InvitationStatus.Expired;
            throw new InvalidOperationException("Invitation has expired.");
        }
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        // URL-safe base64 (no padding) so it drops straight into a deep link.
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
