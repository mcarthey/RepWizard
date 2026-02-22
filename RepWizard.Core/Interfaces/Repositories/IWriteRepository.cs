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

    /// <summary>
    /// Explicitly marks a related entity as new (Added) for change tracking.
    /// Required when adding entities with client-generated Guid keys through navigation
    /// properties, because EF's sentinel check treats non-empty Guids as existing.
    /// </summary>
    void MarkAsNew(BaseEntity entity);
}
