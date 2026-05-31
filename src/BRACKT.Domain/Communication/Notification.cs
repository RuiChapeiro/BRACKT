using Brackt.Domain.Common;

namespace Brackt.Domain.Communication;

/// <summary>
/// A per-recipient notification record (the inbox row behind a push). Persisting
/// notifications lets a user who was offline at dispatch time pull their backlog
/// on reconnect — the same offline-first principle applied to inbound messages.
/// </summary>
public sealed class Notification : AggregateRoot
{
    public Guid RecipientUserId { get; private set; }

    /// <summary>Machine category for client-side routing/icons, e.g. "match.start", "announcement", "invite".</summary>
    public string Type { get; private set; } = null!;
    public string Title { get; private set; } = null!;
    public string Body { get; private set; } = null!;

    /// <summary>Deep-link target opened when the notification is tapped.</summary>
    public string? DeepLink { get; private set; }

    /// <summary>Free-form JSON payload for client-specific handling.</summary>
    public string? DataJson { get; private set; }

    public bool IsRead { get; private set; }
    public DateTime? ReadAtUtc { get; private set; }

    /// <summary>Whether a push was successfully handed to the transport (FCM/APNs/WebPush).</summary>
    public bool IsPushDelivered { get; private set; }

    private Notification() { } // EF

    public Notification(Guid recipientUserId, string type, string title, string body,
                        string? deepLink = null, string? dataJson = null)
    {
        RecipientUserId = recipientUserId;
        Type = type;
        Title = title;
        Body = body;
        DeepLink = deepLink;
        DataJson = dataJson;
    }

    public void MarkRead()
    {
        if (IsRead) return;
        IsRead = true;
        ReadAtUtc = DateTime.UtcNow;
        Touch();
    }

    public void MarkPushDelivered()
    {
        IsPushDelivered = true;
        Touch();
    }
}
