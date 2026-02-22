namespace RepWizard.Shared.Constants;

/// <summary>
/// Single source of truth for sync entity types and action strings.
/// Referenced by API endpoints, Infrastructure sync service, and tests.
/// </summary>
public static class SyncEntityTypes
{
    public const string WorkoutSession = "WorkoutSession";
    public const string BodyMeasurement = "BodyMeasurement";
}

/// <summary>
/// Single source of truth for sync action strings (Create, Update, Delete).
/// </summary>
public static class SyncActions
{
    public const string Create = "Create";
    public const string Update = "Update";
    public const string Delete = "Delete";
}
