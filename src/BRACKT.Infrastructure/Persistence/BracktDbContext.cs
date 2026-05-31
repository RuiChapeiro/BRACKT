using Brackt.Domain.Common;
using Brackt.Domain.Communication;
using Brackt.Domain.Identity;
using Brackt.Domain.Logistics;
using Brackt.Domain.Metrics;
using Brackt.Domain.Players;
using Brackt.Domain.Rules;
using Brackt.Domain.Teams;
using Brackt.Domain.Tournaments;
using Microsoft.EntityFrameworkCore;

namespace Brackt.Infrastructure.Persistence;

/// <summary>
/// The central server-side database context. All entity configuration is applied
/// from <see cref="IEntityTypeConfiguration{T}"/> classes in this assembly.
///
/// Two cross-cutting concerns are handled here in <see cref="SaveChangesAsync"/>:
///   1. Audit + optimistic concurrency: <c>CreatedAtUtc</c>, <c>UpdatedAtUtc</c>
///      and <c>RowVersion</c> are maintained centrally so every aggregate gets a
///      monotonic version the sync layer can use for conflict detection.
///   2. Domain-event collection: events raised by aggregates are gathered and
///      handed to the dispatcher AFTER a successful commit (real-time / push).
/// </summary>
public sealed class BracktDbContext : DbContext
{
    private readonly IDomainEventDispatcher? _dispatcher;

    public BracktDbContext(DbContextOptions<BracktDbContext> options,
                           IDomainEventDispatcher? dispatcher = null)
        : base(options)
    {
        _dispatcher = dispatcher;
    }

    // Identity & players
    public DbSet<User> Users => Set<User>();
    public DbSet<Player> Players => Set<Player>();

    // Teams
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamInvitation> TeamInvitations => Set<TeamInvitation>();

    // Tournaments
    public DbSet<Tournament> Tournaments => Set<Tournament>();
    public DbSet<Stage> Stages => Set<Stage>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Registration> Registrations => Set<Registration>();

    // Rules & metrics
    public DbSet<RuleSet> RuleSets => Set<RuleSet>();
    public DbSet<MetricDefinition> MetricDefinitions => Set<MetricDefinition>();
    public DbSet<MetricValue> MetricValues => Set<MetricValue>();

    // Logistics
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<ScheduleConflict> ScheduleConflicts => Set<ScheduleConflict>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();

    // Communication
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BracktDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndConcurrency();

        // Collect events before committing so we can dispatch only on success.
        var aggregates = ChangeTracker.Entries<AggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        if (_dispatcher is not null && aggregates.Count > 0)
        {
            var events = aggregates.SelectMany(a => a.DomainEvents).ToList();
            foreach (var aggregate in aggregates) aggregate.ClearDomainEvents();
            await _dispatcher.DispatchAsync(events, cancellationToken);
        }

        return result;
    }

    /// <summary>
    /// Centralised maintenance of the <see cref="IAuditable"/> columns. The domain
    /// already bumps RowVersion via <c>Touch()</c>; here we guarantee timestamps
    /// for any path that mutated state without it, keeping the invariant that an
    /// updated row always advances its version (the sync conflict signal).
    /// </summary>
    private void ApplyAuditAndConcurrency()
    {
        foreach (var entry in ChangeTracker.Entries<AggregateRoot>())
        {
            switch (entry.State)
            {
                case EntityState.Modified:
                    entry.Property(nameof(IAuditable.UpdatedAtUtc)).CurrentValue = DateTime.UtcNow;
                    break;
            }
        }
    }
}

/// <summary>
/// Abstraction for post-commit domain-event delivery (implemented in the API/host
/// layer, typically forwarding to SignalR hubs and the push dispatcher). Declared
/// here so the context can depend on it without referencing the transport layer.
/// </summary>
public interface IDomainEventDispatcher
{
    Task DispatchAsync(IReadOnlyCollection<IDomainEvent> events, CancellationToken ct = default);
}
