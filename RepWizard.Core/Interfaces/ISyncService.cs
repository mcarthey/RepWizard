namespace RepWizard.Core.Interfaces;

/// <summary>
/// Background service for syncing local SQLite data to the server API.
/// Runs on app resume and on explicit user trigger.
/// Default conflict resolution: server-wins, local copy preserved in ConflictLog.
/// </summary>
public interface ISyncService
{
    Task<SyncResult> SyncAsync(Guid userId, CancellationToken ct = default);
    Task<bool> HasPendingChangesAsync(Guid userId, CancellationToken ct = default);
}

public record SyncResult(
    bool Success,
    int EntitiesPushed,
    int EntitiesPulled,
    int ConflictsDetected,
    string? ErrorMessage = null
);
