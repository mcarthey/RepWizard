using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Repositories;

/// <summary>
/// Generic EF Core repository implementation.
/// Handles standard CRUD operations and specification-based querying.
/// </summary>
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _dbSet.FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.ToListAsync(ct);

    public async Task<IReadOnlyList<T>> GetBySpecAsync(ISpecification<T> spec, CancellationToken ct = default)
    {
        var query = SpecificationEvaluator<T>.GetQuery(_dbSet.AsQueryable(), spec);
        return await query.ToListAsync(ct);
    }

    public async Task<int> CountAsync(ISpecification<T> spec, CancellationToken ct = default)
    {
        var query = SpecificationEvaluator<T>.GetQuery(_dbSet.AsQueryable(), spec);
        return await query.CountAsync(ct);
    }

    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await _dbSet.AddAsync(entity, ct);

    public void Update(T entity)
        => _dbSet.Update(entity);

    public void Delete(T entity)
    {
        // Soft delete
        entity.IsDeleted = true;
        entity.SyncState = Core.Enums.SyncState.Modified;
        _dbSet.Update(entity);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _context.SaveChangesAsync(ct);
}
