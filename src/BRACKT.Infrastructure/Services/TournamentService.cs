using Brackt.Application.Abstractions;
using Brackt.Application.Common;
using Brackt.Application.Tournaments;
using Brackt.Domain.Common;
using Brackt.Domain.Rules;
using Brackt.Domain.Tournaments;
using Brackt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Brackt.Infrastructure.Services;

/// <summary>
/// Tournament creation/listing. A new tournament is provisioned with a default
/// ruleset (3-1-0 points, Points→Wins funnel) so it is immediately usable; the
/// organizer can refine rules later via the configurator.
/// </summary>
public sealed class TournamentService : ITournamentService
{
    private readonly BracktDbContext _db;

    public TournamentService(BracktDbContext db) => _db = db;

    public async Task<Result<TournamentDto>> CreateAsync(
        Guid organizerUserId, CreateTournamentRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<TournamentDto>.Fail("Tournament name is required.");

        var ruleSet = new RuleSet($"{request.Name.Trim()} Rules");
        ruleSet.ConfigurePointMatrix(win: 3, draw: 1, loss: 0);
        ruleSet.DefineTieBreakerFunnel(new[]
        {
            new TieBreakerCriterion(TieBreakerType.Points, SortDirection.Descending),
            new TieBreakerCriterion(TieBreakerType.Wins, SortDirection.Descending),
        });

        var tournament = new Tournament(
            request.Name,
            organizerUserId,
            ruleSet.Id,
            request.MaxParticipants > 0 ? request.MaxParticipants : null);

        if (!string.IsNullOrWhiteSpace(request.Description))
            tournament.UpdateDetails(null, request.Description, null, null);

        _db.RuleSets.Add(ruleSet);
        _db.Tournaments.Add(tournament);
        await _db.SaveChangesAsync(ct);

        return Result<TournamentDto>.Ok(ToDto(tournament));
    }

    public async Task<IReadOnlyList<TournamentDto>> ListAsync(CancellationToken ct = default)
    {
        var tournaments = await _db.Tournaments
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync(ct);
        return tournaments.Select(ToDto).ToList();
    }

    public async Task<Result<TournamentDto>> GetAsync(Guid id, CancellationToken ct = default)
    {
        var tournament = await _db.Tournaments.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);
        return tournament is null
            ? Result<TournamentDto>.Fail("Tournament not found.", ResultError.NotFound)
            : Result<TournamentDto>.Ok(ToDto(tournament));
    }

    private static TournamentDto ToDto(Tournament t) => new(
        t.Id, t.Name, t.Description, t.Status.ToString(), t.MaxParticipants,
        t.PublicRegistrationToken, t.CreatedAtUtc);
}
