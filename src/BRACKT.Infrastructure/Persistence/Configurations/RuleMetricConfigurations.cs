using Brackt.Domain.Metrics;
using Brackt.Domain.Rules;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Brackt.Infrastructure.Persistence.Configurations;

internal sealed class RuleSetConfiguration : IEntityTypeConfiguration<RuleSet>
{
    public void Configure(EntityTypeBuilder<RuleSet> builder)
    {
        builder.ToTable("RuleSets");
        builder.ConfigureAggregateRoot();
        builder.Property(r => r.Name).IsRequired().HasMaxLength(120);

        // RF4.5 — the ordered tie-breaker funnel is owned by the ruleset.
        builder.OwnsMany(r => r.TieBreakers, b =>
        {
            b.ToTable("TieBreakerCriteria");
            b.HasKey(c => c.Id);
            b.Property(c => c.Id).ValueGeneratedNever();
            b.Property(c => c.Type).HasConversion<string>().HasMaxLength(32);
            b.Property(c => c.Direction).HasConversion<string>().HasMaxLength(12);
            b.Property(c => c.Label).HasMaxLength(80);
            b.WithOwner().HasForeignKey(c => c.RuleSetId);
            // Priority is unique within a ruleset — it IS the funnel order.
            b.HasIndex(c => new { c.RuleSetId, c.Priority }).IsUnique();
        });
        builder.Navigation(r => r.TieBreakers).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class MetricDefinitionConfiguration : IEntityTypeConfiguration<MetricDefinition>
{
    public void Configure(EntityTypeBuilder<MetricDefinition> builder)
    {
        builder.ToTable("MetricDefinitions");
        builder.ConfigureAggregateRoot();

        builder.Property(m => m.Key).IsRequired().HasMaxLength(64);
        builder.Property(m => m.DisplayName).IsRequired().HasMaxLength(120);
        builder.Property(m => m.Unit).HasMaxLength(16);
        builder.Property(m => m.Formula).HasMaxLength(512);
        builder.Property(m => m.Kind).HasConversion<string>().HasMaxLength(16);
        builder.Property(m => m.DataType).HasConversion<string>().HasMaxLength(16);
        builder.Property(m => m.Scope).HasConversion<string>().HasMaxLength(24);

        // A metric key is unique within its tournament — formulas reference by key.
        builder.HasIndex(m => new { m.TournamentId, m.Key }).IsUnique();
    }
}

internal sealed class MetricValueConfiguration : IEntityTypeConfiguration<MetricValue>
{
    public void Configure(EntityTypeBuilder<MetricValue> builder)
    {
        builder.ToTable("MetricValues");
        builder.ConfigureAggregateRoot();

        builder.Property(v => v.NumericValue).HasColumnType("decimal(18,4)");
        builder.Property(v => v.TextValue).HasMaxLength(512);

        builder.HasIndex(v => new { v.MatchId, v.MetricDefinitionId, v.MatchParticipantId, v.PlayerId })
               .IsUnique();   // one value per (match, metric, side, optional player)
        builder.HasIndex(v => v.PlayerId);   // career-stat aggregation
    }
}
