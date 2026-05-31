using Brackt.Domain.Common;

namespace Brackt.Domain.Logistics;

/// <summary>
/// RF5.1 — a bookable time window at a venue. A match is scheduled INTO a slot;
/// the conflict detector (RF5.2) checks that a slot is not over-subscribed beyond
/// the venue's capacity and that a scheduled match falls within the window.
/// </summary>
public sealed class VenueSlot : Entity
{
    public Guid VenueId { get; private set; }
    public DateTime StartUtc { get; private set; }
    public DateTime EndUtc { get; private set; }

    /// <summary>Number of matches currently assigned to this slot.</summary>
    public int BookedCount { get; private set; }

    private VenueSlot() { } // EF

    internal VenueSlot(Guid venueId, DateTime startUtc, DateTime endUtc)
    {
        VenueId = venueId;
        StartUtc = startUtc;
        EndUtc = endUtc;
    }

    public bool Contains(DateTime instant) => instant >= StartUtc && instant < EndUtc;

    /// <summary>True when two windows share any instant — used for player double-booking checks.</summary>
    public bool Overlaps(DateTime otherStart, DateTime otherEnd)
        => otherStart < EndUtc && StartUtc < otherEnd;

    internal void Book() => BookedCount++;
    internal void Release() => BookedCount = Math.Max(0, BookedCount - 1);
}
