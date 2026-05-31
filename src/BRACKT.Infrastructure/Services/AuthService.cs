using Brackt.Application.Abstractions;
using Brackt.Application.Auth;
using Brackt.Application.Common;
using Brackt.Domain.Identity;
using Brackt.Domain.Players;
using Brackt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Brackt.Infrastructure.Services;

/// <summary>
/// RF1.1 — registration & login. Registration creates the account AND its native
/// competitive <see cref="Player"/> together (all history hangs off Player, never
/// User directly), linking them in a single transaction.
/// </summary>
public sealed class AuthService : IAuthService
{
    private readonly BracktDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _jwt;

    public AuthService(BracktDbContext db, IPasswordHasher hasher, IJwtTokenGenerator jwt)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!email.Contains('@'))
            return Result<AuthResponse>.Fail("A valid email is required.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return Result<AuthResponse>.Fail("Password must be at least 6 characters.");
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return Result<AuthResponse>.Fail("Display name is required.");

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            return Result<AuthResponse>.Fail("That email is already registered.", ResultError.Conflict);

        // Create the account, then its native player, then cross-link them.
        var user = new User(email, request.DisplayName, playerId: Guid.Empty, passwordHash: _hasher.Hash(request.Password));
        var player = Player.CreateForUser(user.Id, request.DisplayName);
        user.AssignPlayer(player.Id);

        _db.Players.Add(player);
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return Result<AuthResponse>.Ok(BuildAuthResponse(user));
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Same response whether the email is unknown or the password is wrong.
        if (user is null || user.PasswordHash is null || !_hasher.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponse>.Fail("Invalid email or password.", ResultError.Unauthorized);

        return Result<AuthResponse>.Ok(BuildAuthResponse(user));
    }

    public async Task<Result<UserDto>> GetCurrentAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        return user is null
            ? Result<UserDto>.Fail("User not found.", ResultError.NotFound)
            : Result<UserDto>.Ok(ToDto(user));
    }

    private AuthResponse BuildAuthResponse(User user)
    {
        var (token, expires) = _jwt.Generate(user);
        return new AuthResponse(token, expires, ToDto(user));
    }

    private static UserDto ToDto(User user) =>
        new(user.Id, user.Email, user.DisplayName, user.Role.ToString(), user.PlayerId);
}
