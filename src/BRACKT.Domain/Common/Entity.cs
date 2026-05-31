namespace Brackt.Domain.Common;

/// <summary>
/// Base class for every persistent domain object.
///
/// Design notes for the offline-first model:
///  * The identifier is a <see cref="Guid"/> generated on the CLIENT, not a
///    database identity column. This is what makes the offline-first pipeline
///    safe: a record created on a phone with no connectivity already owns a
///    stable, globally-unique key, so when the outbox finally syncs there is
///    never an id-reconciliation step and replays are naturally idempotent.
/// </summary>
public abstract class Entity
{
    /// <summary>Globally unique, client-assignable primary key.</summary>
    public Guid Id { get; protected set; } = Guid.NewGuid();

    public override bool Equals(object? obj)
        => obj is Entity other && GetType() == other.GetType() && Id.Equals(other.Id);

    public override int GetHashCode() => HashCode.Combine(GetType(), Id);
}

/// <summary>
/// Auditing + optimistic-concurrency contract.
///
/// <see cref="RowVersion"/> is the conflict-resolution backbone for sync: the
/// client sends the version it last saw, and the server rejects (or merges) a
/// mutation whose base version is stale. <see cref="UpdatedAtUtc"/> additionally
/// supports "pull everything changed since" delta sync.
/// </summary>
public interface IAuditable
{
    DateTime CreatedAtUtc { get; }
    DateTime UpdatedAtUtc { get; }
    /// <summary>Monotonically increasing version used for optimistic concurrency / sync conflict detection.</summary>
    long RowVersion { get; }
}

/// <summary>
/// Marker for an aggregate root — the only kind of entity an outside caller
/// (repository, sync endpoint) is allowed to load and persist as a unit.
/// Aggregates also collect domain events for the real-time / notification fan-out.
/// </summary>
public abstract class AggregateRoot : Entity, IAuditable
{
    public DateTime CreatedAtUtc { get; protected set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; protected set; } = DateTime.UtcNow;
    public long RowVersion { get; protected set; }

    private readonly List<IDomainEvent> _domainEvents = new();
    /// <summary>Events raised during this unit of work; dispatched after a successful commit (e.g. to SignalR).</summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void Raise(IDomainEvent @event) => _domainEvents.Add(@event);
    public void ClearDomainEvents() => _domainEvents.Clear();

    /// <summary>Call from every state mutation so audit + concurrency columns stay in sync.</summary>
    protected void Touch()
    {
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }
}

/// <summary>Domain event marker; carries the moment the event occurred.</summary>
public interface IDomainEvent
{
    DateTime OccurredAtUtc { get; }
}
