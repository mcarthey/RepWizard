using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Repositories;

public class BodyMeasurementRepository : Repository<BodyMeasurement>, IBodyMeasurementRepository
{
    public BodyMeasurementRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<BodyMeasurement>> GetForUserAsync(
        Guid userId, int? limit = null, CancellationToken ct = default)
    {
        var query = _dbSet.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.RecordedAt);

        if (limit.HasValue)
            return await query.Take(limit.Value).ToListAsync(ct);

        return await query.ToListAsync(ct);
    }

    public async Task<BodyMeasurement?> GetLatestForUserAsync(Guid userId, CancellationToken ct = default)
        => await _dbSet.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.RecordedAt)
            .FirstOrDefaultAsync(ct);
}
