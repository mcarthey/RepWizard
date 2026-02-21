using RepWizard.UI.Pages;

namespace RepWizard.App;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        RegisterRoutes();
    }

    private static void RegisterRoutes()
    {
        // Today section routes
        Routing.RegisterRoute("today/active-session", typeof(ActiveSessionPage));
        Routing.RegisterRoute("today/exercise-detail", typeof(ExerciseDetailPage));

        // Progress section routes
        Routing.RegisterRoute("progress/session", typeof(SessionDetailPage));
        Routing.RegisterRoute("progress/charts", typeof(ChartsPage));
        Routing.RegisterRoute("progress/measurements", typeof(MeasurementsPage));

        // Coach section routes
        Routing.RegisterRoute("coach/programs", typeof(ProgramsPage));
        Routing.RegisterRoute("coach/program", typeof(ProgramDetailPage));
        Routing.RegisterRoute("coach/library", typeof(ExerciseLibraryPage));
        Routing.RegisterRoute("coach/library/detail", typeof(ExerciseDetailPage));

        // Settings
        Routing.RegisterRoute("settings", typeof(SettingsPage));
    }
}
