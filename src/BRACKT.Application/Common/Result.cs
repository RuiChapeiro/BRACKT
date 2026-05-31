namespace Brackt.Application.Common;

/// <summary>
/// Lightweight result type so use-cases can report expected failures
/// (bad credentials, duplicate email) without throwing — keeping control flow
/// explicit and letting controllers map cleanly to HTTP status codes.
/// </summary>
public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public ResultError ErrorKind { get; }

    protected Result(bool isSuccess, string? error, ResultError errorKind)
    {
        IsSuccess = isSuccess;
        Error = error;
        ErrorKind = errorKind;
    }

    public static Result Ok() => new(true, null, ResultError.None);
    public static Result Fail(string error, ResultError kind = ResultError.Validation) => new(false, error, kind);
}

public sealed class Result<T> : Result
{
    public T? Value { get; }

    private Result(bool isSuccess, T? value, string? error, ResultError kind)
        : base(isSuccess, error, kind)
    {
        Value = value;
    }

    public static Result<T> Ok(T value) => new(true, value, null, ResultError.None);
    public static new Result<T> Fail(string error, ResultError kind = ResultError.Validation)
        => new(false, default, error, kind);
}

/// <summary>Coarse failure category controllers translate into HTTP status codes.</summary>
public enum ResultError
{
    None = 0,
    Validation = 1,   // 400
    Unauthorized = 2, // 401
    Conflict = 3,     // 409
    NotFound = 4      // 404
}
