using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RepWizard.Core.Interfaces;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;
using RepWizard.Infrastructure.Data;
using RepWizard.Infrastructure.Repositories;
using RepWizard.Infrastructure.Services;

namespace RepWizard.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers Infrastructure services for the ASP.NET Core API (PostgreSQL).
    /// </summary>
    public static IServiceCollection AddInfrastructurePostgres(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL connection string not found.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        RegisterRepositories(services);
        return services;
    }

    /// <summary>
    /// Registers Infrastructure services for the ASP.NET Core API (SQL Server / LocalDB).
    /// </summary>
    public static IServiceCollection AddInfrastructureSqlServer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SqlServer")
            ?? throw new InvalidOperationException("SqlServer connection string not found.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        RegisterRepositories(services);
        return services;
    }

    /// <summary>
    /// Registers Infrastructure services for the MAUI client (SQLite, offline-first).
    /// </summary>
    public static IServiceCollection AddInfrastructureSqlite(
        this IServiceCollection services,
        string databasePath)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite($"Data Source={databasePath}"));

        RegisterRepositories(services);
        return services;
    }

    /// <summary>
    /// Registers Infrastructure services for testing (SQLite in-memory or file-based).
    /// </summary>
    public static IServiceCollection AddInfrastructureForTesting(
        this IServiceCollection services,
        string? connectionString = null)
    {
        var connStr = connectionString ?? $"Data Source=:memory:";
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(connStr));

        RegisterRepositories(services);
        return services;
    }

    /// <summary>
    /// Registers the AnthropicChatService as IAiChatService.
    /// Call this separately in API host — not needed for MAUI client.
    /// Requires IHttpClientFactory and AiCoach:ApiKey in configuration.
    /// </summary>
    public static IServiceCollection AddAiChatService(this IServiceCollection services)
    {
        services.AddHttpClient("Anthropic");
        services.AddScoped<IAiChatService, AnthropicChatService>();
        return services;
    }

    /// <summary>
    /// Registers the JWT auth service. Call in API host.
    /// </summary>
    public static IServiceCollection AddAuthService(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, JwtAuthService>();
        return services;
    }

    private static void RegisterRepositories(IServiceCollection services)
    {
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkoutSessionRepository, WorkoutSessionRepository>();
        services.AddScoped<IExerciseRepository, ExerciseRepository>();
        services.AddScoped<IBodyMeasurementRepository, BodyMeasurementRepository>();
        services.AddScoped<IAiConversationRepository, AiConversationRepository>();
        services.AddScoped<ITrainingProgramRepository, TrainingProgramRepository>();
        services.AddScoped<ISyncService, SyncService>();
    }
}
