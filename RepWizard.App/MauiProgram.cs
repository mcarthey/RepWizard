using CommunityToolkit.Maui;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Logging;
using RepWizard.Application;
using RepWizard.Core.Interfaces;
using RepWizard.Infrastructure;
using RepWizard.UI.Services;

namespace RepWizard.App;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();

        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Infrastructure — SQLite for offline-first MAUI client
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "RepWizard.db");
        builder.Services.AddInfrastructureSqlite(dbPath);

        // Application layer
        builder.Services.AddApplication();

        // MediatR — scans Application assembly
        builder.Services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(Application.DependencyInjection).Assembly));

        // HttpClient factory with Polly resilience (retry + circuit breaker)
        var apiBaseUrl = builder.Configuration["ApiBaseUrl"] ?? "https://localhost:7001";
        builder.Services.AddHttpClient("RepWizardApi", client =>
        {
            client.BaseAddress = new Uri(apiBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        })
        .AddStandardResilienceHandler();

        // Navigation service
        builder.Services.AddSingleton<INavigationService, ShellNavigationService>();

        // Platform-specific services
        builder.Services.AddSingleton<IMotionPreferenceService, MotionPreferenceService>();

        // ViewModels — all registered as transient
        builder.Services.RegisterViewModels();

        // Pages — all registered as transient
        builder.Services.RegisterPages();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        var app = builder.Build();

        // Ensure database is created on first run
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Infrastructure.Data.AppDbContext>();
        db.Database.EnsureCreated();

        return app;
    }
}
