using MediatR;
using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Enums;
using RepWizard.Infrastructure.Data;
using RepWizard.Shared.Constants;
using RepWizard.Shared.DTOs;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RepWizard.Api.Endpoints;

public static class SyncEndpoints
{
    private static readonly JsonSerializerOptions SafeJsonOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles
    };

    public static IEndpointRouteBuilder MapSyncEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/sync")
            .WithTags("Sync")
            .RequireAuthorization();

        // POST /api/v1/sync/push — client pushes local changes to server
        group.MapPost("/push", async (
            SyncPushRequest request,
            AppDbContext db,
            CancellationToken ct) =>
        {
            var response = new SyncPushResponse { Success = true };

            foreach (var entity in request.Entities)
            {
                try
                {
                    await ProcessPushEntity(db, request.UserId, entity, response, ct);
                }
                catch (Exception ex)
                {
                    response.Conflicts.Add(new SyncConflictDto
                    {
                        EntityId = entity.EntityId,
                        EntityType = entity.EntityType,
                        LocalJson = entity.JsonData,
                        ServerJson = "",
                        Resolution = $"Error: {ex.Message}"
                    });
                    response.ConflictsDetected++;
                }
            }

            await db.SaveChangesAsync(ct);
            response.EntitiesProcessed = request.Entities.Count - response.ConflictsDetected;

            return Results.Ok(ApiResponse<SyncPushResponse>.Ok(response));
        })
        .WithName("SyncPush")
        .WithSummary("Push local changes from client to server");

        // GET /api/v1/sync/pull?userId={id}&since={timestamp}
        group.MapGet("/pull", async (
            Guid userId,
            DateTime? since,
            AppDbContext db,
            CancellationToken ct) =>
        {
            var sinceUtc = since ?? DateTime.MinValue;
            var entities = new List<SyncEntityPayload>();

            // Pull workout sessions updated since timestamp
            var sessions = await db.WorkoutSessions
                .Where(s => s.UserId == userId && s.UpdatedAt > sinceUtc)
                .ToListAsync(ct);
            foreach (var s in sessions)
            {
                entities.Add(new SyncEntityPayload
                {
                    EntityType = SyncEntityTypes.WorkoutSession,
                    EntityId = s.Id,
                    Action = s.IsDeleted ? SyncActions.Delete : SyncActions.Update,
                    JsonData = JsonSerializer.Serialize(s, SafeJsonOptions),
                    ClientUpdatedAt = s.UpdatedAt
                });
            }

            // Pull body measurements
            var measurements = await db.BodyMeasurements
                .Where(m => m.UserId == userId && m.UpdatedAt > sinceUtc)
                .ToListAsync(ct);
            foreach (var m in measurements)
            {
                entities.Add(new SyncEntityPayload
                {
                    EntityType = SyncEntityTypes.BodyMeasurement,
                    EntityId = m.Id,
                    Action = m.IsDeleted ? SyncActions.Delete : SyncActions.Update,
                    JsonData = JsonSerializer.Serialize(m, SafeJsonOptions),
                    ClientUpdatedAt = m.UpdatedAt
                });
            }

            return Results.Ok(ApiResponse<SyncPullResponse>.Ok(new SyncPullResponse
            {
                Entities = entities,
                ServerTimestamp = DateTime.UtcNow
            }));
        })
        .WithName("SyncPull")
        .WithSummary("Pull server changes since a given timestamp");

        return app;
    }

    private static async Task ProcessPushEntity(
        AppDbContext db,
        Guid userId,
        SyncEntityPayload entity,
        SyncPushResponse response,
        CancellationToken ct)
    {
        // Check for conflicts: if server version was updated after client version
        if (entity.EntityType == SyncEntityTypes.WorkoutSession)
        {
            var serverSession = await db.WorkoutSessions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Id == entity.EntityId, ct);

            if (serverSession != null && serverSession.UpdatedAt > entity.ClientUpdatedAt)
            {
                // Conflict: server-wins, preserve local copy
                var conflict = new Core.Entities.ConflictLog
                {
                    UserId = userId,
                    EntityType = entity.EntityType,
                    EntityId = entity.EntityId,
                    LocalJson = entity.JsonData,
                    ServerJson = JsonSerializer.Serialize(serverSession, SafeJsonOptions),
                    Resolution = "ServerWins",
                    ResolvedAt = DateTime.UtcNow
                };
                await db.ConflictLogs.AddAsync(conflict, ct);

                response.Conflicts.Add(new SyncConflictDto
                {
                    EntityId = entity.EntityId,
                    EntityType = entity.EntityType,
                    LocalJson = entity.JsonData,
                    ServerJson = conflict.ServerJson,
                    Resolution = "ServerWins"
                });
                response.ConflictsDetected++;
                return;
            }

            // No conflict — apply the client change
            if (serverSession == null)
            {
                var newSession = JsonSerializer.Deserialize<Core.Entities.WorkoutSession>(entity.JsonData);
                if (newSession != null)
                {
                    newSession.SyncState = SyncState.Synced;
                    newSession.LastSyncedAt = DateTime.UtcNow;
                    await db.WorkoutSessions.AddAsync(newSession, ct);
                }
            }
            else
            {
                // Update existing
                serverSession.SyncState = SyncState.Synced;
                serverSession.LastSyncedAt = DateTime.UtcNow;
                if (entity.Action == SyncActions.Delete)
                    serverSession.IsDeleted = true;
            }
        }
    }
}
