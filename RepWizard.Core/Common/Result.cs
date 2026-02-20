namespace RepWizard.Core.Common;

/// <summary>
/// Discriminated union result type for explicit success/failure handling.
/// Never use exception-driven control flow for expected failure states — use Result&lt;T&gt; instead.
/// </summary>
public class Result<T>
{
    private Result(T? value, bool isSuccess, string? error, IEnumerable<string>? errors = null)
    {
        Value = value;
        IsSuccess = isSuccess;
        Error = error;
        Errors = errors?.ToList() ?? new List<string>();
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public T? Value { get; }
    public string? Error { get; }
    public IReadOnlyList<string> Errors { get; }

    public static Result<T> Success(T value) => new(value, true, null);

    public static Result<T> Failure(string error) => new(default, false, error, new[] { error });

    public static Result<T> Failure(IEnumerable<string> errors)
    {
        var errorList = errors.ToList();
        return new(default, false, errorList.FirstOrDefault(), errorList);
    }

    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<string, TOut> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

/// <summary>
/// Non-generic Result for operations that do not return a value.
/// </summary>
public class Result
{
    private Result(bool isSuccess, string? error, IEnumerable<string>? errors = null)
    {
        IsSuccess = isSuccess;
        Error = error;
        Errors = errors?.ToList() ?? new List<string>();
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; }
    public IReadOnlyList<string> Errors { get; }

    public static Result Success() => new(true, null);

    public static Result Failure(string error) => new(false, error, new[] { error });

    public static Result Failure(IEnumerable<string> errors)
    {
        var errorList = errors.ToList();
        return new(false, errorList.FirstOrDefault(), errorList);
    }
}
