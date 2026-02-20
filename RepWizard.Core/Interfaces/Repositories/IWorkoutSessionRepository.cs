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
}
