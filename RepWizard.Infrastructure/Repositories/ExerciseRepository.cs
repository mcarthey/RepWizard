using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Repositories;

public class ExerciseRepository : Repository<Exercise>, IExerciseRepository
{
    public ExerciseRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Exercise>> GetByCategoryAsync(
        ExerciseCategory category, CancellationToken ct = default)
        => await _dbSet
            .Where(e => e.Category == category)
            .OrderBy(e => e.Name)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Exercise>> GetByMuscleGroupAsync(
        MuscleGroup muscle, CancellationToken ct = default)
    {
        // Since PrimaryMuscles is stored as JSON, we need to filter in memory
        // In a production PostgreSQL setup, this could use jsonb operators for performance
        var all = await _dbSet.ToListAsync(ct);
        return all
            .Where(e => e.PrimaryMuscles.Contains(muscle))
            .OrderBy(e => e.Name)
            .ToList();
    }

    public async Task<IReadOnlyList<Exercise>> SearchAsync(
        string query, CancellationToken ct = default)
    {
        var lowerQuery = query.ToLowerInvariant();
        return await _dbSet
            .Where(e => EF.Functions.Like(e.Name.ToLower(), $"%{lowerQuery}%")
                || EF.Functions.Like(e.Description.ToLower(), $"%{lowerQuery}%"))
            .OrderBy(e => e.Name)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Exercise>> GetByEquipmentAsync(
        Equipment equipment, CancellationToken ct = default)
        => await _dbSet
            .Where(e => e.Equipment == equipment)
            .OrderBy(e => e.Name)
            .ToListAsync(ct);
}
