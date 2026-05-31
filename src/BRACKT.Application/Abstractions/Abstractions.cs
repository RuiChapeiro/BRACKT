using Brackt.Application.Auth;
using Brackt.Application.Common;
using Brackt.Application.Tournaments;
using Brackt.Domain.Identity;

namespace Brackt.Application.Abstractions;

/// <summary>Hashes and verifies passwords (implemented with PBKDF2 in Infrastructure).</summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

/// <summary>Issues signed JWTs for an authenticated <see cref="User"/>.</summary>
public interface IJwtTokenGenerator
{
    (string token, DateTime expiresAtUtc) Generate(User user);
}

/// <summary>Ambient information about the caller, derived from the validated JWT.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}

/// <summary>RF1.1 — registration & authentication use-cases.</summary>
public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<Result<UserDto>> GetCurrentAsync(Guid userId, CancellationToken ct = default);
}

/// <summary>Tournament creation/listing use-cases.</summary>
public interface ITournamentService
{
    Task<Result<TournamentDto>> CreateAsync(Guid organizerUserId, CreateTournamentRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<TournamentDto>> ListAsync(CancellationToken ct = default);
    Task<Result<TournamentDto>> GetAsync(Guid id, CancellationToken ct = default);
}
