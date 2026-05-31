namespace Brackt.Application.Auth;

// Request/response DTOs for authentication endpoints (RF1.1).

public sealed record RegisterRequest(string Email, string Password, string DisplayName);

public sealed record LoginRequest(string Email, string Password);

public sealed record UserDto(Guid Id, string Email, string DisplayName, string Role, Guid PlayerId);

/// <summary>Issued on successful register/login: the bearer token + the authenticated user.</summary>
public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, UserDto User);
