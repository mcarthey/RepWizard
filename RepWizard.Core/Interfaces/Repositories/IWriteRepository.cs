using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

/// <summary>
/// Write repository interface for persisting entity changes.
/// </summary>
public interface IWriteRepository<T> where T : BaseEntity
{
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Delete(T entity);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
