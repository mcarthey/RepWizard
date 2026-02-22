namespace RepWizard.Shared.DTOs;

public class SyncPushRequest
{
    public Guid UserId { get; set; }
    public IList<SyncEntityPayload> Entities { get; set; } = new List<SyncEntityPayload>();
}

public class SyncEntityPayload
{
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty; // Use SyncActions constants
    public string JsonData { get; set; } = string.Empty;
    public DateTime ClientUpdatedAt { get; set; }
}

public class SyncPushResponse
{
    public bool Success { get; set; }
    public int EntitiesProcessed { get; set; }
    public int ConflictsDetected { get; set; }
    public IList<SyncConflictDto> Conflicts { get; set; } = new List<SyncConflictDto>();
}

public class SyncPullRequest
{
    public Guid UserId { get; set; }
    public DateTime? Since { get; set; }
}

public class SyncPullResponse
{
    public IList<SyncEntityPayload> Entities { get; set; } = new List<SyncEntityPayload>();
    public DateTime ServerTimestamp { get; set; }
}

public class SyncConflictDto
{
    public Guid EntityId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string LocalJson { get; set; } = string.Empty;
    public string ServerJson { get; set; } = string.Empty;
    public string Resolution { get; set; } = string.Empty;
}

public class ConflictLogDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Resolution { get; set; } = string.Empty;
    public DateTime ResolvedAt { get; set; }
    public bool Acknowledged { get; set; }
}
