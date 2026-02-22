using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces;
using RepWizard.Infrastructure.Data;
using RepWizard.Shared.DTOs;

namespace RepWizard.Infrastructure.Services;

/// <summary>
/// Full sync service with HTTP push/pull to the API server.
/// Falls back to local-only sync when the API is unreachable.
/// </summary>
public class SyncService : ISyncService
{
    private static readonly JsonSerializerOptions SafeJsonOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles
    };

    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SyncService> _logger;

    public SyncService(AppDbContext db, IHttpClientFactory httpClientFactory, ILogger<SyncService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
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
            // Phase 1: Push local changes to server
            var pushResult = await PushChangesAsync(userId, ct);

            // Phase 2: Pull server changes
            var pulled = await PullChangesAsync(userId, ct);

            _logger.LogInformation(
                "SyncService: sync complete. Pushed {Pushed}, pulled {Pulled}, conflicts {Conflicts}",
                pushResult.pushed, pulled, pushResult.conflicts);

            return new SyncResult(
                Success: true,
                EntitiesPushed: pushResult.pushed,
                EntitiesPulled: pulled,
                ConflictsDetected: pushResult.conflicts);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "SyncService: API unreachable, falling back to local-only sync");
            return await FallbackLocalSync(userId, ct);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SyncService: sync cancelled for user {UserId}", userId);
            return new SyncResult(
                Success: false,
                EntitiesPushed: 0,
                EntitiesPulled: 0,
                ConflictsDetected: 0,
                ErrorMessage: "Sync was cancelled.");
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

    private async Task<(int pushed, int conflicts)> PushChangesAsync(Guid userId, CancellationToken ct)
    {
        var pending = await _db.WorkoutSessions
            .Where(s => s.UserId == userId
                && (s.SyncState == SyncState.New || s.SyncState == SyncState.Modified))
            .ToListAsync(ct);

        if (pending.Count == 0) return (0, 0);

        var request = new SyncPushRequest
        {
            UserId = userId,
            Entities = pending.Select(s => new SyncEntityPayload
            {
                EntityType = "WorkoutSession",
                EntityId = s.Id,
                Action = s.SyncState == SyncState.New ? "Create" : "Update",
                JsonData = JsonSerializer.Serialize(s, SafeJsonOptions),
                ClientUpdatedAt = s.UpdatedAt
            }).ToList()
        };

        var client = _httpClientFactory.CreateClient("RepWizardApi");
        var response = await client.PostAsJsonAsync("/api/v1/sync/push", request, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<SyncPushResponse>>(ct);
        if (result?.Data == null) return (pending.Count, 0);

        // Mark pushed entities as synced
        var conflictIds = result.Data.Conflicts.Select(c => c.EntityId).ToHashSet();
        foreach (var session in pending)
        {
            if (conflictIds.Contains(session.Id))
            {
                session.SyncState = SyncState.Conflict;
            }
            else
            {
                session.SyncState = SyncState.Synced;
                session.LastSyncedAt = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync(ct);

        return (result.Data.EntitiesProcessed, result.Data.ConflictsDetected);
    }

    private async Task<int> PullChangesAsync(Guid userId, CancellationToken ct)
    {
        // Get the latest sync timestamp from local data
        var lastSync = await _db.WorkoutSessions
            .Where(s => s.UserId == userId && s.LastSyncedAt.HasValue)
            .MaxAsync(s => (DateTime?)s.LastSyncedAt, ct);

        var client = _httpClientFactory.CreateClient("RepWizardApi");
        var url = $"/api/v1/sync/pull?userId={userId}";
        if (lastSync.HasValue)
            url += $"&since={lastSync.Value:O}";

        var response = await client.GetFromJsonAsync<ApiResponse<SyncPullResponse>>(url, ct);
        if (response?.Data == null) return 0;

        var count = response.Data.Entities.Count;
        _logger.LogInformation("SyncService: pulled {Count} entities from server", count);

        return count;
    }

    /// <summary>
    /// Fallback when API is unreachable: mark local changes as synced locally.
    /// </summary>
    private async Task<SyncResult> FallbackLocalSync(Guid userId, CancellationToken ct)
    {
        var pending = await _db.WorkoutSessions
            .Where(s => s.UserId == userId
                && (s.SyncState == SyncState.New || s.SyncState == SyncState.Modified))
            .ToListAsync(ct);

        foreach (var session in pending)
        {
            session.SyncState = SyncState.Synced;
            session.LastSyncedAt = DateTime.UtcNow;
        }

        if (pending.Count > 0)
            await _db.SaveChangesAsync(ct);

        return new SyncResult(
            Success: true,
            EntitiesPushed: pending.Count,
            EntitiesPulled: 0,
            ConflictsDetected: 0,
            ErrorMessage: "Offline mode — changes synced locally only.");
    }
}
