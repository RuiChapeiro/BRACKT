using Brackt.Domain.Common;

namespace Brackt.Domain.Rules;

/// <summary>
/// RF4.3–RF4.5 — the complete, sport-agnostic competition ruleset attached to a
/// tournament (or overridden per stage). Nothing here is hard-coded to a sport;
/// it is pure configuration that the standings engine and
/// <c>TieBreakerEvaluator</c> interpret at runtime.
///
///   • <see cref="PointMatrix"/>      — points awarded per Win/Draw/Loss/Walkover.
///   • Extra-time / tie-break toggles — whether a match may end drawn.
///   • <see cref="TieBreakers"/>       — the ORDERED funnel that ranks tied teams
///                                       in a group/round-robin standings table.
/// </summary>
public sealed class RuleSet : AggregateRoot
{
    private readonly List<TieBreakerCriterion> _tieBreakers = new();

    public string Name { get; private set; } = null!;

    // ----- RF4.3 point matrix -------------------------------------------------
    public int PointsPerWin { get; private set; } = 3;
    public int PointsPerDraw { get; private set; } = 1;
    public int PointsPerLoss { get; private set; }
    public int PointsPerWalkoverWin { get; private set; } = 3;
    public int PointsPerWalkoverLoss { get; private set; }

    // ----- RF4.4 extra time / tie-break toggles ------------------------------
    /// <summary>If false, draws are allowed (league play). If true, a match must produce a winner.</summary>
    public bool DrawsResolvedByExtraTime { get; private set; }
    public bool ExtraTimeEnabled { get; private set; }
    public bool PenaltyShootoutEnabled { get; private set; }

    /// <summary>RF4.5 — the ordered tie-break funnel, evaluated top priority first.</summary>
    public IReadOnlyList<TieBreakerCriterion> TieBreakers
        => _tieBreakers.OrderBy(c => c.Priority).ToList();

    private RuleSet() { } // EF

    public RuleSet(string name)
    {
        Name = name.Trim();
    }

    public void ConfigurePointMatrix(int win, int draw, int loss, int? walkoverWin = null, int? walkoverLoss = null)
    {
        PointsPerWin = win;
        PointsPerDraw = draw;
        PointsPerLoss = loss;
        PointsPerWalkoverWin = walkoverWin ?? win;
        PointsPerWalkoverLoss = walkoverLoss ?? loss;
        Touch();
    }

    public void ConfigureResolution(bool drawsResolvedByExtraTime, bool extraTimeEnabled, bool penaltyShootoutEnabled)
    {
        DrawsResolvedByExtraTime = drawsResolvedByExtraTime;
        ExtraTimeEnabled = extraTimeEnabled;
        PenaltyShootoutEnabled = penaltyShootoutEnabled;
        Touch();
    }

    /// <summary>
    /// RF4.5 — replace the funnel with an ordered list of criteria. Order in the
    /// supplied list IS the priority (index 0 = first tie-breaker applied).
    /// </summary>
    public void DefineTieBreakerFunnel(IEnumerable<TieBreakerCriterion> orderedCriteria)
    {
        _tieBreakers.Clear();
        var priority = 0;
        foreach (var criterion in orderedCriteria)
        {
            criterion.AssignPriority(priority++);
            criterion.AttachTo(Id);
            _tieBreakers.Add(criterion);
        }
        Touch();
    }
}
