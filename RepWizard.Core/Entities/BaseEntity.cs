using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// Base entity providing common audit fields, soft-delete, and sync state for all domain entities.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public SyncState SyncState { get; set; } = SyncState.New;
    public DateTime? LastSyncedAt { get; set; }
}
