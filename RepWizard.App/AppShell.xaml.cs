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
        // Routes use leaf names only — MAUI Shell can't do relative routing
        // to shell elements (tab routes like "today", "progress", "plan").
        // Navigate with the leaf name; Shell pushes onto the current tab's stack.
        Routing.RegisterRoute("active-session", typeof(ActiveSessionPage));
        Routing.RegisterRoute("exercise-detail", typeof(ExerciseDetailPage));
        Routing.RegisterRoute("session-detail", typeof(SessionDetailPage));
        Routing.RegisterRoute("charts", typeof(ChartsPage));
        Routing.RegisterRoute("measurements", typeof(MeasurementsPage));
        Routing.RegisterRoute("programs", typeof(ProgramsPage));
        Routing.RegisterRoute("program-detail", typeof(ProgramDetailPage));
        Routing.RegisterRoute("library", typeof(ExerciseLibraryPage));
        Routing.RegisterRoute("goals", typeof(GoalsPage));
        Routing.RegisterRoute("ai-chat", typeof(AiChatPage));
        Routing.RegisterRoute("settings", typeof(SettingsPage));
    }
}
