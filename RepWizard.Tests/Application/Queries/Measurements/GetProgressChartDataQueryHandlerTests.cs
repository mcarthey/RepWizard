using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Measurements.GetProgressChartData;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Queries.Measurements;

public class GetProgressChartDataQueryHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessions = new();
    private readonly Mock<IBodyMeasurementRepository> _measurements = new();
    private readonly GetProgressChartDataQueryHandler _handler;

    public GetProgressChartDataQueryHandlerTests()
    {
        _handler = new GetProgressChartDataQueryHandler(_sessions.Object, _measurements.Object);
    }

    [Fact]
    public async Task Handle_NoData_ReturnsEmptyChartData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession>());
        _measurements.Setup(r => r.GetForUserAsync(userId, null, default))
            .ReturnsAsync(new List<BodyMeasurement>());

        // Act
        var result = await _handler.Handle(new GetProgressChartDataQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.WeeklyVolume.Should().BeEmpty();
        result.Value.StrengthTrends.Should().BeEmpty();
        result.Value.BodyComposition.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_SessionsInSameWeek_AggregatesVolume()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var monday = GetMostRecentMonday();

        var session1 = BuildSessionWithVolume(userId, monday.AddDays(1), 1000m);
        var session2 = BuildSessionWithVolume(userId, monday.AddDays(3), 1500m);

        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession> { session1, session2 });
        _measurements.Setup(r => r.GetForUserAsync(userId, null, default))
            .ReturnsAsync(new List<BodyMeasurement>());

        // Act
        var result = await _handler.Handle(new GetProgressChartDataQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.WeeklyVolume.Should().HaveCount(1); // same week
        result.Value.WeeklyVolume[0].TotalVolume.Should().Be(2500m);
        result.Value.WeeklyVolume[0].SessionCount.Should().Be(2);
    }

    [Fact]
    public async Task Handle_BodyMeasurements_MapsToCompositionPoints()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _sessions.Setup(r => r.GetRecentSessionsAsync(userId, It.IsAny<int>(), default))
            .ReturnsAsync(new List<WorkoutSession>());

        var measurements = new List<BodyMeasurement>
        {
            new() { UserId = userId, RecordedAt = DateTime.UtcNow.AddDays(-30), WeightKg = 82m, BodyFatPercent = 18m },
            new() { UserId = userId, RecordedAt = DateTime.UtcNow.AddDays(-1), WeightKg = 80m, BodyFatPercent = 16m }
        };
        _measurements.Setup(r => r.GetForUserAsync(userId, null, default))
            .ReturnsAsync(measurements);

        // Act
        var result = await _handler.Handle(new GetProgressChartDataQuery(userId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.BodyComposition.Should().HaveCount(2);
        result.Value.BodyComposition[0].WeightKg.Should().Be(82m);
        result.Value.BodyComposition[1].WeightKg.Should().Be(80m);
        result.Value.BodyComposition[1].LeanBodyMassKg.Should().BeApproximately(67.2m, 0.1m);
    }

    // Helpers

    private static DateTime GetMostRecentMonday()
    {
        var today = DateTime.UtcNow.Date;
        var diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
        return today.AddDays(-diff);
    }

    private static WorkoutSession BuildSessionWithVolume(Guid userId, DateTime date, decimal totalVolume)
    {
        var session = new WorkoutSession
        {
            UserId = userId,
            StartedAt = date,
            CompletedAt = date.AddHours(1)
        };
        var se = new SessionExercise { WorkoutSessionId = session.Id };
        // Add a set where weight * reps = totalVolume (e.g. 100 * 10 = 1000)
        se.Sets.Add(new ExerciseSet
        {
            WeightKg = totalVolume / 10,
            Reps = 10,
            SetType = SetType.Working
        });
        session.SessionExercises.Add(se);
        return session;
    }
}
