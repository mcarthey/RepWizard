using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

/// <summary>
/// Repository for body composition measurement records.
/// </summary>
public interface IBodyMeasurementRepository : IRepository<BodyMeasurement>
{
    Task<IReadOnlyList<BodyMeasurement>> GetForUserAsync(
        Guid userId, int? limit = null, CancellationToken ct = default);

    Task<BodyMeasurement?> GetLatestForUserAsync(Guid userId, CancellationToken ct = default);
}
