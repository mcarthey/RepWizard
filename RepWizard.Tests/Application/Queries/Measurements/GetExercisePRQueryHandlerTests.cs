using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Exercises.GetExercisePR;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Queries.Measurements;

public class GetExercisePRQueryHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessions = new();
    private readonly GetExercisePRQueryHandler _handler;

    public GetExercisePRQueryHandlerTests()
    {
        _handler = new GetExercisePRQueryHandler(_sessions.Object);
    }

    [Fact]
    public async Task Handle_NoSessions_ReturnsEmptyList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession>());

        // Act
        var result = await _handler.Handle(new GetExercisePRQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_MultipleSessionsForExercise_ReturnsBestSet()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();

        var session1 = BuildSession(userId, exerciseId, "Squat", 100m, 5);
        var session2 = BuildSession(userId, exerciseId, "Squat", 120m, 5); // heavier weight but lower load
        var session3 = BuildSession(userId, exerciseId, "Squat", 110m, 8); // best load: 110 * 8 = 880

        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession> { session1, session2, session3 });

        // Act
        var result = await _handler.Handle(new GetExercisePRQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].ExerciseId.Should().Be(exerciseId);
        result.Value![0].BestWeightKg.Should().Be(110m); // session3 wins by total load (110*8=880 > 120*5=600)
        result.Value![0].BestReps.Should().Be(8);
        result.Value![0].BestLoad.Should().Be(880m); // 110 * 8
    }

    [Fact]
    public async Task Handle_MultipleExercises_ReturnsPRForEach()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var squatId = Guid.NewGuid();
        var deadliftId = Guid.NewGuid();

        var session = new WorkoutSession
        {
            UserId = userId,
            StartedAt = DateTime.UtcNow.AddDays(-1),
            CompletedAt = DateTime.UtcNow
        };

        AddExerciseWithSet(session, squatId, "Squat", 140m, 3);
        AddExerciseWithSet(session, deadliftId, "Deadlift", 180m, 3);

        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession> { session });

        // Act
        var result = await _handler.Handle(new GetExercisePRQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
        // Should be ordered by best load descending: deadlift (540) > squat (420)
        result.Value![0].ExerciseName.Should().Be("Deadlift");
        result.Value![1].ExerciseName.Should().Be("Squat");
    }

    [Fact]
    public async Task Handle_FilteredByExerciseId_ReturnsOnlyThatExercise()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var squatId = Guid.NewGuid();
        var deadliftId = Guid.NewGuid();
        var session = new WorkoutSession { UserId = userId, StartedAt = DateTime.UtcNow, CompletedAt = DateTime.UtcNow };
        AddExerciseWithSet(session, squatId, "Squat", 140m, 3);
        AddExerciseWithSet(session, deadliftId, "Deadlift", 180m, 3);

        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession> { session });

        // Act
        var result = await _handler.Handle(new GetExercisePRQuery(userId, squatId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].ExerciseId.Should().Be(squatId);
    }

    // Helpers

    private static WorkoutSession BuildSession(Guid userId, Guid exerciseId, string name, decimal weight, int reps)
    {
        var session = new WorkoutSession
        {
            UserId = userId,
            StartedAt = DateTime.UtcNow.AddDays(-1),
            CompletedAt = DateTime.UtcNow
        };
        AddExerciseWithSet(session, exerciseId, name, weight, reps);
        return session;
    }

    private static void AddExerciseWithSet(WorkoutSession session, Guid exerciseId, string name, decimal weight, int reps)
    {
        var se = new SessionExercise
        {
            WorkoutSessionId = session.Id,
            ExerciseId = exerciseId,
            Exercise = new Exercise { Id = exerciseId, Name = name }
        };
        se.Sets.Add(new ExerciseSet
        {
            WeightKg = weight,
            Reps = reps,
            SetType = SetType.Working,
            CompletedAt = DateTime.UtcNow
        });
        session.SessionExercises.Add(se);
    }
}
