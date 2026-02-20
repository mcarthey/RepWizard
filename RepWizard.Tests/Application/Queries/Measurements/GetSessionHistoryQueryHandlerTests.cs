using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Workouts.GetSessionHistory;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Queries.Measurements;

public class GetSessionHistoryQueryHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessions = new();
    private readonly GetSessionHistoryQueryHandler _handler;

    public GetSessionHistoryQueryHandlerTests()
    {
        _handler = new GetSessionHistoryQueryHandler(_sessions.Object);
    }

    [Fact]
    public async Task Handle_UserWithSessions_ReturnsPaged()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var session1 = new WorkoutSession
        {
            Id = Guid.NewGuid(), UserId = userId,
            StartedAt = DateTime.UtcNow.AddDays(-1),
            CompletedAt = DateTime.UtcNow.AddDays(-1).AddHours(1)
        };
        var session2 = new WorkoutSession
        {
            Id = Guid.NewGuid(), UserId = userId,
            StartedAt = DateTime.UtcNow.AddDays(-3),
            CompletedAt = DateTime.UtcNow.AddDays(-3).AddHours(1)
        };

        _sessions.Setup(r => r.GetSessionHistoryAsync(userId, 1, 20, default))
            .ReturnsAsync((new List<WorkoutSession> { session1, session2 }, 2));

        // Act
        var result = await _handler.Handle(new GetSessionHistoryQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Items.Should().HaveCount(2);
        result.Value.TotalCount.Should().Be(2);
        result.Value.Page.Should().Be(1);
    }

    [Fact]
    public async Task Handle_EmptyHistory_ReturnsEmptyPaged()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _sessions.Setup(r => r.GetSessionHistoryAsync(userId, 1, 20, default))
            .ReturnsAsync((new List<WorkoutSession>(), 0));

        // Act
        var result = await _handler.Handle(new GetSessionHistoryQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Items.Should().BeEmpty();
        result.Value.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_SessionWithSets_CalculatesTotalVolume()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var session = new WorkoutSession
        {
            Id = Guid.NewGuid(), UserId = userId,
            StartedAt = DateTime.UtcNow.AddDays(-1),
            CompletedAt = DateTime.UtcNow.AddDays(-1).AddHours(1)
        };
        var se = new SessionExercise { WorkoutSessionId = session.Id };
        se.Sets.Add(new ExerciseSet { WeightKg = 100m, Reps = 5, SetType = Core.Enums.SetType.Working });
        se.Sets.Add(new ExerciseSet { WeightKg = 100m, Reps = 5, SetType = Core.Enums.SetType.Working });
        session.SessionExercises.Add(se);

        _sessions.Setup(r => r.GetSessionHistoryAsync(userId, 1, 20, default))
            .ReturnsAsync((new List<WorkoutSession> { session }, 1));

        // Act
        var result = await _handler.Handle(new GetSessionHistoryQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Items[0].TotalVolume.Should().Be(1000m);
        result.Value.Items[0].TotalSets.Should().Be(2);
    }
}
