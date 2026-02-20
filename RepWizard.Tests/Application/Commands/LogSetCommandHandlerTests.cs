using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Workouts.LogSet;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Commands;

public class LogSetCommandHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly LogSetCommandHandler _handler;

    public LogSetCommandHandlerTests()
    {
        _handler = new LogSetCommandHandler(_sessionRepo.Object);
    }

    private WorkoutSession BuildActiveSession(Guid? sessionId = null, Guid? exerciseId = null)
    {
        var session = new WorkoutSession
        {
            Id = sessionId ?? Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            StartedAt = DateTime.UtcNow
        };
        if (exerciseId.HasValue)
        {
            var se = new SessionExercise
            {
                Id = Guid.NewGuid(),
                WorkoutSessionId = session.Id,
                ExerciseId = exerciseId.Value,
                OrderIndex = 0
            };
            session.SessionExercises.Add(se);
        }
        return session;
    }

    [Fact]
    public async Task Handle_ValidSet_AddsSetAndReturnsDto()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();
        var session = BuildActiveSession(sessionId, exerciseId);

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);
        _sessionRepo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new LogSetCommand(
            sessionId, exerciseId, 1, 100m, 5, 2, 8.5m, "Working", null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Reps.Should().Be(5);
        result.Value.WeightKg.Should().Be(100m);
        result.Value.RPE.Should().Be(8.5m);
        result.Value.RepsInReserve.Should().Be(2);
        result.Value.SetType.Should().Be("Working");
        result.Value.CompletedAt.Should().NotBeNull();
        _sessionRepo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Handle_SessionNotFound_ReturnsFailure()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync((WorkoutSession?)null);

        var command = new LogSetCommand(
            sessionId, Guid.NewGuid(), 1, null, 10, null, null, "Working", null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_CompletedSession_ReturnsFailure()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = BuildActiveSession(sessionId);
        session.Complete();

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);

        var command = new LogSetCommand(
            sessionId, Guid.NewGuid(), 1, null, 10, null, null, "Working", null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("completed");
    }

    [Fact]
    public async Task Handle_NewExercise_CreatesSessionExerciseAutomatically()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var newExerciseId = Guid.NewGuid();
        var session = BuildActiveSession(sessionId); // no exercises yet

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);
        _sessionRepo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new LogSetCommand(
            sessionId, newExerciseId, 1, 50m, 12, null, null, "Working", null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        session.SessionExercises.Should().ContainSingle(se => se.ExerciseId == newExerciseId);
    }
}
