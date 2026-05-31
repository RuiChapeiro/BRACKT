using Brackt.Domain.Common;

namespace Brackt.Domain.Tournaments;

/// <summary>
/// RF3.3 — a registration's seeded position within a stage (1 = top seed). The
/// bracket generator consumes seeds to place entrants so that, conventionally,
/// the strongest seeds only meet in later rounds (1 vs lowest, 2 vs second-lowest…).
/// </summary>
public sealed class Seed : Entity
{
    public Guid StageId { get; private set; }
    public Guid RegistrationId { get; private set; }
    public int Position { get; private set; }   // 1-based

    private Seed() { } // EF

    internal Seed(Guid stageId, Guid registrationId, int position)
    {
        StageId = stageId;
        RegistrationId = registrationId;
        Position = position;
    }
}
