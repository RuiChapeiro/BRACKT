using Brackt.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace Brackt.Api.Controllers;

/// <summary>Maps the Application-layer <see cref="Result"/> types onto HTTP responses.</summary>
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult FromResult<T>(Result<T> result) =>
        result.IsSuccess ? Ok(result.Value) : Error(result);

    protected IActionResult Error(Result result)
    {
        var body = new { error = result.Error };
        return result.ErrorKind switch
        {
            ResultError.Unauthorized => Unauthorized(body),
            ResultError.Conflict => Conflict(body),
            ResultError.NotFound => NotFound(body),
            _ => BadRequest(body),
        };
    }
}
