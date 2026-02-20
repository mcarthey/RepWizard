using FluentValidation;
using MediatR;
using RepWizard.Core.Common;

namespace RepWizard.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior that runs all registered FluentValidation validators
/// before the request reaches its handler. Returns Result.Failure with all
/// validation errors if any rules fail — never throws exceptions.
/// </summary>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next(cancellationToken);

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count == 0)
            return await next(cancellationToken);

        var errors = failures.Select(f => f.ErrorMessage).ToList();

        // If TResponse is Result<T>, return a typed failure without throwing.
        var responseType = typeof(TResponse);
        if (responseType.IsGenericType && responseType.GetGenericTypeDefinition() == typeof(Result<>))
        {
            var innerType = responseType.GetGenericArguments()[0];
            var failureMethod = typeof(Result<>)
                .MakeGenericType(innerType)
                .GetMethod(nameof(Result<object>.Failure), new[] { typeof(IEnumerable<string>) });
            return (TResponse)failureMethod!.Invoke(null, new object[] { errors })!;
        }

        // If TResponse is non-generic Result, return a failure directly.
        if (responseType == typeof(Result))
            return (TResponse)(object)Result.Failure(errors);

        // Fallback: throw so the endpoint can return a 400.
        throw new ValidationException(failures);
    }
}
