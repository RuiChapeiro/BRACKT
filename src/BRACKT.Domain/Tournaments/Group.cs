using Brackt.Domain.Common;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// A group/pool within a stage and the matches played inside it. For a
/// SingleElimination stage there is a single implicit group holding the whole
/// bracket; for RoundRobin there are <c>Stage.GroupCount</c> groups. Standings
/// (and the tie-breaker funnel) are computed per group.
/// </summary>
public sealed class Group : Entity
{
    private readonly List<Match> _matches = new();

    public Guid StageId { get; private set; }
    public string Name { get; private set; } = null!;   // "Group A", "Main Bracket"
    public int Index { get; private set; }              // 0-based ordering

    public IReadOnlyCollection<Match> Matches => _matches.AsReadOnly();

    private Group() { } // EF

    internal Group(Guid stageId, string name, int index)
    {
        StageId = stageId;
        Name = name.Trim();
        Index = index;
    }

    internal Match AddMatch(Match match)
    {
        _matches.Add(match);
        return match;
    }
}
