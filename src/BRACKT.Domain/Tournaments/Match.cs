using Brackt.Domain.Common;
using Brackt.Domain.Tournaments.Events;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// A single contest between (normally) two participants. Matches are produced by
/// the bracket generator and progressed via scoring and check-in.
///
/// Elimination plumbing: <see cref="NextMatchId"/> / <see cref="NextMatchSlot"/>
/// describe where this match's winner advances, and (for double elimination)
/// <see cref="LoserNextMatchId"/> where the loser drops. This lets the engine
/// pre-wire an entire bracket whose participants are still unknown — slots are
/// filled as results come in, which is exactly what the offline-first scoring
/// flow needs (a result mutates two known matches, no global recompute).
/// </summary>
public sealed class Match : AggregateRoot
{
    private readonly List<MatchParticipant> _participants = new();

    public Guid GroupId { get; private set; }
    public Guid StageId { get; private set; }

    public BracketSide BracketSide { get; private set; } = BracketSide.Main;
    public int RoundNumber { get; private set; }    // 1 = first round
    public int MatchNumber { get; private set; }    // ordinal within the round
    public MatchStatus Status { get; private set; } = MatchStatus.Pending;

    public DateTime? ScheduledStartUtc { get; private set; }
    public Guid? VenueSlotId { get; private set; }

    // Advancement wiring -------------------------------------------------------
    public Guid? NextMatchId { get; private set; }
    public int? NextMatchSlot { get; private set; }       // 0 or 1
    public Guid? LoserNextMatchId { get; private set; }   // double-elim drop target
    public int? LoserNextMatchSlot { get; private set; }

    public Guid? WinnerRegistrationId { get; private set; }
    public bool IsDraw { get; private set; }

    public IReadOnlyList<MatchParticipant> Participants => _participants.OrderBy(p => p.Slot).ToList();

    private Match() { } // EF

    internal Match(Guid stageId, Guid groupId, int roundNumber, int matchNumber, BracketSide side)
    {
        StageId = stageId;
        GroupId = groupId;
        RoundNumber = roundNumber;
        MatchNumber = matchNumber;
        BracketSide = side;
    }

    internal MatchParticipant SetParticipant(int slot, Guid? registrationId)
    {
        var existing = _participants.SingleOrDefault(p => p.Slot == slot);
        if (existing is not null)
        {
            existing.AssignRegistration(registrationId);
            return existing;
        }
        var participant = new MatchParticipant(Id, slot, registrationId);
        _participants.Add(participant);
        if (_participants.Count(p => p.RegistrationId is not null) >= 2 && Status == MatchStatus.Pending)
            Status = MatchStatus.Scheduled;
        return participant;
    }

    internal void WireAdvancement(Guid? nextMatchId, int? nextSlot, Guid? loserNextMatchId = null, int? loserNextSlot = null)
    {
        NextMatchId = nextMatchId;
        NextMatchSlot = nextSlot;
        LoserNextMatchId = loserNextMatchId;
        LoserNextMatchSlot = loserNextSlot;
    }

    public void Schedule(DateTime startUtc, Guid? venueSlotId)
    {
        ScheduledStartUtc = startUtc;
        VenueSlotId = venueSlotId;
        if (Status == MatchStatus.Pending) Status = MatchStatus.Scheduled;
        Touch();
        Raise(new MatchScheduled(Id, StageId, startUtc, venueSlotId));
    }

    public void Start()
    {
        Status = MatchStatus.Live;
        Touch();
        Raise(new MatchStarted(Id, StageId, DateTime.UtcNow));
    }

    /// <summary>
    /// Record the outcome. <paramref name="winnerRegistrationId"/> null + draw
    /// flag denotes a drawn result (only valid when the ruleset permits draws —
    /// enforced by the application service that knows the ruleset).
    /// </summary>
    public void RecordResult(Guid? winnerRegistrationId, bool isDraw, bool walkover = false)
    {
        if (isDraw && winnerRegistrationId is not null)
            throw new InvalidOperationException("A draw cannot have a winner.");
        if (!isDraw && winnerRegistrationId is null && !walkover)
            throw new InvalidOperationException("A decisive result needs a winner.");

        foreach (var p in _participants)
        {
            if (isDraw) p.SetOutcome(MatchOutcome.Draw);
            else p.SetOutcome(p.RegistrationId == winnerRegistrationId ? MatchOutcome.Win : MatchOutcome.Loss);
        }

        WinnerRegistrationId = winnerRegistrationId;
        IsDraw = isDraw;
        Status = walkover ? MatchStatus.Walkover : MatchStatus.Completed;
        Touch();
        Raise(new MatchResultRecorded(Id, StageId, winnerRegistrationId, isDraw, walkover));
    }

    public Guid? GetLoserRegistrationId()
        => WinnerRegistrationId is null
            ? null
            : _participants.SingleOrDefault(p => p.RegistrationId != WinnerRegistrationId && p.RegistrationId is not null)?.RegistrationId;
}
