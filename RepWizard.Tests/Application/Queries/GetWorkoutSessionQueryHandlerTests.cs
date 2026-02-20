using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Workouts.GetWorkoutSession;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Queries;

public class GetWorkoutSessionQueryHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly GetWorkoutSessionQueryHandler _handler;

    public GetWorkoutSessionQueryHandlerTests()
    {
        _handler = new GetWorkoutSessionQueryHandler(_sessionRepo.Object);
    }

    [Fact]
    public async Task Handle_ExistingSession_ReturnsDto()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var session = new WorkoutSession
        {
            Id = sessionId,
            UserId = userId,
            StartedAt = DateTime.UtcNow.AddMinutes(-20)
        };

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);

        var query = new GetWorkoutSessionQuery(sessionId);

        // Act
        var result = await _handler.Handle(query, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(sessionId);
        result.Value.UserId.Should().Be(userId);
        result.Value.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_SessionNotFound_ReturnsFailure()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync((WorkoutSession?)null);

        var query = new GetWorkoutSessionQuery(sessionId);

        // Act
        var result = await _handler.Handle(query, default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_SessionWithExercisesAndSets_MapsCorrectly()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();
        var session = new WorkoutSession
        {
            Id = sessionId,
            UserId = Guid.NewGuid(),
            StartedAt = DateTime.UtcNow.AddMinutes(-30)
        };

        var se = new SessionExercise
        {
            Id = Guid.NewGuid(),
            WorkoutSessionId = sessionId,
            ExerciseId = exerciseId,
            OrderIndex = 0,
            Exercise = new Exercise { Id = exerciseId, Name = "Squat" }
        };
        se.Sets.Add(new ExerciseSet
        {
            SetNumber = 1,
            WeightKg = 140m,
            Reps = 5,
            RPE = 8m,
            SetType = Core.Enums.SetType.Working,
            CompletedAt = DateTime.UtcNow
        });
        session.SessionExercises.Add(se);

        _sessionRepo.Setup(r => r.GetWithExercisesAndSetsAsync(sessionId, default))
            .ReturnsAsync(session);

        // Act
        var result = await _handler.Handle(new GetWorkoutSessionQuery(sessionId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.SessionExercises.Should().HaveCount(1);
        result.Value.SessionExercises[0].ExerciseName.Should().Be("Squat");
        result.Value.SessionExercises[0].Sets.Should().HaveCount(1);
        result.Value.SessionExercises[0].Sets[0].WeightKg.Should().Be(140m);
        result.Value.SessionExercises[0].Sets[0].RPE.Should().Be(8m);
    }
}
