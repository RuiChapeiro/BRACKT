using Brackt.Domain.Common;

namespace Brackt.Domain.Rules;

/// <summary>
/// RF4.5 — a single rung in the "tie-breaker funnel". The funnel is an ordered
/// array of these; the <c>TieBreakerEvaluator</c> walks them by ascending
/// <see cref="Priority"/>, partitioning still-tied teams at each rung until the
/// tie is broken or the funnel is exhausted.
///
/// Each criterion is fully data-driven:
///   • <see cref="Type"/>            — which comparison to perform.
///   • <see cref="Direction"/>        — higher-is-better vs lower-is-better.
///   • <see cref="MetricDefinitionId"/> — for metric-based rungs (goal diff, cards…),
///                                        points at the configurable metric to read.
/// This is what keeps the engine agnostic: "goal difference then yellow cards
/// ascending" and "kill difference then deaths ascending" are the same code with
/// different rows.
/// </summary>
public sealed class TieBreakerCriterion : Entity
{
    public Guid RuleSetId { get; private set; }

    /// <summary>0-based position in the funnel. Lower = applied earlier.</summary>
    public int Priority { get; private set; }

    public TieBreakerType Type { get; private set; }
    public SortDirection Direction { get; private set; }

    /// <summary>Target metric for MetricDifference / MetricFor / MetricAgainst rungs.</summary>
    public Guid? MetricDefinitionId { get; private set; }

    /// <summary>Optional human label shown in the rules UI (e.g. "Goal Difference").</summary>
    public string? Label { get; private set; }

    private TieBreakerCriterion() { } // EF

    public TieBreakerCriterion(TieBreakerType type, SortDirection direction,
                               Guid? metricDefinitionId = null, string? label = null)
    {
        if (RequiresMetric(type) && metricDefinitionId is null)
            throw new ArgumentException($"Tie-breaker '{type}' requires a target MetricDefinitionId.");

        Type = type;
        Direction = direction;
        MetricDefinitionId = metricDefinitionId;
        Label = label;
    }

    internal void AssignPriority(int priority) => Priority = priority;
    internal void AttachTo(Guid ruleSetId) => RuleSetId = ruleSetId;

    public static bool RequiresMetric(TieBreakerType type) => type is
        TieBreakerType.MetricDifference or
        TieBreakerType.MetricFor or
        TieBreakerType.MetricAgainstAscending;
}
