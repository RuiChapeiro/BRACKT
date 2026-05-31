using System.IdentityModel.Tokens.Jwt;
using Brackt.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace Brackt.Api.Security;

/// <summary>
/// Resolves the caller's identity from the validated JWT. Because the bearer
/// handler is configured with MapInboundClaims = false, the subject stays under
/// the raw "sub" claim.
/// </summary>
public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid? UserId
    {
        get
        {
            var sub = _accessor.HttpContext?.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated => _accessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
