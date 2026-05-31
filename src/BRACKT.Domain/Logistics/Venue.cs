using Brackt.Domain.Common;

namespace Brackt.Domain.Logistics;

/// <summary>
/// RF5.1 — a physical or virtual location (pitch, court, server room, game lobby)
/// owning a set of bookable availability slots. Venues are tournament-scoped.
/// </summary>
public sealed class Venue : AggregateRoot
{
    private readonly List<VenueSlot> _slots = new();

    public Guid TournamentId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public int Capacity { get; private set; } = 1;   // concurrent matches the venue can host

    public IReadOnlyList<VenueSlot> Slots => _slots.OrderBy(s => s.StartUtc).ToList();

    private Venue() { } // EF

    public Venue(Guid tournamentId, string name, int capacity = 1)
    {
        TournamentId = tournamentId;
        Name = name.Trim();
        Capacity = Math.Max(1, capacity);
    }

    public void Update(string? name, string? description, int? capacity)
    {
        if (!string.IsNullOrWhiteSpace(name)) Name = name.Trim();
        if (description is not null) Description = description;
        if (capacity is > 0) Capacity = capacity.Value;
        Touch();
    }

    /// <summary>RF5.1 — declare an availability window the scheduler may book into.</summary>
    public VenueSlot AddSlot(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc)
            throw new ArgumentException("Slot end must be after start.");
        var slot = new VenueSlot(Id, startUtc, endUtc);
        _slots.Add(slot);
        Touch();
        return slot;
    }

    public void RemoveSlot(Guid slotId)
    {
        var slot = _slots.SingleOrDefault(s => s.Id == slotId);
        if (slot is null) return;
        _slots.Remove(slot);
        Touch();
    }
}
