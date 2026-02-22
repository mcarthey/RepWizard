using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Infrastructure.Data;
using RepWizard.Infrastructure.Services;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Infrastructure.Services;

public class SyncServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly Mock<ILogger<SyncService>> _loggerMock;

    public SyncServiceTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
        _loggerMock = new Mock<ILogger<SyncService>>();
    }

    // --- HasPendingChangesAsync ---

    [Fact]
    public async Task HasPendingChanges_NoPendingSessions_ReturnsFalse()
    {
        var userId = await SeedUserAndSession(SyncState.Synced);

        var sut = CreateSyncService();

        var result = await sut.HasPendingChangesAsync(userId);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasPendingChanges_NewSession_ReturnsTrue()
    {
        var userId = await SeedUserAndSession(SyncState.New);

        var sut = CreateSyncService();

        var result = await sut.HasPendingChangesAsync(userId);

        result.Should().BeTrue();
    }

    // --- SyncAsync — Happy Path ---

    [Fact]
    public async Task SyncAsync_PendingSessions_PushesAndReturnsCounts()
    {
        var userId = await SeedUserAndSessions(SyncState.New, 2);

        var pushResponse = new ApiResponse<SyncPushResponse>
        {
            Success = true,
            Data = new SyncPushResponse
            {
                Success = true,
                EntitiesProcessed = 2,
                ConflictsDetected = 0,
                Conflicts = new List<SyncConflictDto>()
            }
        };

        var handler = CreatePushPullHandler(pushResponse);
        var sut = CreateSyncService(handler);

        var result = await sut.SyncAsync(userId);

        result.Success.Should().BeTrue();
        result.EntitiesPushed.Should().Be(2);
        result.EntitiesPulled.Should().Be(0);
    }

    [Fact]
    public async Task SyncAsync_NoPendingSessions_SkipsPush()
    {
        var userId = await SeedUserAndSession(SyncState.Synced);

        var pushCalled = false;
        var handler = new MockHttpMessageHandler(request =>
        {
            if (request.RequestUri!.PathAndQuery.Contains("/sync/push"))
            {
                pushCalled = true;
                return CreateJsonResponse(new ApiResponse<SyncPushResponse>());
            }
            if (request.RequestUri.PathAndQuery.Contains("/sync/pull"))
                return CreateJsonResponse(CreateEmptyPullResponse());
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        });

        var sut = CreateSyncService(handler);

        var result = await sut.SyncAsync(userId);

        result.Success.Should().BeTrue();
        result.EntitiesPushed.Should().Be(0);
        pushCalled.Should().BeFalse();
    }

    // --- SyncAsync — Conflict Handling ---

    [Fact]
    public async Task SyncAsync_ServerReturnsConflict_MarksSessionAsConflict()
    {
        var userId = await SeedUserAndSession(SyncState.New);
        var sessionId = await _context.WorkoutSessions
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .FirstAsync();

        var pushResponse = new ApiResponse<SyncPushResponse>
        {
            Success = true,
            Data = new SyncPushResponse
            {
                Success = true,
                EntitiesProcessed = 1,
                ConflictsDetected = 1,
                Conflicts = new List<SyncConflictDto>
                {
                    new()
                    {
                        EntityId = sessionId,
                        EntityType = "WorkoutSession",
                        Resolution = "ServerWins"
                    }
                }
            }
        };

        var handler = CreatePushPullHandler(pushResponse);
        var sut = CreateSyncService(handler);

        var result = await sut.SyncAsync(userId);

        result.ConflictsDetected.Should().Be(1);

        var dbSession = await _context.WorkoutSessions.FindAsync(sessionId);
        dbSession!.SyncState.Should().Be(SyncState.Conflict);
    }

    // --- SyncAsync — Error Handling ---

    [Fact]
    public async Task SyncAsync_ApiUnreachable_FallsBackToLocalSync()
    {
        var userId = await SeedUserAndSession(SyncState.New);

        var handler = new MockHttpMessageHandler(_ =>
            throw new HttpRequestException("Connection refused"));

        var sut = CreateSyncService(handler);

        var result = await sut.SyncAsync(userId);

        result.Success.Should().BeTrue();
        result.ErrorMessage.Should().Contain("Offline mode");
    }

    [Fact]
    public async Task SyncAsync_Cancelled_ReturnsCancelledResult()
    {
        var userId = await SeedUserAndSession(SyncState.New);

        var cts = new CancellationTokenSource();
        cts.Cancel();

        var sut = CreateSyncService();

        var result = await sut.SyncAsync(userId, cts.Token);

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("cancelled");
    }

    [Fact]
    public async Task SyncAsync_UnexpectedException_ReturnsFailure()
    {
        var userId = await SeedUserAndSession(SyncState.New);

        var handler = new MockHttpMessageHandler(_ =>
            throw new InvalidOperationException("boom"));

        var sut = CreateSyncService(handler);

        var result = await sut.SyncAsync(userId);

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("boom");
    }

    // --- Helpers ---

    /// <summary>
    /// Seeds a user and session, then clears the change tracker to avoid navigation
    /// property fixup that causes circular reference errors during JSON serialization
    /// in SyncService.PushChangesAsync.
    /// </summary>
    private async Task<Guid> SeedUserAndSession(SyncState syncState)
    {
        var user = new User
        {
            Name = "Test User",
            Email = $"test-{Guid.NewGuid():N}@example.com",
            PasswordHash = "hashed",
            FitnessGoal = FitnessGoal.StrengthGain,
            ExperienceLevel = ExperienceLevel.Intermediate
        };
        var session = new WorkoutSession
        {
            UserId = user.Id,
            StartedAt = DateTime.UtcNow.AddHours(-1),
            SyncState = syncState
        };

        _context.Users.Add(user);
        _context.WorkoutSessions.Add(session);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        return user.Id;
    }

    private async Task<Guid> SeedUserAndSessions(SyncState syncState, int count)
    {
        var user = new User
        {
            Name = "Test User",
            Email = $"test-{Guid.NewGuid():N}@example.com",
            PasswordHash = "hashed",
            FitnessGoal = FitnessGoal.StrengthGain,
            ExperienceLevel = ExperienceLevel.Intermediate
        };

        _context.Users.Add(user);
        for (var i = 0; i < count; i++)
        {
            _context.WorkoutSessions.Add(new WorkoutSession
            {
                UserId = user.Id,
                StartedAt = DateTime.UtcNow.AddHours(-1 - i),
                SyncState = syncState
            });
        }
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        return user.Id;
    }

    private SyncService CreateSyncService(MockHttpMessageHandler? handler = null)
    {
        handler ??= new MockHttpMessageHandler(_ =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));

        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://localhost") };
        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient("RepWizardApi")).Returns(httpClient);

        return new SyncService(_context, factoryMock.Object, _loggerMock.Object);
    }

    private static MockHttpMessageHandler CreatePushPullHandler(
        ApiResponse<SyncPushResponse> pushResponse)
    {
        return new MockHttpMessageHandler(request =>
        {
            if (request.RequestUri!.PathAndQuery.Contains("/sync/push"))
                return CreateJsonResponse(pushResponse);
            if (request.RequestUri.PathAndQuery.Contains("/sync/pull"))
                return CreateJsonResponse(CreateEmptyPullResponse());
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        });
    }

    private static ApiResponse<SyncPullResponse> CreateEmptyPullResponse() => new()
    {
        Success = true,
        Data = new SyncPullResponse
        {
            Entities = new List<SyncEntityPayload>(),
            ServerTimestamp = DateTime.UtcNow
        }
    };

    private static Task<HttpResponseMessage> CreateJsonResponse<T>(T data)
    {
        var json = JsonSerializer.Serialize(data);
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };
        return Task.FromResult(response);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, Task<HttpResponseMessage>> _handler;

        public MockHttpMessageHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handler)
            => _handler = handler;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => _handler(request);
    }
}
