using Microsoft.Extensions.DependencyInjection;
using RepWizard.UI.Pages;
using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Services;

/// <summary>
/// Extension methods for registering all ViewModels and Pages with DI.
/// Keeps MauiProgram.cs clean and ensures all pages and ViewModels are registered.
/// </summary>
public static class ViewModelRegistration
{
    public static IServiceCollection RegisterViewModels(this IServiceCollection services)
    {
        services.AddTransient<TodayViewModel>();
        services.AddTransient<ActiveSessionViewModel>();
        services.AddTransient<ProgressViewModel>();
        services.AddTransient<SessionDetailViewModel>();
        services.AddTransient<MeasurementsViewModel>();
        services.AddTransient<ChartsViewModel>();
        services.AddTransient<CoachViewModel>();
        return services;
    }

    public static IServiceCollection RegisterPages(this IServiceCollection services)
    {
        services.AddTransient<TodayPage>();
        services.AddTransient<ActiveSessionPage>();
        services.AddTransient<ExerciseDetailPage>();
        services.AddTransient<ProgressPage>();
        services.AddTransient<SessionDetailPage>();
        services.AddTransient<ChartsPage>();
        services.AddTransient<MeasurementsPage>();
        services.AddTransient<CoachPage>();
        services.AddTransient<ProgramsPage>();
        services.AddTransient<ProgramDetailPage>();
        services.AddTransient<ExerciseLibraryPage>();
        services.AddTransient<SettingsPage>();
        return services;
    }
}
