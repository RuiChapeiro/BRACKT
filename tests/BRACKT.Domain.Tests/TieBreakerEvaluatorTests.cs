using Brackt.Domain.Common;
using Brackt.Domain.Engine;
using Brackt.Domain.Engine.Standings;
using Brackt.Domain.Rules;
using Xunit;

namespace Brackt.Domain.Tests;

public sealed class TieBreakerEvaluatorTests
{
    private readonly TieBreakerEvaluator _evaluator = new();
    private static readonly Guid GoalDiff = Guid.NewGuid();   // a metric definition id

    private static StandingStats Row(Guid id, int points, int gd) => new(
        RegistrationId: id,
        Points: points,
        Wins: 0, Draws: 0, Losses: 0,
        MetricFor: new Dictionary<Guid, decimal> { [GoalDiff] = gd },
        MetricAgainst: new Dictionary<Guid, decimal> { [GoalDiff] = 0 });

    private static RuleSet RuleSetWithFunnel(params TieBreakerCriterion[] criteria)
    {
        var rs = new RuleSet("Standard");
        rs.ConfigurePointMatrix(win: 3, draw: 1, loss: 0);
        rs.DefineTieBreakerFunnel(criteria);
        return rs;
    }

    [Fact]
    public void Funnel_PointsThenGoalDiffThenHeadToHead_RanksCorrectly()
    {
        // Two teams level on points AND goal difference; head-to-head decides.
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var c = Guid.NewGuid();
        var d = Guid.NewGuid();

        var standings = new[]
        {
            Row(a, points: 7, gd: 5),
            Row(b, points: 7, gd: 5),   // tied with A on points + GD
            Row(c, points: 4, gd: 2),
            Row(d, points: 0, gd: -12)
        };

        var ruleSet = RuleSetWithFunnel(
            new TieBreakerCriterion(TieBreakerType.Points, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.MetricDifference, SortDirection.Descending, GoalDiff, "Goal Difference"),
            new TieBreakerCriterion(TieBreakerType.HeadToHead, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.DrawOfLots, SortDirection.Descending));

        // A beat B in their head-to-head meeting.
        var h2h = new[]
        {
            new HeadToHeadResult(a, b, PointsEarned: 3, Won: true),
            new HeadToHeadResult(b, a, PointsEarned: 0, Won: false)
        };

        var ranked = _evaluator.Rank(standings, ruleSet, h2h);

        Assert.Equal(a, ranked.Single(r => r.Rank == 1).RegistrationId);
        Assert.Equal(b, ranked.Single(r => r.Rank == 2).RegistrationId);
        Assert.Equal(c, ranked.Single(r => r.Rank == 3).RegistrationId);
        Assert.Equal(d, ranked.Single(r => r.Rank == 4).RegistrationId);
        Assert.All(ranked, r => Assert.False(r.IsTied));   // funnel fully separated everyone
    }

    [Fact]
    public void HeadToHead_IsScopedToTheTiedSubsetOnly()
    {
        // A, B, C all level on points + GD. Within the trio, B has the best
        // head-to-head record even though A beat a (non-tied) 4th team.
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var c = Guid.NewGuid();

        var standings = new[]
        {
            Row(a, points: 6, gd: 0),
            Row(b, points: 6, gd: 0),
            Row(c, points: 6, gd: 0)
        };

        var ruleSet = RuleSetWithFunnel(
            new TieBreakerCriterion(TieBreakerType.Points, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.MetricDifference, SortDirection.Descending, GoalDiff),
            new TieBreakerCriterion(TieBreakerType.HeadToHeadWins, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.DrawOfLots, SortDirection.Descending));

        // Mini-table among {A,B,C}: B beat A and C (2 wins); A beat C (1 win); C none.
        var h2h = new[]
        {
            new HeadToHeadResult(b, a, 3, true),
            new HeadToHeadResult(b, c, 3, true),
            new HeadToHeadResult(a, c, 3, true),
            new HeadToHeadResult(a, b, 0, false),
            new HeadToHeadResult(c, a, 0, false),
            new HeadToHeadResult(c, b, 0, false)
        };

        var ranked = _evaluator.Rank(standings, ruleSet, h2h);

        Assert.Equal(b, ranked.Single(r => r.Rank == 1).RegistrationId);
        Assert.Equal(a, ranked.Single(r => r.Rank == 2).RegistrationId);
        Assert.Equal(c, ranked.Single(r => r.Rank == 3).RegistrationId);
    }

    [Fact]
    public void MetricAgainstAscending_FewestIsBetter()
    {
        // "Fewest disciplinary points" style rung: lower MetricAgainst ranks higher.
        var cleaner = Guid.NewGuid();
        var dirtier = Guid.NewGuid();

        var standings = new[]
        {
            new StandingStats(cleaner, 3, 1, 0, 0,
                new Dictionary<Guid, decimal>(), new Dictionary<Guid, decimal> { [GoalDiff] = 2 }),
            new StandingStats(dirtier, 3, 1, 0, 0,
                new Dictionary<Guid, decimal>(), new Dictionary<Guid, decimal> { [GoalDiff] = 9 })
        };

        var ruleSet = RuleSetWithFunnel(
            new TieBreakerCriterion(TieBreakerType.Points, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.MetricAgainstAscending, SortDirection.Ascending, GoalDiff, "Fewest Cards"));

        var ranked = _evaluator.Rank(standings, ruleSet, Array.Empty<HeadToHeadResult>());

        Assert.Equal(cleaner, ranked.Single(r => r.Rank == 1).RegistrationId);
        Assert.Equal(dirtier, ranked.Single(r => r.Rank == 2).RegistrationId);
    }

    [Fact]
    public void ExhaustedFunnel_LeavesTeamsSharingARank()
    {
        // Identical on every configured criterion and no draw-of-lots → genuine tie.
        var x = Guid.NewGuid();
        var y = Guid.NewGuid();

        var standings = new[] { Row(x, 5, 3), Row(y, 5, 3) };

        var ruleSet = RuleSetWithFunnel(
            new TieBreakerCriterion(TieBreakerType.Points, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.MetricDifference, SortDirection.Descending, GoalDiff));

        var ranked = _evaluator.Rank(standings, ruleSet, Array.Empty<HeadToHeadResult>());

        Assert.All(ranked, r => Assert.Equal(1, r.Rank));   // both share rank 1
        Assert.All(ranked, r => Assert.True(r.IsTied));
    }
}
