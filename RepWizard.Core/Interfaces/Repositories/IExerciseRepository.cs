using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Core.Interfaces.Repositories;

/// <summary>
/// Exercise library repository with filtering and search capabilities.
/// </summary>
public interface IExerciseRepository : IRepository<Exercise>
{
    Task<IReadOnlyList<Exercise>> GetByCategoryAsync(ExerciseCategory category, CancellationToken ct = default);
    Task<IReadOnlyList<Exercise>> GetByMuscleGroupAsync(MuscleGroup muscle, CancellationToken ct = default);
    Task<IReadOnlyList<Exercise>> SearchAsync(string query, CancellationToken ct = default);
    Task<IReadOnlyList<Exercise>> GetByEquipmentAsync(Equipment equipment, CancellationToken ct = default);
}
