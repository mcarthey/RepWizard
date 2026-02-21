namespace RepWizard.Core.Entities;

/// <summary>
/// Records sync conflicts when server-wins resolution is applied.
/// Preserves the local copy so the user can review what was overwritten.
/// </summary>
public class ConflictLog : BaseEntity
{
    public Guid UserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string LocalJson { get; set; } = string.Empty;
    public string ServerJson { get; set; } = string.Empty;
    public string Resolution { get; set; } = "ServerWins";
    public DateTime ResolvedAt { get; set; } = DateTime.UtcNow;
    public bool Acknowledged { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}
