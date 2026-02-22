using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Repositories;

public class WorkoutSessionRepository : Repository<WorkoutSession>, IWorkoutSessionRepository
{
    public WorkoutSessionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<WorkoutSession?> GetActiveSessionForUserAsync(Guid userId, CancellationToken ct = default)
        => await _dbSet
            .Include(s => s.SessionExercises)
                .ThenInclude(se => se.Sets)
            .Include(s => s.SessionExercises)
                .ThenInclude(se => se.Exercise)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.CompletedAt == null, ct);

    public async Task<IReadOnlyList<WorkoutSession>> GetRecentSessionsAsync(
        Guid userId, int days = 14, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        return await _dbSet.AsNoTracking()
            .Where(s => s.UserId == userId && s.StartedAt >= cutoff)
            .Include(s => s.Template)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync(ct);
    }

    public async Task<WorkoutSession?> GetWithExercisesAndSetsAsync(
        Guid sessionId, CancellationToken ct = default)
        => await _dbSet.AsNoTracking()
            .Include(s => s.SessionExercises.OrderBy(se => se.OrderIndex))
                .ThenInclude(se => se.Exercise)
            .Include(s => s.SessionExercises)
                .ThenInclude(se => se.Sets.OrderBy(set => set.SetNumber))
            .Include(s => s.Template)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

    public async Task<(IReadOnlyList<WorkoutSession> Items, int TotalCount)> GetSessionHistoryAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _dbSet.AsNoTracking()
            .Where(s => s.UserId == userId && s.CompletedAt != null)
            .Include(s => s.Template)
            .Include(s => s.SessionExercises)
                .ThenInclude(se => se.Sets)
            .OrderByDescending(s => s.StartedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
