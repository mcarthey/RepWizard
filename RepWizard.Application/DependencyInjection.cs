using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using RepWizard.Application.Behaviors;

namespace RepWizard.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // FluentValidation — auto-discovers all AbstractValidator<T> in this assembly
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // MediatR pipeline: validation runs before every handler
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
