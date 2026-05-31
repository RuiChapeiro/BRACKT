using Brackt.Domain.Common;
using Brackt.Domain.Engine;
using Brackt.Domain.Tournaments;
using Xunit;

namespace Brackt.Domain.Tests;

public sealed class TournamentBracketGeneratorTests
{
    private readonly TournamentBracketGenerator _generator = new();

    /// <summary>Build a fresh stage of the given format with deterministic seeding.</summary>
    private static Stage NewStage(TournamentFormat format, int? groupCount = null)
    {
        var tournament = new Tournament("Test Cup", Guid.NewGuid(), Guid.NewGuid());
        return tournament.AddStage("Stage", format, SeedingMethod.Manual, groupCount);
    }

    /// <summary>Seed ids 1..n; index 0 is the top seed (manual seeding honours input order).</summary>
    private static List<Guid> Seeds(int n) => Enumerable.Range(0, n).Select(_ => Guid.NewGuid()).ToList();

    private static Match MatchAt(Stage stage, int round, int number) =>
        stage.Groups.SelectMany(g => g.Matches).Single(m => m.RoundNumber == round && m.MatchNumber == number);

    [Fact]
    public void SingleElimination_8Seeds_BuildsStandardBracketAndWiring()
    {
        var stage = NewStage(TournamentFormat.SingleElimination);
        var s = Seeds(8);

        _generator.Generate(stage, s);

        var group = Assert.Single(stage.Groups);
        Assert.Equal("Main Bracket", group.Name);

        // 8 entrants → 7 matches across 3 rounds (4 + 2 + 1).
        Assert.Equal(7, group.Matches.Count);
        Assert.Equal(4, group.Matches.Count(m => m.RoundNumber == 1));
        Assert.Equal(2, group.Matches.Count(m => m.RoundNumber == 2));
        Assert.Equal(1, group.Matches.Count(m => m.RoundNumber == 3));

        // Canonical seeding pairs: (1v8)(4v5)(2v7)(3v6).
        AssertPairing(MatchAt(stage, 1, 1), s[0], s[7]);
        AssertPairing(MatchAt(stage, 1, 2), s[3], s[4]);
        AssertPairing(MatchAt(stage, 1, 3), s[1], s[6]);
        AssertPairing(MatchAt(stage, 1, 4), s[2], s[5]);

        // Advancement wiring: R1 m1/m2 → R2 m1 (slots 0/1); m3/m4 → R2 m2.
        var r2m1 = MatchAt(stage, 2, 1);
        var r2m2 = MatchAt(stage, 2, 2);
        var final = MatchAt(stage, 3, 1);

        Assert.Equal(r2m1.Id, MatchAt(stage, 1, 1).NextMatchId);
        Assert.Equal(0, MatchAt(stage, 1, 1).NextMatchSlot);
        Assert.Equal(r2m1.Id, MatchAt(stage, 1, 2).NextMatchId);
        Assert.Equal(1, MatchAt(stage, 1, 2).NextMatchSlot);
        Assert.Equal(r2m2.Id, MatchAt(stage, 1, 3).NextMatchId);
        Assert.Equal(r2m2.Id, MatchAt(stage, 1, 4).NextMatchId);

        Assert.Equal(final.Id, r2m1.NextMatchId);
        Assert.Equal(0, r2m1.NextMatchSlot);
        Assert.Equal(final.Id, r2m2.NextMatchId);
        Assert.Equal(1, r2m2.NextMatchSlot);
        Assert.Null(final.NextMatchId);   // the final advances nowhere
    }

    [Fact]
    public void SingleElimination_5Seeds_AutoAdvancesByes()
    {
        var stage = NewStage(TournamentFormat.SingleElimination);
        var s = Seeds(5);   // 3 byes in an 8-slot bracket

        _generator.Generate(stage, s);

        // Three of the four first-round matches are walkovers (top seeds vs byes).
        var r1 = stage.Groups.Single().Matches.Where(m => m.RoundNumber == 1).ToList();
        Assert.Equal(3, r1.Count(m => m.Status == MatchStatus.Walkover));
        Assert.All(r1.Where(m => m.Status == MatchStatus.Walkover),
            m => Assert.NotNull(m.WinnerRegistrationId));

        // Seeds 2 & 3 (byes) advance and meet directly in R2 match 2 — both slots filled.
        var r2m2 = MatchAt(stage, 2, 2);
        Assert.Equal(2, r2m2.Participants.Count(p => p.RegistrationId is not null));
        Assert.Equal(MatchStatus.Scheduled, r2m2.Status);

        // R2 match 1 has seed 1 waiting on the one real contest (4v5) — still pending.
        var r2m1 = MatchAt(stage, 2, 1);
        Assert.Equal(1, r2m1.Participants.Count(p => p.RegistrationId is not null));
    }

    [Fact]
    public void RoundRobin_4Teams_SingleGroup_EveryPairOnce()
    {
        var stage = NewStage(TournamentFormat.RoundRobin, groupCount: 1);
        var s = Seeds(4);

        _generator.Generate(stage, s);

        var matches = stage.Groups.Single().Matches.ToList();
        Assert.Equal(6, matches.Count);                       // C(4,2)
        Assert.Equal(3, matches.Max(m => m.RoundNumber));     // 3 rounds

        var pairs = matches.Select(UnorderedPair).ToHashSet();
        Assert.Equal(6, pairs.Count);                         // all distinct, every pair once
    }

    [Fact]
    public void RoundRobin_8Teams_TwoGroups_SplitsEvenly()
    {
        var stage = NewStage(TournamentFormat.RoundRobin, groupCount: 2);

        _generator.Generate(stage, Seeds(8));

        Assert.Equal(2, stage.Groups.Count);
        Assert.All(stage.Groups, g => Assert.Equal(6, g.Matches.Count));   // 4 per group → C(4,2)
        Assert.Equal(new[] { "Group A", "Group B" }, stage.Groups.OrderBy(g => g.Index).Select(g => g.Name));
    }

    [Fact]
    public void RoundRobin_3Teams_TwoLegs_EachPairTwice()
    {
        var stage = NewStage(TournamentFormat.RoundRobin, groupCount: 1);
        stage.ConfigureRoundRobin(legsPerPairing: 2);

        _generator.Generate(stage, Seeds(3));

        var matches = stage.Groups.Single().Matches.ToList();
        Assert.Equal(6, matches.Count);                       // C(3,2) × 2 legs
        var perPair = matches.GroupBy(UnorderedPair);
        Assert.All(perPair, g => Assert.Equal(2, g.Count()));
    }

    [Fact]
    public void RandomSeeding_IsDeterministicForAGivenRng()
    {
        var ids = Seeds(8);
        var stage1 = new Tournament("A", Guid.NewGuid(), Guid.NewGuid())
            .AddStage("S", TournamentFormat.SingleElimination, SeedingMethod.Random);
        var stage2 = new Tournament("B", Guid.NewGuid(), Guid.NewGuid())
            .AddStage("S", TournamentFormat.SingleElimination, SeedingMethod.Random);

        _generator.Generate(stage1, ids, new Random(42));
        _generator.Generate(stage2, ids, new Random(42));

        // Same RNG seed ⇒ identical seeding order.
        Assert.Equal(
            stage1.Seeds.Select(x => x.RegistrationId),
            stage2.Seeds.Select(x => x.RegistrationId));
    }

    private static void AssertPairing(Match m, Guid a, Guid b)
    {
        var regs = m.Participants.Select(p => p.RegistrationId).ToList();
        Assert.Contains(a, regs);
        Assert.Contains(b, regs);
    }

    private static (Guid, Guid) UnorderedPair(Match m)
    {
        var r = m.Participants.Select(p => p.RegistrationId!.Value).OrderBy(x => x).ToList();
        return (r[0], r[1]);
    }
}
