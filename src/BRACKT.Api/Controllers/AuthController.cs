using Brackt.Application.Abstractions;
using Brackt.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Brackt.Api.Controllers;

/// <summary>RF1.1 — registration, login and "who am I".</summary>
[Route("api/auth")]
public sealed class AuthController : ApiControllerBase
{
    private readonly IAuthService _auth;
    private readonly ICurrentUser _currentUser;

    public AuthController(IAuthService auth, ICurrentUser currentUser)
    {
        _auth = auth;
        _currentUser = currentUser;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct) =>
        FromResult(await _auth.RegisterAsync(request, ct));

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct) =>
        FromResult(await _auth.LoginAsync(request, ct));

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();
        return FromResult(await _auth.GetCurrentAsync(userId, ct));
    }
}
