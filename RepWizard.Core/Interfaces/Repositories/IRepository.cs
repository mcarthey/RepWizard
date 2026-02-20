using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

/// <summary>
/// Combined read/write repository interface.
/// </summary>
public interface IRepository<T> : IReadRepository<T>, IWriteRepository<T> where T : BaseEntity
{
}
