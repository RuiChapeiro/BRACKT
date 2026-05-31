using Brackt.Domain.Common;
using Brackt.Domain.Communication.Events;

namespace Brackt.Domain.Communication;

/// <summary>
/// RF6.1 / RF6.2 — "The Megaphone". A post on a tournament's wall. Publishing an
/// announcement raises an event that the notification dispatcher turns into a
/// push to every participant (RF6.2), while the post itself feeds the Home/Feed
/// wall in the main navigation.
/// </summary>
public sealed class Announcement : AggregateRoot
{
    public Guid TournamentId { get; private set; }
    public Guid AuthorUserId { get; private set; }
    public string Title { get; private set; } = null!;
    public string Body { get; private set; } = null!;

    /// <summary>RF6.1 — optional attached link (stream, bracket, doc).</summary>
    public string? LinkUrl { get; private set; }

    public bool IsPinned { get; private set; }
    public bool IsPublished { get; private set; }
    public DateTime? PublishedAtUtc { get; private set; }

    /// <summary>RF6.2 — whether publishing should fan out a push notification.</summary>
    public bool DispatchPush { get; private set; } = true;

    private Announcement() { } // EF

    public Announcement(Guid tournamentId, Guid authorUserId, string title, string body,
                        string? linkUrl = null, bool dispatchPush = true)
    {
        TournamentId = tournamentId;
        AuthorUserId = authorUserId;
        Title = title.Trim();
        Body = body;
        LinkUrl = linkUrl;
        DispatchPush = dispatchPush;
    }

    public void Edit(string? title, string? body, string? linkUrl)
    {
        if (!string.IsNullOrWhiteSpace(title)) Title = title.Trim();
        if (body is not null) Body = body;
        LinkUrl = linkUrl;
        Touch();
    }

    public void SetPinned(bool pinned) { IsPinned = pinned; Touch(); }

    /// <summary>RF6.2 — publish to the wall and (optionally) trigger the push fan-out.</summary>
    public void Publish()
    {
        if (IsPublished) return;
        IsPublished = true;
        PublishedAtUtc = DateTime.UtcNow;
        Touch();
        Raise(new AnnouncementPublished(Id, TournamentId, Title, DispatchPush));
    }
}
