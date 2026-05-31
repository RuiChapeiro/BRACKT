using System.Globalization;
using Brackt.Domain.Common;

namespace Brackt.Domain.Metrics;

/// <summary>
/// RF4.1 — a single recorded data point for a Simple metric, captured during a
/// match. This is the EAV "value" half of the flexible metric model:
///   (MetricDefinitionId, MatchId, subject) → numeric/text value.
///
/// The subject is either a match participant (a team's tally) or an individual
/// player, governed by the owning definition's <c>MetricScope</c>. Values are
/// stored canonically as <see cref="NumericValue"/> (decimal) so they aggregate
/// uniformly; <see cref="TextValue"/> is only used for Text-typed metrics.
///
/// Calculated metrics are NOT persisted here — they are derived on read from the
/// Simple values, so there is never a stale denormalised number to reconcile.
/// </summary>
public sealed class MetricValue : AggregateRoot
{
    public Guid MetricDefinitionId { get; private set; }
    public Guid MatchId { get; private set; }

    /// <summary>The competing entity within the match (a registration/participant slot).</summary>
    public Guid MatchParticipantId { get; private set; }

    /// <summary>Set only when the owning metric's scope is PerPlayerPerMatch.</summary>
    public Guid? PlayerId { get; private set; }

    /// <summary>Canonical numeric value (booleans → 0/1, durations → seconds).</summary>
    public decimal NumericValue { get; private set; }

    /// <summary>Used only for Text-typed metrics.</summary>
    public string? TextValue { get; private set; }

    /// <summary>Who recorded it — supports auditing of offline-entered scores.</summary>
    public Guid RecordedByUserId { get; private set; }

    private MetricValue() { } // EF

    public MetricValue(Guid metricDefinitionId, Guid matchId, Guid matchParticipantId,
                       decimal numericValue, Guid recordedByUserId, Guid? playerId = null, string? textValue = null)
    {
        MetricDefinitionId = metricDefinitionId;
        MatchId = matchId;
        MatchParticipantId = matchParticipantId;
        PlayerId = playerId;
        NumericValue = numericValue;
        TextValue = textValue;
        RecordedByUserId = recordedByUserId;
    }

    public void Amend(decimal numericValue, Guid byUserId, string? textValue = null)
    {
        NumericValue = numericValue;
        TextValue = textValue;
        RecordedByUserId = byUserId;
        Touch();
    }

    /// <summary>Convert a typed input into the canonical decimal representation.</summary>
    public static decimal Canonicalize(MetricDataType type, string raw) => type switch
    {
        MetricDataType.Integer  => decimal.Parse(raw, CultureInfo.InvariantCulture),
        MetricDataType.Decimal  => decimal.Parse(raw, CultureInfo.InvariantCulture),
        MetricDataType.Boolean  => (raw.Equals("true", StringComparison.OrdinalIgnoreCase) || raw == "1") ? 1m : 0m,
        MetricDataType.Duration => decimal.Parse(raw, CultureInfo.InvariantCulture), // seconds
        MetricDataType.Text     => 0m,
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };
}
