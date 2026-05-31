using Brackt.Domain.Common;

namespace Brackt.Domain.Metrics;

/// <summary>
/// RF4.1 / RF4.2 — the schema of a single tracked statistic, authored in the
/// visual Metrics Configurator. This is the cornerstone of sport-agnosticism:
/// "goals", "kills", "yellow cards", "aces" are all rows here, never enum members.
///
///   • <see cref="Kind"/> = Simple     → entered by a scorekeeper.
///   • <see cref="Kind"/> = Calculated → derived from other metrics via
///                                       <see cref="Formula"/> at read time
///                                       (e.g. K/D = Kills / max(Deaths,1),
///                                        Goal Difference = GoalsFor - GoalsAgainst).
///
/// Calculated metrics reference their inputs by <see cref="MetricDefinition.Key"/>,
/// so a formula is portable and human-auditable. The expression engine that
/// evaluates <see cref="Formula"/> lives in Application; the domain only stores
/// the definition and validates structural integrity.
/// </summary>
public sealed class MetricDefinition : AggregateRoot
{
    /// <summary>Owning tournament (metrics are scoped to a tournament's ruleset).</summary>
    public Guid TournamentId { get; private set; }

    /// <summary>Stable machine key referenced by formulas, e.g. "goals", "deaths".</summary>
    public string Key { get; private set; } = null!;

    /// <summary>Human label shown in UI, e.g. "Goals Scored".</summary>
    public string DisplayName { get; private set; } = null!;
    public string? Unit { get; private set; }          // "pts", "sec", "%", null
    public MetricKind Kind { get; private set; }
    public MetricDataType DataType { get; private set; }
    public MetricScope Scope { get; private set; }

    /// <summary>For Calculated metrics — the formula expression (e.g. "kills / max(deaths, 1)").</summary>
    public string? Formula { get; private set; }

    /// <summary>Display ordering in score sheets and tables.</summary>
    public int SortOrder { get; private set; }

    /// <summary>If true, lower values are "better" (cards, deaths) — informs default sort.</summary>
    public bool LowerIsBetter { get; private set; }

    /// <summary>Whether this metric may be selected as a tie-breaker target.</summary>
    public bool UsableAsTieBreaker { get; private set; } = true;

    private MetricDefinition() { } // EF

    private MetricDefinition(Guid tournamentId, string key, string displayName,
                             MetricKind kind, MetricDataType dataType, MetricScope scope)
    {
        TournamentId = tournamentId;
        Key = NormalizeKey(key);
        DisplayName = displayName.Trim();
        Kind = kind;
        DataType = dataType;
        Scope = scope;
    }

    /// <summary>RF4.1 — a directly-recorded metric (goals, kills, cards…).</summary>
    public static MetricDefinition CreateSimple(Guid tournamentId, string key, string displayName,
        MetricDataType dataType, MetricScope scope, string? unit = null,
        bool lowerIsBetter = false, int sortOrder = 0)
        => new(tournamentId, key, displayName, MetricKind.Simple, dataType, scope)
        {
            Unit = unit,
            LowerIsBetter = lowerIsBetter,
            SortOrder = sortOrder
        };

    /// <summary>
    /// RF4.2 — a calculated metric. <paramref name="formula"/> references other
    /// metrics by their <see cref="Key"/>. Calculated metrics are always Decimal
    /// and are never stored as raw <c>MetricValue</c>s — they are evaluated on read.
    /// </summary>
    public static MetricDefinition CreateCalculated(Guid tournamentId, string key, string displayName,
        string formula, MetricScope scope, string? unit = null, bool lowerIsBetter = false, int sortOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(formula))
            throw new ArgumentException("A calculated metric requires a formula.");
        return new(tournamentId, key, displayName, MetricKind.Calculated, MetricDataType.Decimal, scope)
        {
            Formula = formula.Trim(),
            Unit = unit,
            LowerIsBetter = lowerIsBetter,
            SortOrder = sortOrder
        };
    }

    public void UpdateFormula(string formula)
    {
        if (Kind != MetricKind.Calculated)
            throw new InvalidOperationException("Only calculated metrics have a formula.");
        Formula = formula.Trim();
        Touch();
    }

    public void Rename(string displayName) { DisplayName = displayName.Trim(); Touch(); }
    public void SetTieBreakerEligibility(bool usable) { UsableAsTieBreaker = usable; Touch(); }

    private static string NormalizeKey(string key)
    {
        var k = key.Trim().ToLowerInvariant().Replace(' ', '_');
        if (string.IsNullOrEmpty(k))
            throw new ArgumentException("Metric key cannot be empty.");
        return k;
    }
}
