using Brackt.Domain.Common;
using Brackt.Domain.Engine.Standings;
using Brackt.Domain.Rules;

namespace Brackt.Domain.Engine;

/// <summary>
/// RF4.5 — ranks a group's teams by interpreting the ruleset's ORDERED
/// tie-breaker funnel. This is the second pillar of the config-driven engine:
/// "goal difference, then head-to-head, then fewest cards" is data, not code.
///
/// Algorithm — recursive partitioning:
///   1. Apply the highest-priority criterion, splitting teams into ranked tiers.
///   2. Any tier with more than one team is still tied; recurse into it with the
///      NEXT criterion only.
///   3. Stop when every tier holds one team, or the funnel is exhausted (the
///      remaining teams genuinely share a rank).
///
/// Why recursion rather than a flat comparator: head-to-head rungs are
/// contextual — they must be computed among ONLY the currently tied teams. A 3-way
/// tie resolved by "head-to-head points" compares results within that trio, not
/// against the whole group. Recursive partitioning gives each rung the correct
/// subset automatically.
/// </summary>
public sealed class TieBreakerEvaluator
{
    /// <summary>
    /// Rank <paramref name="standings"/> using <paramref name="ruleSet"/>'s funnel.
    /// </summary>
    /// <param name="standings">The teams to rank (one row each).</param>
    /// <param name="ruleSet">Supplies the ordered <see cref="RuleSet.TieBreakers"/>.</param>
    /// <param name="headToHead">All head-to-head results within the group.</param>
    public IReadOnlyList<RankedStanding> Rank(
        IReadOnlyCollection<StandingStats> standings,
        RuleSet ruleSet,
        IReadOnlyCollection<HeadToHeadResult> headToHead)
    {
        ArgumentNullException.ThrowIfNull(standings);
        ArgumentNullException.ThrowIfNull(ruleSet);

        var funnel = ruleSet.TieBreakers;
        var h2h = headToHead ?? Array.Empty<HeadToHeadResult>();

        // Partition into ordered tiers (each tier = teams that remain tied).
        var tiers = Partition(standings.ToList(), funnel, criterionIndex: 0, h2h);

        // Flatten with competition ranking ("1, 2, 2, 4"): every team in a tier
        // shares the tier's starting rank; the next tier starts after them.
        var result = new List<RankedStanding>(standings.Count);
        var rank = 1;
        foreach (var tier in tiers)
        {
            var tied = tier.Count > 1;
            foreach (var stat in tier)
                result.Add(new RankedStanding(stat.RegistrationId, rank, stat) { IsTied = tied });
            rank += tier.Count;
        }
        return result;
    }

    /// <summary>Recursively split a set of tied teams into ordered tiers.</summary>
    private static List<List<StandingStats>> Partition(
        List<StandingStats> rows,
        IReadOnlyList<TieBreakerCriterion> funnel,
        int criterionIndex,
        IReadOnlyCollection<HeadToHeadResult> h2h)
    {
        if (rows.Count <= 1 || criterionIndex >= funnel.Count)
            return new List<List<StandingStats>> { rows };

        var criterion = funnel[criterionIndex];

        // Draw of lots is the terminal separator: deterministically order every
        // remaining team so no genuine tie survives. (A stable order by id keeps
        // results reproducible; swap in a randomised seed for a real draw.)
        if (criterion.Type == TieBreakerType.DrawOfLots)
        {
            return rows
                .OrderBy(r => r.RegistrationId)
                .Select(r => new List<StandingStats> { r })
                .ToList();
        }

        // The tied subset that contextual (head-to-head) rungs are scoped to.
        var subset = rows.Select(r => r.RegistrationId).ToHashSet();

        // Score each row under this rung, then group equal scores into tiers and
        // order the tiers by the rung's direction.
        var scored = rows.Select(r => (row: r, key: Score(r, criterion, subset, h2h)));
        var grouped = criterion.Direction == SortDirection.Descending
            ? scored.GroupBy(x => x.key).OrderByDescending(g => g.Key)
            : scored.GroupBy(x => x.key).OrderBy(g => g.Key);

        var tiers = new List<List<StandingStats>>();
        foreach (var g in grouped)
        {
            var tierRows = g.Select(x => x.row).ToList();
            if (tierRows.Count == 1)
                tiers.Add(tierRows);
            else
                // Still tied on this rung — descend to the next criterion.
                tiers.AddRange(Partition(tierRows, funnel, criterionIndex + 1, h2h));
        }
        return tiers;
    }

    /// <summary>Compute a single team's comparable value for one rung.</summary>
    private static decimal Score(
        StandingStats s,
        TieBreakerCriterion criterion,
        HashSet<Guid> tiedSubset,
        IReadOnlyCollection<HeadToHeadResult> h2h)
    {
        switch (criterion.Type)
        {
            case TieBreakerType.Points:
                return s.Points;

            case TieBreakerType.Wins:
                return s.Wins;

            case TieBreakerType.MetricFor:
                return s.For(RequireMetric(criterion));

            case TieBreakerType.MetricDifference:
                return s.Difference(RequireMetric(criterion));

            case TieBreakerType.MetricAgainstAscending:
                return s.Against(RequireMetric(criterion));

            case TieBreakerType.HeadToHead:
                // Points earned only in matches against the other tied teams.
                return h2h
                    .Where(r => r.RegistrationId == s.RegistrationId && tiedSubset.Contains(r.OpponentId))
                    .Sum(r => (decimal)r.PointsEarned);

            case TieBreakerType.HeadToHeadWins:
                return h2h.Count(r => r.RegistrationId == s.RegistrationId
                                      && r.Won
                                      && tiedSubset.Contains(r.OpponentId));

            default:
                throw new NotSupportedException($"Tie-breaker '{criterion.Type}' is not evaluable here.");
        }
    }

    private static Guid RequireMetric(TieBreakerCriterion c) =>
        c.MetricDefinitionId ?? throw new InvalidOperationException(
            $"Tie-breaker '{c.Type}' is missing its target MetricDefinitionId.");
}
