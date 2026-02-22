using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Repositories;

public class TrainingProgramRepository : Repository<TrainingProgram>, ITrainingProgramRepository
{
    public TrainingProgramRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<TrainingProgram?> GetWithWeeksAndDaysAsync(
        Guid programId, CancellationToken ct = default)
        => await _dbSet.AsNoTracking()
            .Include(p => p.Weeks.OrderBy(w => w.WeekNumber))
                .ThenInclude(w => w.Days.OrderBy(d => d.DayOfWeek))
                    .ThenInclude(d => d.WorkoutTemplate)
            .FirstOrDefaultAsync(p => p.Id == programId, ct);

    public async Task<IReadOnlyList<TrainingProgram>> GetForUserAsync(
        Guid userId, CancellationToken ct = default)
        => await _dbSet.AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task<TrainingProgram?> GetActiveForUserAsync(
        Guid userId, CancellationToken ct = default)
        => await _dbSet.AsNoTracking()
            .Include(p => p.Weeks.OrderBy(w => w.WeekNumber))
                .ThenInclude(w => w.Days.OrderBy(d => d.DayOfWeek))
                    .ThenInclude(d => d.WorkoutTemplate)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.IsActive, ct);
}
