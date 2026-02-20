using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

/// <summary>
/// Read-only repository interface for querying entities.
/// </summary>
public interface IReadRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetBySpecAsync(ISpecification<T> spec, CancellationToken ct = default);
    Task<int> CountAsync(ISpecification<T> spec, CancellationToken ct = default);
}
