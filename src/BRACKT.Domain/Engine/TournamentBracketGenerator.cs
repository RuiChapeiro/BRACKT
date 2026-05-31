using Brackt.Domain.Common;
using Brackt.Domain.Tournaments;

namespace Brackt.Domain.Engine;

/// <summary>
/// RF3.1–RF3.4 — materialises a <see cref="Stage"/> into concrete groups and
/// matches according to its <see cref="TournamentFormat"/> and
/// <see cref="SeedingMethod"/>. The generator is a stateless domain service: it
/// mutates the supplied stage aggregate and returns nothing the caller must
/// reconcile, so the Application layer simply persists the stage afterwards.
///
/// Implemented here: Single Elimination (seeded, with byes) and Round Robin
/// (circle method, multi-group, multi-leg). Double Elimination and Swiss are
/// recognised but intentionally deferred — they throw an explicit
/// <see cref="NotSupportedException"/> rather than silently producing nothing.
/// </summary>
public sealed class TournamentBracketGenerator
{
    /// <summary>
    /// Generate the bracket/schedule for <paramref name="stage"/>.
    /// </summary>
    /// <param name="stage">The stage to populate (must be empty / not yet generated).</param>
    /// <param name="entrantRegistrationIds">
    /// All registrations entering this stage. The final seeding order is derived
    /// from the stage's <see cref="SeedingMethod"/>:
    ///   • Random            → this list is shuffled with <paramref name="rng"/>;
    ///   • Manual/FromStandings → the stage's existing <see cref="Stage.Seeds"/>
    ///     order is honoured (falling back to the supplied order if none set).
    /// </param>
    /// <param name="rng">Randomness source for random seeding (defaults to a fresh RNG).</param>
    public void Generate(Stage stage, IReadOnlyList<Guid> entrantRegistrationIds, Random? rng = null)
    {
        ArgumentNullException.ThrowIfNull(stage);
        ArgumentNullException.ThrowIfNull(entrantRegistrationIds);
        if (stage.IsGenerated)
            throw new InvalidOperationException("Stage has already been generated.");
        if (entrantRegistrationIds.Count < 2)
            throw new InvalidOperationException("A stage needs at least two entrants.");

        var ordered = ResolveSeedingOrder(stage, entrantRegistrationIds, rng ?? new Random());
        stage.SetSeeds(ordered);   // persist the effective seeding (RF3.3)

        switch (stage.Format)
        {
            case TournamentFormat.SingleElimination:
                GenerateSingleElimination(stage, ordered);
                break;
            case TournamentFormat.RoundRobin:
                GenerateRoundRobin(stage, ordered);
                break;
            case TournamentFormat.DoubleElimination:
            case TournamentFormat.Swiss:
                throw new NotSupportedException(
                    $"{stage.Format} generation is not yet implemented. Single Elimination and Round Robin are supported.");
            default:
                throw new ArgumentOutOfRangeException(nameof(stage), stage.Format, "Unknown tournament format.");
        }

        stage.MarkGenerated();
    }

    private static IReadOnlyList<Guid> ResolveSeedingOrder(
        Stage stage, IReadOnlyList<Guid> entrants, Random rng)
    {
        switch (stage.SeedingMethod)
        {
            case SeedingMethod.Random:
                return (IReadOnlyList<Guid>)SeedingHelper.Shuffle(entrants.ToList(), rng);

            case SeedingMethod.Manual:
            case SeedingMethod.FromStandings:
                // Honour pre-set seeds when present; otherwise accept the given order.
                return stage.Seeds.Count > 0
                    ? stage.Seeds.Select(s => s.RegistrationId).ToList()
                    : entrants;

            default:
                return entrants;
        }
    }

    // ---------------------------------------------------------------------
    //  SINGLE ELIMINATION
    // ---------------------------------------------------------------------
    private static void GenerateSingleElimination(Stage stage, IReadOnlyList<Guid> seededRegs)
    {
        var n = seededRegs.Count;
        var size = SeedingHelper.NextPowerOfTwo(n);          // slots incl. byes
        var rounds = SeedingHelper.Log2(size);
        var slotSeeds = SeedingHelper.StandardBracketSeedOrder(size);

        var group = stage.AddGroup("Main Bracket", index: 0);

        // Seed number (1-based) → registration id, or null when the seed is a bye.
        Guid? RegForSeed(int seedNumber) => seedNumber <= n ? seededRegs[seedNumber - 1] : null;

        // Build every round's matches first (later rounds start as empty TBD slots),
        // so we can wire winner-advancement by object reference.
        var matchesByRound = new List<Match>[rounds + 1]; // 1-based rounds
        for (var round = 1; round <= rounds; round++)
        {
            var count = size >> round;                       // matches in this round
            matchesByRound[round] = new List<Match>(count);
            for (var k = 0; k < count; k++)
            {
                var match = NewMatch(stage, group, round, matchNumber: k + 1);
                if (round == 1)
                {
                    match.SetParticipant(0, RegForSeed(slotSeeds[2 * k]));
                    match.SetParticipant(1, RegForSeed(slotSeeds[2 * k + 1]));
                }
                else
                {
                    match.SetParticipant(0, null);           // filled by feeders
                    match.SetParticipant(1, null);
                }
                group.AddMatch(match);
                matchesByRound[round].Add(match);
            }
        }

        // Wire each match to its successor: match k of round r feeds match k/2 of
        // round r+1, occupying slot (k % 2).
        for (var round = 1; round < rounds; round++)
        {
            var current = matchesByRound[round];
            var next = matchesByRound[round + 1];
            for (var k = 0; k < current.Count; k++)
                current[k].WireAdvancement(next[k / 2].Id, k % 2);
        }

        // Resolve first-round byes: a match with exactly one real entrant is an
        // automatic walkover; advance that entrant into its next match slot.
        foreach (var match in matchesByRound[1])
        {
            var present = match.Participants.Where(p => p.RegistrationId is not null).ToList();
            if (present.Count != 1) continue;                // real contest or empty

            var winner = present[0].RegistrationId!.Value;
            match.RecordResult(winner, isDraw: false, walkover: true);

            if (match.NextMatchId is { } nextId && match.NextMatchSlot is { } slot)
            {
                var nextMatch = matchesByRound[2].Single(m => m.Id == nextId);
                nextMatch.SetParticipant(slot, winner);
            }
        }
    }

    // ---------------------------------------------------------------------
    //  ROUND ROBIN
    // ---------------------------------------------------------------------
    private static void GenerateRoundRobin(Stage stage, IReadOnlyList<Guid> seededRegs)
    {
        var groupCount = Math.Max(1, stage.GroupCount);
        var legs = Math.Max(1, stage.LegsPerPairing);

        // Distribute seeds across groups in a serpentine (snake) pattern so that
        // group strength is balanced: seeds 1..G go left-to-right, the next band
        // right-to-left, and so on.
        var buckets = new List<Guid>[groupCount];
        for (var i = 0; i < groupCount; i++) buckets[i] = new List<Guid>();

        for (var i = 0; i < seededRegs.Count; i++)
        {
            var band = i / groupCount;
            var pos = i % groupCount;
            var target = band % 2 == 0 ? pos : groupCount - 1 - pos;
            buckets[target].Add(seededRegs[i]);
        }

        for (var g = 0; g < groupCount; g++)
        {
            var name = groupCount == 1 ? "League" : $"Group {(char)('A' + g)}";
            var group = stage.AddGroup(name, g);
            ScheduleRoundRobinGroup(stage, group, buckets[g], legs);
        }
    }

    /// <summary>
    /// Circle-method round-robin schedule for a single group. Each team meets
    /// every other once per leg. For an odd number of teams a bye marker is added
    /// so exactly one team rests each round.
    /// </summary>
    private static void ScheduleRoundRobinGroup(Stage stage, Group group, List<Guid> members, int legs)
    {
        if (members.Count < 2) return;                       // nothing to schedule

        // Even out with a bye sentinel for the rotation.
        var ring = new List<Guid?>(members.Select(m => (Guid?)m));
        if (ring.Count % 2 != 0) ring.Add(null);             // bye

        var teams = ring.Count;
        var roundsPerLeg = teams - 1;
        var half = teams / 2;

        var matchNumber = 0;
        var roundNumber = 0;

        for (var leg = 0; leg < legs; leg++)
        {
            // Fresh rotation per leg.
            var rotation = new List<Guid?>(ring);
            for (var r = 0; r < roundsPerLeg; r++)
            {
                roundNumber++;
                for (var i = 0; i < half; i++)
                {
                    var home = rotation[i];
                    var away = rotation[teams - 1 - i];
                    if (home is null || away is null) continue;   // bye — no match

                    // Alternate home/away each leg so a two-legged format is fair.
                    var (h, a) = leg % 2 == 0 ? (home.Value, away.Value) : (away.Value, home.Value);

                    var match = NewMatch(stage, group, roundNumber, ++matchNumber);
                    match.SetParticipant(0, h);
                    match.SetParticipant(1, a);
                    group.AddMatch(match);
                }

                // Rotate: keep element 0 fixed, move the rest clockwise.
                var last = rotation[teams - 1];
                rotation.RemoveAt(teams - 1);
                rotation.Insert(1, last);
            }
        }
    }

    // The Match constructor is internal to the Domain aggregate; this generator
    // lives in the same assembly, so it may create matches directly.
    private static Match NewMatch(Stage stage, Group group, int round, int matchNumber)
        => new(stage.Id, group.Id, round, matchNumber, BracketSide.Main);
}
