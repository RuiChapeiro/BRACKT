using Brackt.Domain.Common;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Brackt.Infrastructure.Persistence.Configurations;

internal static class ConfigurationExtensions
{
    /// <summary>
    /// Apply the cross-cutting aggregate-root mapping: the <c>RowVersion</c> column
    /// is marked as the optimistic-concurrency token so the database rejects a write
    /// whose base version is stale — the server-side half of sync conflict detection.
    /// </summary>
    public static void ConfigureAggregateRoot<T>(this EntityTypeBuilder<T> builder) where T : AggregateRoot
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();          // client-assigned GUIDs
        builder.Property(e => e.CreatedAtUtc);
        builder.Property(e => e.UpdatedAtUtc);
        builder.Property(e => e.RowVersion).IsConcurrencyToken();
    }
}
