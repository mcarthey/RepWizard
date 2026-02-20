using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

/// <summary>
/// Workout session-specific repository operations.
/// </summary>
public interface IWorkoutSessionRepository : IRepository<WorkoutSession>
{
    Task<WorkoutSession?> GetActiveSessionForUserAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<WorkoutSession>> GetRecentSessionsAsync(Guid userId, int days = 14, CancellationToken ct = default);
    Task<WorkoutSession?> GetWithExercisesAndSetsAsync(Guid sessionId, CancellationToken ct = default);

    /// <summary>Returns completed sessions for a user, ordered by most recent, with pagination.</summary>
    Task<(IReadOnlyList<WorkoutSession> Items, int TotalCount)> GetSessionHistoryAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default);
}
