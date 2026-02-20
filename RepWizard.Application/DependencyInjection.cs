using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace RepWizard.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // MediatR is registered by the host (API or MAUI) pointing at this assembly
        // FluentValidation validators
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
