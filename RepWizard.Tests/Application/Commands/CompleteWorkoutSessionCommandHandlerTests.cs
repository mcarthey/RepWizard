using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Commands;

public class CompleteWorkoutSessionCommandHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly Mock<ISyncService> _syncService = new();
    private readonly CompleteWorkoutSessionCommandHandler _handler;

    public CompleteWorkoutSessionCommandHandlerTests()
    {
        _syncService
            .Setup(s => s.SyncAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SyncResult(true, 0, 0, 0));

        _handler = new CompleteWorkoutSessionCommandHandler(
            _sessionRepo.Object, _syncService.Object);
    }

    [Fact]
    public async Task Handle_ActiveSession_CompletesAndReturnsSummary()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new WorkoutSession
        {
            Id = sessionId,
            UserId = Guid.NewGuid(),
            StartedAt = DateTime.UtcNow.AddMinutes(-45)
        };
        var se = new SessionExercise { Id = Guid.NewGuid(), WorkoutSessionId = sessionId };
        se.Sets.Add(new ExerciseSet { SetNumber = 1, WeightKg = 100m, Reps = 5, SetType = Core.Enums.SetType.Working, CompletedAt = DateTime.UtcNow });
        se.Sets.Add(new ExerciseSet { SetNumber = 2, WeightKg = 100m, Reps = 5, SetType = Core.Enums.SetType.Working, CompletedAt = DateTime.UtcNow });
        session.SessionExercises.Add(se);

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);
        _sessionRepo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new CompleteWorkoutSessionCommand(sessionId);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.TotalSets.Should().Be(2);
        result.Value.TotalVolume.Should().Be(1000m); // 100*5 + 100*5
        result.Value.DurationMinutes.Should().BeGreaterThan(0);
        session.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_SessionNotFound_ReturnsFailure()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync((WorkoutSession?)null);

        var command = new CompleteWorkoutSessionCommand(sessionId);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_AlreadyCompletedSession_ReturnsFailure()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new WorkoutSession
        {
            Id = sessionId,
            UserId = Guid.NewGuid(),
            StartedAt = DateTime.UtcNow.AddHours(-1)
        };
        session.Complete();

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);

        var command = new CompleteWorkoutSessionCommand(sessionId);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already completed");
    }

    [Fact]
    public async Task Handle_CompletesSession_TriggersSyncInBackground()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var session = new WorkoutSession
        {
            Id = sessionId,
            UserId = userId,
            StartedAt = DateTime.UtcNow.AddMinutes(-30)
        };

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);
        _sessionRepo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new CompleteWorkoutSessionCommand(sessionId);

        // Act
        var result = await _handler.Handle(command, default);

        // Allow background fire-and-forget to settle
        await Task.Delay(50);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _syncService.Verify(s => s.SyncAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
