using Brackt.Application.Abstractions;
using Brackt.Application.Tournaments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Brackt.Api.Controllers;

/// <summary>Create and browse tournaments. Listing is public; creation requires auth.</summary>
[Route("api/tournaments")]
public sealed class TournamentsController : ApiControllerBase
{
    private readonly ITournamentService _tournaments;
    private readonly ICurrentUser _currentUser;

    public TournamentsController(ITournamentService tournaments, ICurrentUser currentUser)
    {
        _tournaments = tournaments;
        _currentUser = currentUser;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _tournaments.ListAsync(ct));

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        FromResult(await _tournaments.GetAsync(id, ct));

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateTournamentRequest request, CancellationToken ct)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();
        return FromResult(await _tournaments.CreateAsync(userId, request, ct));
    }
}
