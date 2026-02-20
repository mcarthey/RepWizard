using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Services;

/// <summary>
/// Phase 2 stub for ISyncService.
/// Tracks pending changes in SQLite and marks them as synced locally.
/// Real HTTP push/pull to the server API is a Phase 5 deliverable.
/// </summary>
public class SyncService : ISyncService
{
    private readonly AppDbContext _db;
    private readonly ILogger<SyncService> _logger;

    public SyncService(AppDbContext db, ILogger<SyncService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<bool> HasPendingChangesAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.WorkoutSessions
            .AnyAsync(s => s.UserId == userId
                && s.SyncState != SyncState.Synced, ct);
    }

    public async Task<SyncResult> SyncAsync(Guid userId, CancellationToken ct = default)
    {
        _logger.LogInformation("SyncService: starting sync for user {UserId}", userId);

        try
        {
            // Phase 2 stub: find all unsynced sessions for this user and mark them synced.
            // Phase 5 will replace this with actual HTTP push to POST /api/v1/sync/push.
            var pending = await _db.WorkoutSessions
                .Where(s => s.UserId == userId
                    && (s.SyncState == SyncState.New || s.SyncState == SyncState.Modified))
                .ToListAsync(ct);

            foreach (var session in pending)
            {
                session.SyncState = SyncState.Synced;
                session.LastSyncedAt = DateTime.UtcNow;
            }

            var pushed = pending.Count;
            if (pushed > 0)
                await _db.SaveChangesAsync(ct);

            _logger.LogInformation(
                "SyncService: stub sync complete. Marked {Count} session(s) as synced for user {UserId}",
                pushed, userId);

            return new SyncResult(
                Success: true,
                EntitiesPushed: pushed,
                EntitiesPulled: 0,
                ConflictsDetected: 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SyncService: sync failed for user {UserId}", userId);
            return new SyncResult(
                Success: false,
                EntitiesPushed: 0,
                EntitiesPulled: 0,
                ConflictsDetected: 0,
                ErrorMessage: ex.Message);
        }
    }
}
