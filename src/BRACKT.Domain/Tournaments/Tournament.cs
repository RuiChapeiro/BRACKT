using System.Security.Cryptography;
using Brackt.Domain.Common;
using Brackt.Domain.Tournaments.Events;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// Aggregate root for a competition. Owns its stages, registrations and the
/// public registration link. A tournament is sport-agnostic: its sport-specific
/// behaviour is entirely supplied by its associated <c>RuleSet</c> and
/// <c>MetricDefinition</c> set.
///
/// A tournament can be multi-stage (e.g. Round-Robin groups → Single-Elim
/// playoff). Each <see cref="Stage"/> carries its own format and seeding policy.
/// </summary>
public sealed class Tournament : AggregateRoot
{
    private readonly List<Stage> _stages = new();
    private readonly List<Registration> _registrations = new();

    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public Guid OrganizerUserId { get; private set; }
    public Guid RuleSetId { get; private set; }
    public TournamentStatus Status { get; private set; } = TournamentStatus.Draft;

    public DateTime? StartsAtUtc { get; private set; }
    public DateTime? EndsAtUtc { get; private set; }
    public int? MaxParticipants { get; private set; }

    /// <summary>RF3.4 — opaque token forming the public shareable registration URL.</summary>
    public string PublicRegistrationToken { get; private set; } = null!;
    public bool RegistrationLinkEnabled { get; private set; } = true;

    public IReadOnlyList<Stage> Stages => _stages.OrderBy(s => s.Order).ToList();
    public IReadOnlyCollection<Registration> Registrations => _registrations.AsReadOnly();

    private Tournament() { } // EF

    public Tournament(string name, Guid organizerUserId, Guid ruleSetId, int? maxParticipants = null)
    {
        Name = name.Trim();
        OrganizerUserId = organizerUserId;
        RuleSetId = ruleSetId;
        MaxParticipants = maxParticipants;
        PublicRegistrationToken = GenerateToken();
    }

    public void UpdateDetails(string? name, string? description, DateTime? startsAtUtc, DateTime? endsAtUtc)
    {
        if (!string.IsNullOrWhiteSpace(name)) Name = name.Trim();
        if (description is not null) Description = description;
        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
        Touch();
    }

    // ----- RF3.4 registration link -------------------------------------------
    public void OpenRegistration()
    {
        EnsureStatus(TournamentStatus.Draft, TournamentStatus.RegistrationClosed);
        Status = TournamentStatus.RegistrationOpen;
        Touch();
        Raise(new TournamentStatusChanged(Id, Status));
    }

    public void CloseRegistration()
    {
        EnsureStatus(TournamentStatus.RegistrationOpen);
        Status = TournamentStatus.RegistrationClosed;
        Touch();
        Raise(new TournamentStatusChanged(Id, Status));
    }

    public void RegenerateRegistrationLink() { PublicRegistrationToken = GenerateToken(); Touch(); }
    public void SetRegistrationLinkEnabled(bool enabled) { RegistrationLinkEnabled = enabled; Touch(); }

    /// <summary>Register a team (entrant) into the tournament.</summary>
    public Registration RegisterTeam(Guid teamId, string seedLabel)
    {
        if (Status != TournamentStatus.RegistrationOpen)
            throw new InvalidOperationException("Registration is not open.");
        if (_registrations.Any(r => r.TeamId == teamId))
            throw new InvalidOperationException("Team is already registered.");
        if (MaxParticipants is { } cap && _registrations.Count >= cap)
            throw new InvalidOperationException("Tournament is full.");

        var registration = new Registration(Id, teamId, seedLabel);
        _registrations.Add(registration);
        Touch();
        Raise(new TeamRegistered(Id, registration.Id, teamId));
        return registration;
    }

    // ----- Stages -------------------------------------------------------------
    public Stage AddStage(string name, TournamentFormat format, SeedingMethod seedingMethod, int? groupCount = null)
    {
        var stage = new Stage(Id, name, format, seedingMethod, _stages.Count, groupCount);
        _stages.Add(stage);
        Touch();
        return stage;
    }

    public void MarkInProgress()
    {
        EnsureStatus(TournamentStatus.Seeding, TournamentStatus.RegistrationClosed);
        Status = TournamentStatus.InProgress;
        Touch();
        Raise(new TournamentStatusChanged(Id, Status));
    }

    public void Complete()
    {
        Status = TournamentStatus.Completed;
        Touch();
        Raise(new TournamentStatusChanged(Id, Status));
    }

    private void EnsureStatus(params TournamentStatus[] allowed)
    {
        if (!allowed.Contains(Status))
            throw new InvalidOperationException(
                $"Operation invalid in status {Status}; expected one of {string.Join(", ", allowed)}.");
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
