using Brackt.Domain.Common;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// A phase of a tournament with a single format (RF3.1–RF3.4). A tournament may
/// chain stages — e.g. a RoundRobin group stage feeding a SingleElimination
/// playoff. The <c>TournamentBracketGenerator</c> reads a stage's
/// <see cref="Format"/> and <see cref="SeedingMethod"/> to materialise its
/// groups and matches.
/// </summary>
public sealed class Stage : Entity
{
    private readonly List<Group> _groups = new();
    private readonly List<Seed> _seeds = new();

    public Guid TournamentId { get; private set; }
    public string Name { get; private set; } = null!;
    public TournamentFormat Format { get; private set; }
    public SeedingMethod SeedingMethod { get; private set; }

    /// <summary>Position in the tournament's stage chain (0-based).</summary>
    public int Order { get; private set; }

    /// <summary>For RoundRobin: number of groups to split entrants into (1 = single league).</summary>
    public int GroupCount { get; private set; } = 1;

    /// <summary>RoundRobin only: how many matches each pair plays (1 = single, 2 = home/away).</summary>
    public int LegsPerPairing { get; private set; } = 1;

    /// <summary>Optional per-stage ruleset override; falls back to the tournament's ruleset when null.</summary>
    public Guid? RuleSetOverrideId { get; private set; }

    public bool IsGenerated { get; private set; }

    public IReadOnlyCollection<Group> Groups => _groups.AsReadOnly();
    public IReadOnlyList<Seed> Seeds => _seeds.OrderBy(s => s.Position).ToList();

    private Stage() { } // EF

    internal Stage(Guid tournamentId, string name, TournamentFormat format,
                   SeedingMethod seedingMethod, int order, int? groupCount)
    {
        TournamentId = tournamentId;
        Name = name.Trim();
        Format = format;
        SeedingMethod = seedingMethod;
        Order = order;
        GroupCount = groupCount is > 0 ? groupCount.Value : 1;
    }

    public void ConfigureRoundRobin(int legsPerPairing)
    {
        if (Format != TournamentFormat.RoundRobin)
            throw new InvalidOperationException("Legs only apply to RoundRobin stages.");
        LegsPerPairing = Math.Max(1, legsPerPairing);
    }

    /// <summary>
    /// RF3.3 — set the seeding order. <paramref name="orderedRegistrationIds"/> is
    /// the manual/random/standings-derived order; index 0 is the top seed.
    /// </summary>
    public void SetSeeds(IReadOnlyList<Guid> orderedRegistrationIds)
    {
        _seeds.Clear();
        for (var i = 0; i < orderedRegistrationIds.Count; i++)
            _seeds.Add(new Seed(Id, orderedRegistrationIds[i], position: i + 1));
    }

    internal Group AddGroup(string name, int index)
    {
        var group = new Group(Id, name, index);
        _groups.Add(group);
        return group;
    }

    internal void MarkGenerated() => IsGenerated = true;
}
