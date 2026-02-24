using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

public interface ITrainingProgramRepository : IRepository<TrainingProgram>
{
    Task<TrainingProgram?> GetWithWeeksAndDaysAsync(Guid programId, CancellationToken ct = default);
    Task<IReadOnlyList<TrainingProgram>> GetForUserAsync(Guid userId, CancellationToken ct = default);
    Task<TrainingProgram?> GetActiveForUserAsync(Guid userId, CancellationToken ct = default);
    Task DeactivateAllForUserAsync(Guid userId, CancellationToken ct = default);
}
