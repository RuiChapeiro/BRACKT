namespace Brackt.Domain.Engine.Standings;

/// <summary>
/// Aggregated group-stage statistics for one registration, assembled by the
/// Application layer from match results + metric values. This is the input the
/// <see cref="TieBreakerEvaluator"/> ranks; keeping it a plain immutable record
/// makes the evaluator pure and trivially testable.
///
/// <see cref="MetricFor"/> / <see cref="MetricAgainst"/> are keyed by
/// <c>MetricDefinition.Id</c>, so a metric-based tie-breaker rung reads the exact
/// configured metric (goal difference, kill difference, fewest cards, …).
/// </summary>
public sealed record StandingStats(
    Guid RegistrationId,
    int Points,
    int Wins,
    int Draws,
    int Losses,
    IReadOnlyDictionary<Guid, decimal> MetricFor,
    IReadOnlyDictionary<Guid, decimal> MetricAgainst)
{
    public static StandingStats Empty(Guid registrationId) => new(
        registrationId, 0, 0, 0, 0,
        new Dictionary<Guid, decimal>(), new Dictionary<Guid, decimal>());

    public decimal For(Guid metricId) => MetricFor.GetValueOrDefault(metricId);
    public decimal Against(Guid metricId) => MetricAgainst.GetValueOrDefault(metricId);
    public decimal Difference(Guid metricId) => For(metricId) - Against(metricId);
}

/// <summary>
/// One head-to-head outcome from <see cref="RegistrationId"/>'s perspective. The
/// evaluator sums these — restricted to the currently tied subset — to resolve
/// head-to-head rungs correctly even among three or more level teams.
/// </summary>
public sealed record HeadToHeadResult(
    Guid RegistrationId,
    Guid OpponentId,
    int PointsEarned,
    bool Won);

/// <summary>Final placement for a registration after the funnel has been applied.</summary>
public sealed record RankedStanding(Guid RegistrationId, int Rank, StandingStats Stats)
{
    /// <summary>True when this team shares its rank with another (tie unresolved by the funnel).</summary>
    public bool IsTied { get; init; }
}
